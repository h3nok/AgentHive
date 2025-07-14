from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pymongo import MongoClient
import redis
import os

router = APIRouter()

def get_mongodb_status():
    try:
        client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://mongodb:27017/agenthive'))
        client.admin.command('ping')
        return {"status": "healthy", "service": "mongodb"}
    except Exception as e:
        return {"status": "unhealthy", "service": "mongodb", "error": str(e)}

def get_redis_status():
    try:
        r = redis.Redis.from_url(
            os.getenv('REDIS_URL', 'redis://redis:6379/0'),
            password=os.getenv('REDIS_PASSWORD', '')
        )
        r.ping()
        return {"status": "healthy", "service": "redis"}
    except Exception as e:
        return {"status": "unhealthy", "service": "redis", "error": str(e)}

@router.get("/health")
async def health_check():
    """
    Health check endpoint that verifies all critical services
    """
    services = {
        "api": {"status": "healthy"},
        **get_mongodb_status(),
        **get_redis_status()
    }
    
    # Check if any service is unhealthy
    status_code = 200
    for service, data in services.items():
        if isinstance(data, dict) and data.get("status") == "unhealthy":
            status_code = 503
            break
    
    return JSONResponse(
        content={"status": "healthy" if status_code == 200 else "degraded", "services": services},
        status_code=status_code
    )
