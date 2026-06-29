from fastapi import APIRouter, HTTPException, status
from app.models.message import MessageCreate, MessageUpdate
from app.services import message_service

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_message(message: MessageCreate):
    new_message = await message_service.create_message(message.model_dump())
    return {"status": "success", "data": new_message}

@router.get("/")
async def get_messages():
    messages = await message_service.retrieve_messages()
    return {"status": "success", "data": messages}

@router.put("/{id}")
async def put_message(id: str, payload: MessageUpdate):
    req = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = await message_service.update_message(id, req)
    if updated:
        return {"status": "success", "message": "Message updated successfully"}
    raise HTTPException(status_code=404, detail="Message not found")

@router.delete("/{id}")
async def remove_message(id: str):
    deleted = await message_service.delete_message(id)
    if deleted:
        return {"status": "success", "message": "Message deleted successfully"}
    raise HTTPException(status_code=404, detail="Message not found")