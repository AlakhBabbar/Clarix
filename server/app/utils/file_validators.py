# server/app/utils/file_validators.py
from fastapi import HTTPException
from app.core.config import MAX_UPLOAD_SIZE_BYTES, MAX_DOCUMENT_CHARS

def validate_file_size(file_size: int):
    """Checks if the raw file payload is too large before processing."""
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413, # 413: Payload Too Large
            detail=f"File exceeds the {MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB limit."
        )

def validate_text_length(text: str, filename: str):
    """Checks if the extracted text exceeds our token safety limit."""
    if len(text) > MAX_DOCUMENT_CHARS:
        raise HTTPException(
            status_code=422, # 422: Unprocessable Entity
            detail=f"The document '{filename}' contains too much text. Please upload a smaller summary."
        )