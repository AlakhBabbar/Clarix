# server/app/core/config.py
import os
from dotenv import load_dotenv

load_dotenv()

# ---File Upload Config ---
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 
MAX_DOCUMENT_CHARS = 25000 

# --- SECURITY CONFIG ---
# You can generate a good secret by running this in your terminal: openssl rand -hex 32
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Tokens expire in 7 days

#------OTP EMAIL SERVICE CONFIG------
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")