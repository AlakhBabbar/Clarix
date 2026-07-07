from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from bson import ObjectId
from app.core.config import JWT_SECRET, JWT_ALGORITHM
from app.database import database

# Switch to HTTPBearer. This tells Swagger: "Just give the user a simple text box to paste their token."
security_scheme = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    Intercepts the request, validates the JWT, and returns the database user object.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1. The token is stored inside the 'credentials' object now
        token = credentials.credentials
        
        # 2. Decode the token mathematically
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # 3. Extract the user ID
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please log in again."
        )
    except jwt.InvalidTokenError:
        raise credentials_exception

    # 4. Look up the user in MongoDB
    user_collection = database.get_collection("users")
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    
    if user is None:
        raise credentials_exception

    return user