from bson import ObjectId
from app.services.ai_core import hf_stream_completion
from app.services.message_service import create_message, get_messages_by_chat
from app.services.chat_service import update_chat_timestamp
from app.database import database 

async def orchestrate_chat_stream(chat_id: str, user_content: str, file_id: str = None):
    """
    Orchestration Engine: Manages the lifecycle of a single chat turn.
    Saves the user prompt, injects history into the LLM, streams the response,
    and commits the AI's final answer to MongoDB Atlas.
    """
    attachment_data = None
    
    # ==========================================
    # 1. UI CHIP LOGIC (Strictly for this turn)
    # ==========================================
    if file_id:
        try:
            # Find the specific file they just attached to this exact message
            current_file = await database.files.find_one({"_id": ObjectId(file_id)})
            if current_file:
                attachment_data = {
                    "filename": current_file["filename"],
                    "file_id": str(current_file["_id"]),
                    "file_url": current_file.get("cdn_url")
                }
        except Exception as e:
            print(f"⚠️ Failed to load UI attachment data: {str(e)}")

    # ==========================================
    # 2. SESSION MEMORY LOGIC (For the AI)
    # ==========================================
    accumulated_context = ""
    try:
        # Fetch ALL files ever linked to this chat room
        # We use .to_list() to consume the async cursor
        cursor = database.files.find({"chat_id": chat_id})
        all_files = await cursor.to_list(length=10) # Safety limit of 10 docs
        
        if all_files:
            accumulated_context = "--- REFERENCE DOCUMENTS ---\n"
            for f in all_files:
                if "extracted_text" in f:
                    # Stitch every file's text together into a massive context block
                    accumulated_context += f"Document: {f['filename']}\n{f['extracted_text']}\n\n"
                    
            print(f"📚 RAG Engine: Injected {len(all_files)} documents into memory.")
    except Exception as e:
        print(f"⚠️ Failed to load historical context: {str(e)}")

    # ==========================================
    # 3. BUILD THE FINAL PROMPT
    # ==========================================
    prompt_to_send = user_content
    if accumulated_context:
        # Wrap the multi-document text with the user's question
        prompt_to_send = f"{accumulated_context}User Question: {user_content}"

    # Step 4: Commit human message (attachment_data is only populated if they just uploaded a file)
    await create_message(chat_id=chat_id, role="user", content=user_content, attachment=attachment_data)
    await update_chat_timestamp(chat_id=chat_id)

    # Step 5: Pull history (omitting the raw message we just saved)
    db_history = await get_messages_by_chat(chat_id=chat_id)
    
    formatted_messages = [
        {"role": "system", "content": "You are Clarix, a precise AI assistant. Answer the user's questions based on the provided reference documents."}
    ]

    recent_history = db_history[-11:-1] if len(db_history) > 1 else []
    
    for msg in recent_history:
        formatted_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Append our engineered RAG prompt (which now contains ALL files) as the final turn
    formatted_messages.append({"role": "user", "content": prompt_to_send})
        
    full_ai_response = ""
    
    # Step 6: Hook into the core streaming generator
    async for token in hf_stream_completion(messages=formatted_messages):
        full_ai_response += token
        yield token
        
    # Step 7: Commit the AI response to Atlas
    if full_ai_response.strip():
        await create_message(chat_id=chat_id, role="assistant", content=full_ai_response)
        await update_chat_timestamp(chat_id=chat_id)


