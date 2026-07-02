# server/app/services/storage_service.py
import os
from fastapi import UploadFile
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = "clarixdocs"

# Initialize the administrative storage client
if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Supabase credentials missing from .env file!")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if (SUPABASE_URL and SUPABASE_KEY) else None

async def upload_document_to_cloud(chat_id: str, file: UploadFile) -> str:
    """
    Reads a binary file from FastAPI, streams it straight into the Supabase 'documents' bucket, 
    and returns a permanent public asset URL.
    """
    if not supabase_client:
        raise RuntimeError("Cloud vault client is uninitialized. Check your keys.")

    # 1. Read the raw binary stream out of RAM
    file_bytes = await file.read()
    
    # 2. Enforce our virtual directory folder geometry: documents/chat_id/filename
    file_path = f"{chat_id}/{file.filename}"
    
    # 3. Ship the binary packet straight across the cloud boundary
    # content_type tells Supabase whether this is a PDF, PNG, or Text file
    res = supabase_client.storage.from_(BUCKET_NAME).upload(
        path=file_path,
        file=file_bytes,
        file_options={"content-type": file.content_type, "upsert": "true"}
    )
    
    # 4. Construct the permanent clean public CDN link
    # Since we set the bucket to 'Public', this URL is instantly readable by web browsers
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_path}"
    
    return public_url


async def delete_chat_vault_files(chat_id: str, filenames: list[str]) -> bool:
    """
    Takes an array of filenames, constructs their exact Supabase paths, 
    and blasts them out of the cloud bucket in one shot.
    """
    if not supabase_client or not filenames:
        return True # Nothing to delete, or client offline

    # Reconstruct the virtual folder geometry we used during upload
    file_paths = [f"{chat_id}/{name}" for name in filenames]
    
    try:
        # Supabase accepts an array of paths to bulk-delete
        res = supabase_client.storage.from_(BUCKET_NAME).remove(file_paths)
        print(f"🗑️ Vault Cleanup: Wiped {len(file_paths)} files for chat {chat_id}")
        return True
    except Exception as e:
        print(f"⚠️ Vault Cleanup Failed: {str(e)}")
        return False