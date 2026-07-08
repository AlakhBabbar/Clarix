from fastapi import Depends, HTTPException, status, Request
import jwt
from bson import ObjectId
from app.core.config import JWT_SECRET, JWT_ALGORITHM
from app.database import database

async def get_current_user(request: Request) -> dict:
    """
    Intercepts the request, extracts the JWT from the HttpOnly cookie, 
    validates it mathematically, and returns the database user object.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again."
    )

    # 1. Look inside the browser's cookie jar for our specific token
    token = request.cookies.get("clarix_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication cookie missing. Please log in."
        )

    try:
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

    # 4. Look up the user in MongoDB to ensure the account still exists
    user_collection = database.get_collection("users")
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    
    if user is None:
        raise credentials_exception

    return user