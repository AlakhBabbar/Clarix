# server/app/utils/security.py
from datetime import datetime, timedelta, timezone
import jwt
import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.core.config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# 1. Initialize the Argon2 Hasher (uses OWASP recommended secure defaults)
ph = PasswordHasher()

def get_password_hash(password: str) -> str:
    """Hashes the password using modern Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a password against the Argon2 hash."""
    try:
        # Argon2's verify method raises an error if the password is wrong,
        # so we catch that error and return False instead.
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False

def create_access_token(data: dict) -> str:
    """
    Mints a new JSON Web Token (JWT).
    'data' usually contains {"sub": "user_id_here"}.
    """
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return encoded_jwt


def generate_otp() -> str:
    """Generates a cryptographically secure 6-digit numeric OTP."""
    # Generates a number between 100000 and 999999
    return str(secrets.SystemRandom().randint(100000, 999999))