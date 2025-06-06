"""
Dependency injection providers for API endpoints.

This module provides reusable dependencies for authentication, database, and other services.
"""

from typing import Optional, Annotated, Dict, Any
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uuid

from app.core.settings import settings
from app.core.observability import get_logger, request_id_var, user_id_var
from app.adapters.queue_redis import redis_adapter
from app.domain.mediator import event_bus, mediator
from app.domain.agent_factory import agent_factory
from app.domain.router_chain import RouterChain
from app.adapters.llm_openai import OpenAIAdapter

logger = get_logger(__name__)

# Security
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current user from JWT token."""
    if settings.environment == "development" and not settings.api_key:
        # Allow unauthenticated access in development
        return {"user_id": "dev_user", "role": "admin"}
    
    token = credentials.credentials
    
    # Simple API key check
    if token == settings.api_key:
        return {"user_id": "api_user", "role": "user"}
    
    # JWT validation
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Set user context
        user_id_var.set(user_id)
        
        return {"user_id": user_id, "role": payload.get("role", "user")}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """Get optional user from authorization header."""
    if not authorization:
        return None
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        
        credentials = HTTPAuthorizationCredentials(
            scheme=scheme,
            credentials=token
        )
        return await get_current_user(credentials)
    except Exception:
        return None


async def get_user_dev_friendly(
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """Get user with development-friendly fallback."""
    if settings.environment == "development":
        # In development, allow unauthenticated access
        if not authorization:
            return {"user_id": "dev_user", "role": "admin"}
    
    # Try to get user from optional auth
    user = await get_optional_user(authorization)
    if user:
        return user
    
    # If no user found and not in development, require auth
    if settings.environment != "development":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Development fallback
    return {"user_id": "dev_user", "role": "admin"}


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Require admin role."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


# Request context
async def get_request_id(request: Request) -> str:
    """Get or generate request ID."""
    request_id = request.headers.get("X-Request-ID")
    if not request_id:
        request_id = str(uuid.uuid4())
    
    # Set request context
    request_id_var.set(request_id)
    
    return request_id


# Rate limiting
class RateLimiter:
    """Simple rate limiter using Redis."""
    
    def __init__(self, requests: int = 100, window: int = 60):
        self.requests = requests
        self.window = window
    
    async def check_rate_limit(self, key: str) -> bool:
        """Check if rate limit exceeded."""
        if not settings.rate_limit_enabled:
            return True
        
        current = await redis_adapter.incr(f"rate_limit:{key}")
        
        if current == 1:
            await redis_adapter.expire(f"rate_limit:{key}", self.window)
        
        return current <= self.requests


async def rate_limit_check(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> None:
    """Check rate limit for request."""
    # Use user ID or IP address as key
    key = user["user_id"] if user else (request.client.host if request.client else "unknown")
    
    limiter = RateLimiter(
        requests=settings.rate_limit_requests,
        window=settings.rate_limit_window
    )
    
    if not await limiter.check_rate_limit(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )


# Service dependencies
def get_redis():
    """Get Redis adapter."""
    return redis_adapter


def get_event_bus():
    """Get event bus."""
    return event_bus


def get_mediator():
    """Get mediator."""
    return mediator


def get_agent_factory():
    """Get agent factory."""
    return agent_factory


async def get_router_chain() -> RouterChain:
    """Get enhanced router chain with caching and learning capabilities."""
    # Create a new instance for each request
    # In production, this would be a singleton
    from app.domain.router_chain import (
        DEFAULT_ROUTING_RULES,
        DEFAULT_AGENT_DESCRIPTIONS
    )
    
    # Create router chain without trace emitter to avoid circular imports
    # The debug endpoint can set up its own tracing
    chain = RouterChain()
    llm_adapter = OpenAIAdapter()
    
    # Use enhanced chain with learning and context awareness
    return chain.build_enhanced_chain(
        regex_rules=DEFAULT_ROUTING_RULES,
        llm_adapter=llm_adapter,
        agent_descriptions=DEFAULT_AGENT_DESCRIPTIONS,
        enable_learning=True,
        enable_context_awareness=True,
        use_llm_primary=True
    )


# Health check dependencies
async def check_database_health() -> bool:
    """Check database health."""
    # TODO: Implement actual database health check
    return True


async def check_redis_health() -> bool:
    """Check Redis health."""
    return await redis_adapter.health_check()


async def check_services_health() -> Dict[str, bool]:
    """Check all services health."""
    return {
        "database": await check_database_health(),
        "redis": await check_redis_health(),
        "event_bus": event_bus._running if hasattr(event_bus, '_running') else False
    }


# Type aliases for cleaner function signatures
CurrentUser = Annotated[Dict[str, Any], Depends(get_current_user)]
DevFriendlyUser = Annotated[Dict[str, Any], Depends(get_user_dev_friendly)]
OptionalUser = Annotated[Optional[Dict[str, Any]], Depends(get_optional_user)]
RequestId = Annotated[str, Depends(get_request_id)]
RedisClient = Annotated[Any, Depends(get_redis)]
EventBus = Annotated[Any, Depends(get_event_bus)]
Mediator = Annotated[Any, Depends(get_mediator)]
AgentFactory = Annotated[Any, Depends(get_agent_factory)]
RouterChainDep = Annotated[RouterChain, Depends(get_router_chain)]
RateLimit = Annotated[None, Depends(rate_limit_check)]