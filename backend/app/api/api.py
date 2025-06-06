"""
Main API router.

This module provides the main API router that combines all sub-routers.
"""

from fastapi import APIRouter

from .auth import router as auth_router
from .chat import router as chat_router
from .agents import router as agents_router
from .metrics import router as metrics_router


# Create main router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(agents_router, prefix="/agents", tags=["agents"])
api_router.include_router(metrics_router, prefix="/metrics", tags=["metrics"]) 