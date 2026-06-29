from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services import chat_service
from app.services.message_service import get_messages_by_chat

router = APIRouter()

# Input validator layout for creating a chat session
class ChatCreateInput(BaseModel):
    first_message: str = Field(..., example="Hello Clarix, let's start a chat session.")

@router.post("/", status_code=status.HTTP_201_CREATED)
async def start_new_chat(payload: ChatCreateInput):
    """
    Spins up a new parent chat session document using the first prompt string 
    as the visual sidebar title string.
    """
    if not payload.first_message.strip():
        raise HTTPException(status_code=400, detail="Initial chat message cannot be empty.")
    
    new_session = await chat_service.create_chat_session(payload.first_message)
    return {"status": "success", "data": new_session}

@router.get("/")
async def list_all_chat_sessions():
    """
    Retrieves all available chat parent records sorted by most recently used 
    to populate your sidebar panel.
    """
    sessions = await chat_service.get_all_chats()
    return {"status": "success", "data": sessions}

@router.delete("/{chat_id}")
async def remove_chat_session(chat_id: str):
    """
    Executes a clean cascade delete to erase the parent session document 
    and all associated child message records matching that key.
    """
    was_deleted = await chat_service.delete_chat_session(chat_id)
    if was_deleted:
        return {"status": "success", "message": "Chat session and all related history purged successfully."}
    raise HTTPException(status_code=404, detail="Target chat session not found.")

@router.get("/{chat_id}/messages")
async def fetch_chat_messages(chat_id: str):
    """
    Retrieves the complete, chronological message history for a specific 
    parent chat session to populate the UI chat window.
    """
    if not chat_id.strip():
        raise HTTPException(status_code=400, detail="Target chat_id cannot be blank.")
        
    messages = await get_messages_by_chat(chat_id)
    return {"status": "success", "chat_id": chat_id, "data": messages}