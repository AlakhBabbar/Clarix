# server/app/services/auth_service.py
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from app.database import database
from app.models.user import UserCreate, UserLogin, OTPVerify, OTPResend, ForgotPassword, ResetPassword
from app.utils.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    generate_otp
)
from app.services.email_services import EmailService
from app.utils.rate_limiter import check_email_rate_limit

class AuthService:
    user_collection = database.get_collection("users")
    otp_collection = database.get_collection("otps")

    @classmethod
    async def register_new_user(cls, payload: UserCreate):
        """Handles password hashing, user registration, and initial OTP minting."""
        existing_user = await cls.user_collection.find_one({"email": payload.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="A user with this email already exists."
            )

        now = datetime.now(timezone.utc)
        
        new_user_doc = {
            "name": payload.name,
            "email": payload.email,
            "hashed_password": get_password_hash(payload.password),
            "is_verified": False,
            "created_at": now
        }
        result = await cls.user_collection.insert_one(new_user_doc)
        new_user_doc["id"] = str(result.inserted_id)

        # Generate and store 6-digit verification code
        otp = generate_otp()
        await cls.otp_collection.update_one(
            {"email": payload.email},
            {"$set": {
                "hashed_otp": get_password_hash(otp),
                "expires_at": now + timedelta(minutes=5)
            }},
            upsert=True
        )

        # 2. TRIGGER BREVO API INSTEAD OF PRINTING
        await EmailService.send_otp_email(payload.email, otp)

        print(f"\n📨 [EMAIL SIMULATION] Sending OTP {otp} to {payload.email}\n")
        return new_user_doc

    @classmethod
    async def login_user(cls, payload: UserLogin):
        """Authenticates a user, checks email verification status, and issues a JWT."""
        user = await cls.user_collection.find_one({"email": payload.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials."
            )

        # 1. Verify password hash matches
        password_is_valid = verify_password(payload.password, user["hashed_password"])
        if not password_is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials."
            )

        # 2. Firewall: Block unverified users from gaining access
        if not user.get("is_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your email address is not verified. Please verify your account first."
            )

        # 3. Issue the JWT
        access_token = create_access_token(data={"sub": str(user["_id"])})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(user["_id"]),
            "name": user["name"]
        }

    @classmethod
    async def verify_user_otp(cls, payload: OTPVerify):
        """Validates the submitted OTP code against its expiration and hash limits."""
        now = datetime.now(timezone.utc)

        otp_record = await cls.otp_collection.find_one({"email": payload.email})
        user = await cls.user_collection.find_one({"email": payload.email})
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No verification request found for this email."
            )

        # Check expiration timestamp
        if now > otp_record["expires_at"].replace(tzinfo=timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new one."
            )

        # Validate code match using Argon2
        if not verify_password(payload.otp, otp_record["hashed_otp"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code."
            )

        # Activate the account
        await cls.user_collection.update_one(
            {"email": payload.email},
            {"$set": {"is_verified": True}}
        )

        # Clear used OTP record
        await cls.otp_collection.delete_one({"email": payload.email})
        access_token = create_access_token(data={"sub": str(user["_id"])})
        data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(user["_id"]),
            "name": user["name"]
        }

        return {"message": "Account successfully verified and activated.", "data": data}

    @classmethod
    async def resend_user_otp(cls, payload: OTPResend):
        """Generates and overwrites any existing OTP record with a fresh code sequence."""
        user = await cls.user_collection.find_one({"email": payload.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        if user.get("is_verified", False):
            return {"message": "Account is already verified."}

        otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        await cls.otp_collection.update_one(
            {"email": payload.email},
            {"$set": {
                "hashed_otp": get_password_hash(otp),
                "expires_at": expires_at
            }},
            upsert=True
        )

        # 3. TRIGGER BREVO API ON RESEND REQUEST
        await EmailService.send_otp_email(payload.email, otp)

        print(f"\n🔄 [EMAIL SIMULATION] Resending fresh OTP {otp} to {payload.email}\n")
        return {"message": "A new verification code has been sent."}
    

    @classmethod
    async def forgot_password(cls, payload: ForgotPassword):
        """
        Handles rate-limiting, OTP generation, and email dispatch for password resets.
        """
        # 1. Rate limit check (Throws 429 Too Many Requests if spammed)
        await check_email_rate_limit(payload.email, max_requests=3, window_minutes=15)

        # 2. Check if user actually exists
        user = await cls.user_collection.find_one({"email": payload.email})
        
        # Security Feature: Email Enumeration Prevention
        if not user:
            # We silently exit without error, so hackers don't know the email doesn't exist.
            return {"message": "If an account with that email exists, we have sent a password reset code."}

        # 3. Generate a 6-digit OTP and calculate expiration
        otp = generate_otp()
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=15)

        # 4. Store the OTP with strict security tracking
        await cls.otp_collection.update_one(
            {"email": payload.email},
            {"$set": {
                "hashed_otp": get_password_hash(otp),
                "expires_at": expires_at,
                "purpose": "password_reset", # CRITICAL: Distinguishes from account verification
                "attempts": 0                # CRITICAL: Tracks brute-force guesses
            }},
            upsert=True
        )

        # 5. Dispatch the email via Brevo
        await EmailService.send_password_reset_email(payload.email, otp)
        
        return {"message": "If an account with that email exists, we have sent a password reset code."}
    
    @classmethod
    async def reset_password(cls, payload: ResetPassword):
        """
        Validates the OTP, enforces brute-force limits, and updates the user's password.
        """
        now = datetime.now(timezone.utc)

        # 1. Fetch the OTP record strictly for password resets
        otp_record = await cls.otp_collection.find_one({
            "email": payload.email,
            "purpose": "password_reset"
        })

        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset request."
            )

        # 2. Brute-Force Check: Have they already failed 3 times?
        if otp_record.get("attempts", 0) >= 3:
            # Destroy the compromised OTP immediately
            await cls.otp_collection.delete_one({"_id": otp_record["_id"]})
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many failed attempts. This reset code has been destroyed for your security. Please request a new one."
            )

        # 3. Time Check: Has it been more than 15 minutes?
        if now > otp_record["expires_at"].replace(tzinfo=timezone.utc):
            await cls.otp_collection.delete_one({"_id": otp_record["_id"]})
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset code has expired. Please request a new one."
            )

        # 4. Math Check: Does the Argon2 hash match the code they typed?
        if not verify_password(payload.otp, otp_record["hashed_otp"]):
            # Increment the failed attempt counter in MongoDB by 1
            await cls.otp_collection.update_one(
                {"_id": otp_record["_id"]},
                {"$inc": {"attempts": 1}}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code."
            )

        # 5. SUCCESS: Hash the new password and update the user document
        hashed_new_password = get_password_hash(payload.new_password)
        await cls.user_collection.update_one(
            {"email": payload.email},
            {"$set": {"hashed_password": hashed_new_password}}
        )

        # 6. Cleanup: Destroy the used OTP so it can never be used again
        await cls.otp_collection.delete_one({"_id": otp_record["_id"]})

        return {"message": "Your password has been successfully reset. You may now log in."}
    