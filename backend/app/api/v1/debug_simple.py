"""
Simple debug endpoints for testing router functionality.
"""

from fastapi import APIRouter, HTTPException, status
from app.core.settings import settings
from app.domain.schemas import PromptIn, ChatResponse, AgentType
import uuid

logger = None  # We'll use print for now to avoid import issues

# Create debug router
debug_simple_router = APIRouter(prefix="/debug", tags=["debug"])


@debug_simple_router.post("/chat")
async def simple_debug_chat(prompt_in: PromptIn):
    """
    Simple debug chat endpoint for testing.
    Returns a mock response to test the frontend integration.
    """
    if settings.environment not in ["development", "test"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debug endpoint not available in production"
        )
    
    # Generate a mock response
    session_id = prompt_in.session_id or str(uuid.uuid4())
    
    return {
        "response": f"Debug mock response for: {prompt_in.prompt}",
        "session_id": session_id,
        "agent_id": "debug-agent",
        "agent_type": "general",
        "metadata": {
            "debug_mode": True,
            "intent": "test",
            "confidence": 0.9,
            "routing_method": "debug"
        }
    }


@debug_simple_router.get("/health")
async def debug_health():
    """Simple debug health check."""
    return {"status": "debug_ok", "environment": settings.environment}
