from fastapi import FastAPI
from app.routes.chats import router as ChatRouter       # Pulling in our brand new routes
from app.routes.ai import router as AiRouter          # Pulling in our streaming engine
# Add your new files router to the import:
from app.routes.files import router as FileRouter
from app.routes.auth import router as AuthRouter
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db_indexes
from contextlib import asynccontextmanager
from app.routes.users import router as UserRouter

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Everything before 'yield' runs when the server STARTS
    await init_db_indexes()
    yield
    # Everything after 'yield' runs when the server SHUTS DOWN
    print("Shutting down server...")

server = FastAPI(
    title="Clarix API Engine",
    description="Backend services orchestration layer for Clarix MVP Chatbot",
    version="1.0.0",
    lifespan=lifespan
)


server.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"], # Allows OPTIONS, GET, POST, etc.
    allow_headers=["*"], # Allows custom headers
)

# Registering the new endpoints
server.include_router(AuthRouter, tags=["Authentication"], prefix="/api/auth")
server.include_router(ChatRouter, tags=["Chat Sessions"], prefix="/api/chats")
server.include_router(FileRouter, tags=["Vault"], prefix="/api/files")
server.include_router(AiRouter, tags=["AI Core Engine"], prefix="/api/ai")
server.include_router(UserRouter, tags=["Users"], prefix="/api/users")

@server.get("/")
async def root():
    return {"message": "Clarix Core Services operational."}