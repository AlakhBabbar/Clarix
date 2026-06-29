# server/app/routes/files.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime
from bson import ObjectId
from app.services.storage_service import upload_document_to_cloud

from app.database import database 

router = APIRouter()

@router.post("/upload")
async def handle_vault_upload(
    chat_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Catch-point for React's FormData binary envelope. 
    Saves binary to Supabase, saves ledger to MongoDB.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty file payload received.")

    try:
        # 1. Ship physical binary stream to Supabase Cloud Storage
        cdn_url = await upload_document_to_cloud(chat_id, file)
        
        # 2. Construct the database document record
        file_metadata = {
            "chat_id": chat_id,
            "filename": file.filename,
            "cdn_url": cdn_url,
            "mime_type": file.content_type,
            "created_at": datetime.utcnow(),
            "rag_status": "unprocessed" # Staged for future background RAG ingestion
        }
        
        # 3. Inject document record into MongoDB Atlas 
        result = await database.files.insert_one(file_metadata)
        
        # 4. Return the complete 3-part receipt back to React
        return {
            "status": "success",
            "file_id": str(result.inserted_id), # The real MongoDB barcode!
            "filename": file.filename,
            "file_url": cdn_url
        }
        
    except Exception as e:
        print(f"❌ Cloud Vault Transmission Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Vault rejected parcel: {str(e)}")