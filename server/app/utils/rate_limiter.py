from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from app.database import database

rate_limit_collection = database.get_collection("rate_limits")

async def check_email_rate_limit(email: str, max_requests: int = 3, window_minutes: int = 15):
    """
    Ensures an email address cannot spam the forgot-password endpoint.
    Allows 'max_requests' within 'window_minutes'.
    """
    now = datetime.now(timezone.utc)
    time_window_start = now - timedelta(minutes=window_minutes)

    # 1. Count how many times this email has requested an OTP within the time window
    request_count = await rate_limit_collection.count_documents({
        "email": email,
        "timestamp": {"$gte": time_window_start}
    })

    # 2. If they exceed the limit, block them immediately
    if request_count >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many password reset requests. Please try again after {window_minutes} minutes."
        )

    # 3. If they are within limits, log this request timestamp
    await rate_limit_collection.insert_one({
        "email": email,
        "timestamp": now
    })