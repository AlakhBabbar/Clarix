# server/app/services/file_parser.py
import io
from pypdf import PdfReader

def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Takes raw binary file data from RAM and converts it into clean English text strings.
    """
    clean_name = filename.lower()
    
    # 1. Plaintext Files (.txt, .csv, .md, .json)
    if clean_name.endswith(('.txt', '.csv', '.md', '.json', '.py', '.js', '.tsx')):
        try:
            return file_bytes.decode('utf-8', errors='ignore')
        except Exception as e:
            return f"[Error decoding text file: {str(e)}]"

    # 2. PDF Documents (.pdf)
    elif clean_name.endswith('.pdf'):
        try:
            pdf_stream = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_stream)
            
            extracted_pages = []
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    extracted_pages.append(f"--- Page {page_num + 1} ---\n{text}")
                    
            full_text = "\n\n".join(extracted_pages)
            
            # Safety clamp: Prevent a 900-page book from blowing up the LLM context window
            MAX_CHARS = 25000 
            if len(full_text) > MAX_CHARS:
                return full_text[:MAX_CHARS] + "\n\n[...Document truncated due to length...]"
                
            return full_text
        except Exception as e:
            return f"[Error ripping text from PDF: {str(e)}]"

    # 3. Unsupported / Images
    else:
        return "[Binary Document / Image Attached - Direct OCR extraction not enabled in MVP]"