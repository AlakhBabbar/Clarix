from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.services import chat_service
from app.services.message_service import get_messages_by_chat
from app.utils.dependencies import get_current_user


router = APIRouter()

# Input validator layout for creating a chat session
class ChatCreateInput(BaseModel):
    first_message: str = Field(..., example="Hello Clarix, let's start a chat session.")

@router.post("/", status_code=status.HTTP_201_CREATED)
async def start_new_chat(
    payload: ChatCreateInput,
    current_user: dict = Depends(get_current_user) #-----locking the door
):
    """
    Spins up a new parent chat session document using the first prompt string 
    as the visual sidebar title string.
    """
    if not payload.first_message.strip():
        raise HTTPException(status_code=400, detail="Initial chat message cannot be empty.")
    
    user_id = str(current_user["_id"])
    new_session = await chat_service.create_chat_session(payload.first_message, user_id)
    return {"status": "success", "data": new_session}

@router.get("/")
async def list_all_chat_sessions(current_user: dict = Depends(get_current_user)):
    """
    Retrieves all available chat parent records sorted by most recently used 
    to populate your sidebar panel.
    """
    user_id = str(current_user["_id"])
    sessions = await chat_service.get_all_chats(user_id)
    return {"status": "success", "data": sessions}

@router.delete("/{chat_id}")
async def remove_chat_session(chat_id: str, current_user: dict = Depends(get_current_user)):
    """
    Executes a total system purge:
    1. Wipes physical files from Supabase (Cloud Vault).
    2. Wipes file metadata from MongoDB Atlas.
    3. Wipes message history from MongoDB Atlas.
    4. Wipes the parent chat session.
    """
    if not chat_id.strip():
        raise HTTPException(status_code=400, detail="Target chat_id cannot be blank.")
    
    # We call the service layer which handles the full cascade cleanup
    user_id = str(current_user["_id"])
    was_deleted = await chat_service.delete_chat_session(chat_id, user_id)
    
    if was_deleted:
        return {
            "status": "success", 
            "message": "Full session and cloud vault assets purged successfully."
        }
        
    raise HTTPException(status_code=404, detail="Target chat session not found.")

@router.get("/{chat_id}/messages")
async def fetch_chat_messages(chat_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieves the complete, chronological message history for a specific 
    parent chat session to populate the UI chat window.
    """
    if not chat_id.strip():
        raise HTTPException(status_code=400, detail="Target chat_id cannot be blank.")
        
    messages = await get_messages_by_chat(chat_id)
    return {"status": "success", "chat_id": chat_id, "data": messages}