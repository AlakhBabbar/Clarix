# server/app/core/config.py

# 5 Megabytes in bytes
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 

# Rough estimate: 1 token is ~4 chars. 
# Limit to 25,000 characters to keep context windows safe.
MAX_DOCUMENT_CHARS = 25000