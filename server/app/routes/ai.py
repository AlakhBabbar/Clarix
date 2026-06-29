from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from app.services.chat_orchestrator import orchestrate_chat_stream

router = APIRouter()

# Validator matching our relational database expectation
class OrchestratedChatInput(BaseModel):
    chat_id: str = Field(..., example="64b1f893e4b0c9a5d1234567")
    prompt: str = Field(..., example="Can you explain how databases handle indexing?")
    file_id: Optional[str] = None

@router.post("/chat")
async def handle_orchestrated_stream(payload: OrchestratedChatInput):
    """
    Accepts a user prompt and a parent chat ID, triggers database logging 
    and history resolution, and stream-renders responses via Server-Sent Events (SSE).
    """
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt string cannot be blank.")
        
    if not payload.chat_id.strip():
        raise HTTPException(status_code=400, detail="A valid target chat_id must be provided.")
        
    return StreamingResponse(
        orchestrate_chat_stream(
            chat_id=payload.chat_id, 
            user_content=payload.prompt,
            file_id=payload.file_id
        ),
        media_type="text/event-stream"
    )