# server/app/routes/files.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime
from bson import ObjectId
from app.services.pdf_parser import extract_text_from_bytes
from app.services.storage_service import upload_document_to_cloud
from app.database import database 
from app.utils.file_validators import validate_file_size, validate_text_length

router = APIRouter()

@router.post("/upload")
async def handle_vault_upload(
    chat_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Catch-point for React's FormData binary envelope.
    Saves binary to Supabase, parses text, and saves both to MongoDB.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty file payload received.")

    try:
        # SHIELD 1: Check raw file size (requires FastAPI/Starlette recent versions)
        validate_file_size(file.size)

        file_bytes = await file.read()
        
        # Extract text
        extracted_text = extract_text_from_bytes(file_bytes, file.filename)

        # SHIELD 2: Check the actual character count before saving to MongoDB
        validate_text_length(extracted_text, file.filename)

        await file.seek(0)

        # 4. Ship physical binary stream to Supabase Cloud Storage
        cdn_url = await upload_document_to_cloud(chat_id, file)
        
        # 5. Construct the database document record
        file_metadata = {
            "chat_id": chat_id,
            "filename": file.filename,
            "cdn_url": cdn_url,
            "mime_type": file.content_type,
            "extracted_text": extracted_text, # <-- 6. Save the text permanently in Mongo!
            "created_at": datetime.utcnow(),
            "rag_status": "processed" # Updated status
        }
        
        # 6. Inject document record into MongoDB Atlas 
        result = await database.files.insert_one(file_metadata)
        
        return {
            "status": "success",
            "file_id": str(result.inserted_id),
            "filename": file.filename,
            "file_url": cdn_url
        }
    
    except HTTPException as he:
        # Let our custom validation errors pass straight through to the frontend
        raise he
        
    except Exception as e:
        print(f"❌ Cloud Vault Transmission Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Vault rejected parcel: {str(e)}")