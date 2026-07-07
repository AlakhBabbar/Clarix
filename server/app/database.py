import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv  # <-- Add this import

# Load environment variables from the .env file sitting at the root
load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Temporary sanity check: This will print out exactly where your backend is pointing
if "localhost" in MONGO_DETAILS:
    print("⚠️ WARNING: Server is STILL using local fallback database!")
else:
    print("🚀 SUCCESS: Connected to external Atlas Cloud Cluster.")



client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.clarix_db
message_collection = database.get_collection("messages")
chat_collection = database.get_collection("chats")

# --- AUTOMATED DATABASE SETUP ---
async def init_db_indexes():
    """
    Runs during application startup to configure mandatory database rules and indexes.
    """
    try:
        rate_limit_collection = database.get_collection("rate_limits")
        
        # Create a TTL index on the 'timestamp' field
        # expireAfterSeconds=900 means 15 minutes (15 * 60)
        await rate_limit_collection.create_index(
            "timestamp", 
            expireAfterSeconds=900
        )
        print("✅ MongoDB TTL index initialized successfully on 'rate_limits'.")
        
    except Exception as e:
        print(f"❌ Failed to initialize database indexes: {str(e)}")