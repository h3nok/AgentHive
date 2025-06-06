"""
Simple router testing endpoint without complex dependencies.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
import time

from app.domain.schemas import PromptIn, AgentType
from app.domain.router_chain import RouterChain, DEFAULT_ROUTING_RULES, DEFAULT_AGENT_DESCRIPTIONS
from app.adapters.llm_openai import OpenAIAdapter
from app.core.observability import get_logger

logger = get_logger(__name__)

# Create test router
test_router = APIRouter(prefix="/test", tags=["test"])


class RouterTestResponse(BaseModel):
    """Response model for router testing."""
    prompt: str
    selected_agent: str
    intent: str
    confidence: float
    routing_method: str
    processing_time_ms: float
    metadata: Optional[Dict[str, Any]] = None


class RouterTestRequest(BaseModel):
    """Request model for router testing."""
    prompt: str


@test_router.post("/router", response_model=RouterTestResponse)
async def test_router_endpoint(request: RouterTestRequest) -> RouterTestResponse:
    """
    Test the router chain directly without complex dependencies.
    This endpoint creates a minimal router chain and tests routing decisions.
    """
    try:
        start_time = time.time()
        
        # Create a minimal router chain for testing
        chain = RouterChain()
        llm_adapter = OpenAIAdapter()
        
        # Build the enhanced chain
        enhanced_chain = chain.build_enhanced_chain(
            regex_rules=DEFAULT_ROUTING_RULES,
            llm_adapter=llm_adapter,
            agent_descriptions=DEFAULT_AGENT_DESCRIPTIONS,
            enable_learning=True,
            enable_context_awareness=True,
            use_llm_primary=True
        )
        
        # Create a minimal request context
        from app.domain.schemas import RequestContext
        context = RequestContext(
            prompt=PromptIn(prompt=request.prompt, session_id="test_session"),
            user_id="test_user",
            request_id="test_request_id",
            metadata={"test_mode": True}
        )
        
        # Run the routing
        routing_result = await enhanced_chain.route(context)
        
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(f"Router test completed", extra={
            "prompt": request.prompt,
            "selected_agent": routing_result.metadata.get("selected_agent", "unknown"),
            "intent": routing_result.intent,
            "confidence": routing_result.confidence,
            "processing_time_ms": processing_time
        })
        
        return RouterTestResponse(
            prompt=request.prompt,
            selected_agent=routing_result.metadata.get("selected_agent", AgentType.GENERAL.value),
            intent=routing_result.intent,
            confidence=routing_result.confidence,
            routing_method=routing_result.routing_method.value,
            processing_time_ms=processing_time,
            metadata=routing_result.metadata
        )
        
    except Exception as e:
        logger.error(f"Router test failed: {e}")
        # Return a fallback response instead of raising an exception
        return RouterTestResponse(
            prompt=request.prompt,
            selected_agent=AgentType.GENERAL.value,
            intent="error",
            confidence=0.0,
            routing_method="error",
            processing_time_ms=0.0,
            metadata={"error": str(e)}
        )


@test_router.get("/health")
async def test_router_health():
    """Test router health endpoint."""
    return {
        "status": "healthy",
        "service": "test-router",
        "message": "Router testing endpoint is ready"
    }
