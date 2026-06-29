from fastapi import FastAPI
from app.routes.chats import router as ChatRouter       # Pulling in our brand new routes
from app.routes.ai import router as AiRouter          # Pulling in our streaming engine
# Add your new files router to the import:
from app.routes.files import router as FileRouter
from fastapi.middleware.cors import CORSMiddleware

server = FastAPI(
    title="Clarix API Engine",
    description="Backend services orchestration layer for Clarix MVP Chatbot",
    version="1.0.0"
)

server.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"], # Allows OPTIONS, GET, POST, etc.
    allow_headers=["*"], # Allows custom headers
)

# Registering the new endpoints
server.include_router(ChatRouter, tags=["Chat Sessions"], prefix="/api/chats")
server.include_router(FileRouter, tags=["Vault"], prefix="/api/files")
server.include_router(AiRouter, tags=["AI Core Engine"], prefix="/api/ai")

@server.get("/")
async def root():
    return {"message": "Clarix Core Services operational."}