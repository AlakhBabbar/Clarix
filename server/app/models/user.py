from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional

# 1. The Registration Checkpoint (What React sends us)
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, example="Alakh")
    email: EmailStr = Field(..., example="alakh@example.com")
    password: str = Field(..., min_length=8, example="securePassword123!")

# 2. The Login Checkpoint (What React sends us)
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 3. The Database/Response Blueprint (What we send back to React)
class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    is_verified: bool
    created_at: datetime

    class Config:
        # This tells Pydantic it's okay to read data from MongoDB dictionaries
        from_attributes = True


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, example="123456")

class OTPResend(BaseModel):
    email: EmailStr

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, example="123456")
    new_password: str = Field(..., min_length=8, example="SecureP@ssw0rd")