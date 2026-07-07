from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user

router = APIRouter()

# Notice the 'Depends(get_current_user)' parameter here.
# This single line is what locks the door!
@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns the currently logged-in user's profile data.
    FastAPI will not run this function unless the dependency succeeds.
    """
    
    # Because the guard already checked the database, we have the user's info!
    # We strip out the hashed password before returning it for security.
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "is_verified": current_user.get("is_verified", False)
    }