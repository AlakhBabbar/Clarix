# server/app/routes/auth.py
from fastapi import APIRouter, status, Response
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import UserCreate, UserLogin, UserResponse, OTPVerify, OTPResend, ForgotPassword, ResetPassword
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate):
    """
    Submits registration details, creates an unverified user account, and prints an operational OTP.
    """
    return await AuthService.register_new_user(payload)


@router.post("/login", status_code=status.HTTP_200_OK)
async def login_user(payload: UserLogin, response: Response):
    """
    Authenticates a user and returns a signed secure JWT. Rejects unverified accounts.
    """
    # 1. Get the raw token data from the AuthService
    auth_data = await AuthService.login_user(payload)
    
    # 2. Convert your expiration minutes into seconds for the cookie Max-Age
    max_age_seconds = ACCESS_TOKEN_EXPIRE_MINUTES * 60

    # 3. Command the browser to store the HttpOnly cookie
    response.set_cookie(
        key="clarix_token",
        value=auth_data["access_token"],
        httponly=True,
        secure=True,   # Set to True when you deploy this to HTTPS in production
        samesite="lax", # Protects against CSRF attacks
        max_age=max_age_seconds,
        path="/"        # Cookie is valid across the entire application
    )

    # 4. Return user details, but intentionally OMIT the access_token
    return {
        "user_id": auth_data["user_id"],
        "name": auth_data["name"],
        "message": "Successfully logged in."
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout_user(response: Response):
    """
    Logs the user out by commanding the browser to instantly destroy the HttpOnly cookie.
    """
    response.delete_cookie(
        key="clarix_token",
        httponly=True,
        secure=True,
        samesite="lax",
        path="/"
    )
    return {"message": "Successfully logged out."}


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_otp(payload: OTPVerify, response: Response):
    """
    Confirms the 6-digit token and turns the account status to active/verified.
    """
    verdict = await AuthService.verify_user_otp(payload) 
    value = verdict["data"]["access_token"]
    print(value)
    
    # 2. THE NEW PART: Command the browser to store the HttpOnly cookie
    max_age_seconds = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="clarix_token",
        value=value, # Issue the token just like in login
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=max_age_seconds,
        path="/"
    )
    return verdict


@router.post("/resend-otp", status_code=status.HTTP_200_OK)
async def resend_otp(payload: OTPResend):
    """
    Generates and outputs a fresh 6-digit security code for verification retry loops.
    """
    return await AuthService.resend_user_otp(payload)

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(payload: ForgotPassword):
    """
    Initiates the password reset flow. Sends an OTP if the user exists.
    """
    return await AuthService.forgot_password(payload)

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPassword):
    """
    Submits the OTP and a new password. Updates the database if valid.
    """
    return await AuthService.reset_password(payload)