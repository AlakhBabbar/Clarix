from datetime import datetime, timezone
from bson import ObjectId
from app.database import message_collection

async def create_message(chat_id: str, role: str, content: str, attachment: dict = None) -> dict:
    """
    Saves a message linked to a specific chat session.
    """
    new_message = {
        "chat_id": chat_id,    # <-- Foreign Key linking to the parent chat
        "role": role,          # "user" or "assistant"
        "content": content,
        "timestamp": datetime.now(timezone.utc)
    }

    if (attachment):
        new_message["attachment"] = attachment
    
    result = await message_collection.insert_one(new_message)
    new_message["_id"] = str(result.inserted_id)
    return new_message

async def get_messages_by_chat(chat_id: str) -> list:
    """
    Retrieves only the messages belonging to a specific chat session,
    sorted chronologically.
    """
    messages = []
    # Query strictly for this chat_id, oldest to newest
    cursor = message_collection.find({"chat_id": chat_id}).sort("timestamp", 1)
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "timestamp" in doc and doc["timestamp"]:
            doc["timestamp"] = doc["timestamp"].isoformat()
        messages.append(doc)
        
    return messages

async def delete_messages_by_chat_id(chat_id: str):
    """
    Bulk-deletes every message tied to a chat session. Used during chat cleanup.
    """
    await message_collection.delete_many({"chat_id": chat_id})
    return True