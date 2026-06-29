from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

class MessageCreate(BaseModel):
    role: str = Field(..., example="user")  # 'user' or 'assistant'
    message: str = Field(..., example="Hello Clarix!")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageUpdate(BaseModel):
    message: Optional[str] = None
    role: Optional[str] = None

def message_helper(message) -> dict:
    """Helper to transform MongoDB's _id object into a readable string"""
    return {
        "id": str(message["_id"]),
        "role": message["role"],
        "message": message["message"],
        "timestamp": message["timestamp"]
    }