# server/app/routes/auth.py
from fastapi import APIRouter, status
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
async def login_user(payload: UserLogin):
    """
    Authenticates a user and returns a signed secure JWT. Rejects unverified accounts.
    """
    return await AuthService.login_user(payload)


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_otp(payload: OTPVerify):
    """
    Confirms the 6-digit token and turns the account status to active/verified.
    """
    return await AuthService.verify_user_otp(payload)


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