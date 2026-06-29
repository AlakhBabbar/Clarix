import urllib.request
from bson import ObjectId
from app.services.ai_core import hf_stream_completion
from app.services.message_service import create_message, get_messages_by_chat
from app.services.chat_service import update_chat_timestamp
from app.database import database # <-- Pulling in your Motor DB instance
from app.services.pdf_parser import extract_text_from_bytes

async def orchestrate_chat_stream(chat_id: str, user_content: str, file_id: str = None):
    """
    Orchestration Engine: Manages the lifecycle of a single chat turn.
    Saves the user prompt, injects history into the LLM, streams the response,
    and commits the AI's final answer to MongoDB Atlas.
    """
    # Step 1: Immediately commit the human's message to MongoDB
    await create_message(chat_id=chat_id, role="user", content=user_content)
    
    # Step 2: Bump the parent chat's 'last_used' timestamp so it jumps to the top of the sidebar
    await update_chat_timestamp(chat_id=chat_id)

    # 2.a THE BACKPACK HEIST: Intercept document if attached
    prompt_to_send = user_content
    if file_id:
        try:
            file_doc = await database.files.find_one({"_id": ObjectId(file_id)})
            if file_doc:
                # Rip binary from Supabase CDN
                req = urllib.request.Request(file_doc["cdn_url"], headers={'User-Agent': 'Mozilla/5.0'})
                file_bytes = urllib.request.urlopen(req).read()
                
                # Shred it into English text
                extracted_text = extract_text_from_bytes(file_bytes, file_doc["filename"])
                
                # Wrap it in a strict system context prompt
                prompt_to_send = (
                    f"Context Document ({file_doc['filename']}):\n"
                    f"{extracted_text}\n\n"
                    f"User Question: {user_content}"
                )
                print(f"📎 RAG Heist Complete: Injected {len(extracted_text)} chars.")
        except Exception as e:
            print(f"⚠️ Vault Retrieval Failed: {str(e)}")
    
    # Step 3: Pull the entire chronological history of this specific chat from MongoDB
    db_history = await get_messages_by_chat(chat_id=chat_id)
    
    # Step 4: Convert our database documents into the structured format Hugging Face expects
    # Format: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    formatted_messages = [
        {"role": "system", "content": "You are Clarix, a precise and helpful AI assistant. Use provided document context accurately."}
    ]
    
    for msg in db_history:
        formatted_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Append our newly engineered RAG prompt as the latest turn
    formatted_messages.append({"role": "user", "content": prompt_to_send})
        
    # Step 5: Initialize a text accumulator to capture the tokens as they fly past
    full_ai_response = ""
    
    # Step 6: Hook into the core streaming generator
    async for token in hf_stream_completion(messages=formatted_messages):
        full_ai_response += token  # Accumulate the string in server memory
        yield token               # Instantly yield the token out to the HTTP response pipe (SSE)
        
    # Step 7: The stream has finished cleanly! Commit the full accumulated AI response to Atlas
    if full_ai_response.strip():
        await create_message(chat_id=chat_id, role="assistant", content=full_ai_response)
        # Bump the timestamp once more to reflect the final completion time
        await update_chat_timestamp(chat_id=chat_id)