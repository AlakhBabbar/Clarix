from datetime import datetime, timezone
from bson import ObjectId
from app.database import chat_collection, database
from app.services.message_service import delete_messages_by_chat_id
from app.services.storage_service import delete_chat_vault_files

async def create_chat_session(first_message_preview: str, user_id: str) -> dict:
    """
    Spins up a new chat parent document. Uses the user's first prompt 
    as the temporary sidebar title.
    """
    now = datetime.now(timezone.utc)
    # Create a clean title (e.g., "Explain quantum computing..." -> max 30 chars)
    clean_title = first_message_preview[:30].strip() + "..." if len(first_message_preview) > 30 else first_message_preview

    new_chat = {
        "user_id": user_id,
        "title": clean_title,
        "created_at": now,
        "last_used": now
    }
    
    result = await chat_collection.insert_one(new_chat)
    new_chat["_id"] = str(result.inserted_id)
    return new_chat

async def get_all_chats(user_id: str) -> list:
    """
    Fetches all chat sessions for the UI sidebar, sorted by most recently used.
    """
    chats = []
    # <-- NEW: Filter the database query by user_id
    cursor = chat_collection.find({"user_id": user_id}).sort("last_used", -1)
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "last_used" in doc and doc["last_used"]:
            doc["last_used"] = doc["last_used"].isoformat()
        chats.append(doc)
    return chats

async def update_chat_timestamp(chat_id: str):
    """
    Bumps the 'last_used' field to NOW whenever a new message is sent in this chat.
    """
    await chat_collection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"last_used": datetime.now(timezone.utc)}}
    )

async def delete_chat_session(chat_id: str,user_id: str) -> bool:
    """
    THE TOTAL CASCADE DELETE:
    1. Finds all files in MongoDB and deletes them from the Supabase CDN.
    2. Wipes the file records from MongoDB.
    3. Wipes all child messages out of the message collection.
    4. Wipes the parent chat out of the chat collection.
    """
    # <-- NEW: Ensure the chat actually belongs to the user trying to delete it
    chat_parent = await chat_collection.find_one({
        "_id": ObjectId(chat_id),
        "user_id": user_id
    })
    if not chat_parent:
        return False

    # --- PHASE 1: THE FILE HEIST ---
    # Query MongoDB for every file ever linked to this chat
    cursor = database.files.find({"chat_id": chat_id})
    files_to_delete = await cursor.to_list(length=None)

    if files_to_delete:
        # Extract just the filenames so Supabase knows what to target
        filenames = [f["filename"] for f in files_to_delete]
        
        # Obliterate the physical files from the Cloud Vault
        await delete_chat_vault_files(chat_id, filenames)
        
        # Obliterate the file metadata records from MongoDB Atlas
        await database.files.delete_many({"chat_id": chat_id})

    # --- PHASE 2: THE MESSAGE PURGE ---
    await delete_messages_by_chat_id(chat_id)

    # --- PHASE 3: THE PARENT ASSASSINATION ---
    await chat_collection.delete_one({"_id": ObjectId(chat_id)})
    
    return True