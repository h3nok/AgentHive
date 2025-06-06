"""
Model Context Protocol (MCP) API endpoints for context management.
Provides comprehensive context storage, retrieval, and processing capabilities.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from enum import Enum
import uuid
import logging

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field, field_validator

from .deps import DevFriendlyUser

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/mcp", tags=["mcp"])

class ContextType(str, Enum):
    """Types of context that can be stored and managed"""
    CHAT_HISTORY = "chat_history"
    DOCUMENT = "document"
    KNOWLEDGE_GRAPH = "knowledge_graph"
    TOOL_OUTPUT = "tool_output"
    USER_PROFILE = "user_profile"
    LEASE_DATA = "lease_data"
    SYSTEM = "system"

class ContextItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ContextType
    content: Dict[str, Any]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)
    priority: int = 0
    expiration: Optional[datetime] = None
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not v:
            raise ValueError("Content cannot be empty")
        return v

class ContextRequest(BaseModel):
    type: ContextType
    content: Dict[str, Any]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=0, ge=0, le=10)
    ttl_hours: Optional[int] = Field(default=None, ge=1, le=8760)  # Max 1 year

class ContextResponse(BaseModel):
    items: List[ContextItem]
    total_count: int
    filtered_count: int
    page: int
    per_page: int

# Mock context service for demonstration
class MockContextService:
    def __init__(self):
        self.contexts: Dict[str, ContextItem] = {}
        self.user_contexts: Dict[str, List[str]] = {}
    
    def store_context(self, user_id: str, item: ContextItem) -> ContextItem:
        """Store a context item for a user"""
        if user_id not in self.user_contexts:
            self.user_contexts[user_id] = []
        
        self.contexts[item.id] = item
        self.user_contexts[user_id].append(item.id)
        return item
    
    def get_contexts(self, user_id: str, context_type: Optional[ContextType] = None, 
                    limit: int = 50, offset: int = 0) -> List[ContextItem]:
        """Retrieve contexts for a user with optional filtering"""
        if user_id not in self.user_contexts:
            return []
        
        user_context_ids = self.user_contexts[user_id]
        contexts = [self.contexts[id] for id in user_context_ids if id in self.contexts]
        
        # Filter by type if specified
        if context_type:
            contexts = [ctx for ctx in contexts if ctx.type == context_type]
        
        # Remove expired contexts
        now = datetime.now()
        contexts = [ctx for ctx in contexts if not ctx.expiration or ctx.expiration > now]
        
        # Sort by priority (high to low) then by timestamp (recent first)
        contexts.sort(key=lambda x: (-x.priority, -x.timestamp.timestamp()))
        
        # Apply pagination
        return contexts[offset:offset + limit]
    
    def delete_context(self, user_id: str, context_id: str) -> bool:
        """Delete a specific context item"""
        if (user_id in self.user_contexts and 
            context_id in self.user_contexts[user_id] and 
            context_id in self.contexts):
            
            del self.contexts[context_id]
            self.user_contexts[user_id].remove(context_id)
            return True
        return False
    
    def get_context_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a summary of user's contexts"""
        if user_id not in self.user_contexts:
            return {"total": 0, "by_type": {}, "recent_activity": []}
        
        contexts = self.get_contexts(user_id, limit=1000)  # Get all for summary
        
        by_type = {}
        for ctx in contexts:
            type_name = ctx.type.value
            if type_name not in by_type:
                by_type[type_name] = 0
            by_type[type_name] += 1
        
        recent_activity = [
            {
                "id": ctx.id,
                "type": ctx.type.value,
                "timestamp": ctx.timestamp.isoformat(),
                "priority": ctx.priority
            }
            for ctx in contexts[:10]  # Last 10 items
        ]
        
        return {
            "total": len(contexts),
            "by_type": by_type,
            "recent_activity": recent_activity
        }

# Global service instance
context_service = MockContextService()

@router.post("/context", response_model=ContextItem)
async def store_context(
    user: DevFriendlyUser,
    request: ContextRequest
) -> ContextItem:
    """
    Store a new context item for the authenticated user.
    """
    try:
        user_id = str(user.get("sub", "anonymous"))
        
        # Create context item
        expiration = None
        if request.ttl_hours:
            expiration = datetime.now() + timedelta(hours=request.ttl_hours)
        
        context_item = ContextItem(
            type=request.type,
            content=request.content,
            metadata=request.metadata,
            priority=request.priority,
            expiration=expiration
        )
        
        # Store in service
        stored_item = context_service.store_context(user_id, context_item)
        
        logger.info(f"Stored context {stored_item.id} for user {user_id}")
        return stored_item
        
    except Exception as e:
        logger.error(f"Failed to store context: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store context"
        )

@router.get("/context", response_model=ContextResponse)
async def get_contexts(
    user: DevFriendlyUser,
    context_type: Optional[ContextType] = Query(None, description="Filter by context type"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    priority_min: int = Query(0, ge=0, le=10, description="Minimum priority level")
) -> ContextResponse:
    """
    Retrieve context items for the authenticated user with optional filtering.
    """
    try:
        user_id = str(user.get("sub", "anonymous"))
        
        # Get contexts from service
        contexts = context_service.get_contexts(user_id, context_type, limit * 2, 0)  # Get more for filtering
        
        # Apply priority filter
        if priority_min > 0:
            contexts = [ctx for ctx in contexts if ctx.priority >= priority_min]
        
        total_count = len(contexts)
        
        # Apply pagination after filtering
        filtered_contexts = contexts[offset:offset + limit]
        
        return ContextResponse(
            items=filtered_contexts,
            total_count=len(context_service.get_contexts(user_id, limit=1000)),
            filtered_count=total_count,
            page=offset // limit + 1,
            per_page=limit
        )
        
    except Exception as e:
        logger.error(f"Failed to retrieve contexts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve contexts"
        )

@router.delete("/context/{context_id}")
async def delete_context(
    user: DevFriendlyUser,
    context_id: str
) -> Dict[str, str]:
    """
    Delete a specific context item by ID.
    """
    try:
        user_id = str(user.get("sub", "anonymous"))
        
        success = context_service.delete_context(user_id, context_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Context item not found"
            )
        
        logger.info(f"Deleted context {context_id} for user {user_id}")
        return {"message": "Context deleted successfully", "context_id": context_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete context: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete context"
        )

@router.post("/process-with-context")
async def process_with_context(
    user: DevFriendlyUser,
    query: str = Query(..., description="The query to process"),
    context_types: List[ContextType] = Query(default=[], description="Types of context to include"),
    max_context_items: int = Query(10, ge=1, le=50, description="Maximum context items to use")
) -> Dict[str, Any]:
    """
    Process a query with relevant context items for enhanced responses.
    """
    try:
        user_id = str(user.get("sub", "anonymous"))
        
        # Gather relevant contexts
        relevant_contexts = []
        
        if context_types:
            for context_type in context_types:
                contexts = context_service.get_contexts(user_id, context_type, max_context_items, 0)
                relevant_contexts.extend(contexts)
        else:
            # Get all types if none specified
            relevant_contexts = context_service.get_contexts(user_id, None, max_context_items, 0)
        
        # Sort by priority and recency
        relevant_contexts.sort(key=lambda x: (-x.priority, -x.timestamp.timestamp()))
        relevant_contexts = relevant_contexts[:max_context_items]
        
        # Simulate processing with context (in real implementation, this would integrate with LLM)
        context_summary = {
            "query": query,
            "context_used": len(relevant_contexts),
            "context_types": list(set([ctx.type.value for ctx in relevant_contexts])),
            "context_items": [
                {
                    "id": ctx.id,
                    "type": ctx.type.value,
                    "priority": ctx.priority,
                    "content_preview": str(ctx.content)[:100] + "..." if len(str(ctx.content)) > 100 else str(ctx.content)
                }
                for ctx in relevant_contexts
            ],
            "response": f"Processed query '{query}' with {len(relevant_contexts)} context items",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Processed query with {len(relevant_contexts)} context items for user {user_id}")
        return context_summary
        
    except Exception as e:
        logger.error(f"Failed to process with context: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process query with context"
        )

@router.get("/context/summary")
async def get_context_summary(user: DevFriendlyUser) -> Dict[str, Any]:
    """
    Get a summary of the user's stored contexts.
    """
    try:
        user_id = str(user.get("sub", "anonymous"))
        summary = context_service.get_context_summary(user_id)
        return summary
        
    except Exception as e:
        logger.error(f"Failed to get context summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve context summary"
        )

@router.post("/context/optimize")
async def optimize_contexts(
    user: DevFriendlyUser,
    max_items: int = Query(100, ge=10, le=1000, description="Maximum number of contexts to keep"),
    min_priority: int = Query(0, ge=0, le=10, description="Minimum priority to keep")
) -> Dict[str, Any]:
    """
    Optimize stored contexts by removing low-priority or expired items.
    """
    try:
        user_id = str(user.get("sub", "anonymous"))
        
        if user_id not in context_service.user_contexts:
            return {"removed": 0, "remaining": 0}
        
        # Get all user contexts
        all_contexts = context_service.get_contexts(user_id, limit=1000)
        initial_count = len(all_contexts)
        
        # Filter contexts to keep
        now = datetime.now()
        contexts_to_keep = [
            ctx for ctx in all_contexts
            if (not ctx.expiration or ctx.expiration > now) and ctx.priority >= min_priority
        ]
        
        # Sort by priority and keep only max_items
        contexts_to_keep.sort(key=lambda x: (-x.priority, -x.timestamp.timestamp()))
        contexts_to_keep = contexts_to_keep[:max_items]
        
        # Rebuild user's context list
        kept_ids = [ctx.id for ctx in contexts_to_keep]
        removed_ids = [ctx.id for ctx in all_contexts if ctx.id not in kept_ids]
        
        # Remove contexts from storage
        for ctx_id in removed_ids:
            if ctx_id in context_service.contexts:
                del context_service.contexts[ctx_id]
        
        # Update user's context list
        context_service.user_contexts[user_id] = kept_ids
        
        result = {
            "removed": len(removed_ids),
            "remaining": len(kept_ids),
            "initial_count": initial_count,
            "optimization_timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Optimized contexts for user {user_id}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Failed to optimize contexts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize contexts"
        )

@router.get("/sessions")
async def list_active_sessions(user: DevFriendlyUser) -> Dict[str, Any]:
    """
    List active MCP sessions for the user.
    """
    try:
        user_id = str(user.get("sub", "anonymous"))
        
        # Mock session data
        sessions = [
            {
                "session_id": f"session_{user_id}_1",
                "created_at": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat(),
                "context_count": len(context_service.get_contexts(user_id, limit=1000)),
                "status": "active"
            }
        ]
        
        return {
            "sessions": sessions,
            "total": len(sessions)
        }
        
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Check the health status of the MCP service.
    """
    try:
        total_contexts = len(context_service.contexts)
        total_users = len(context_service.user_contexts)
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "stats": {
                "total_contexts": total_contexts,
                "total_users": total_users,
                "service_uptime": "running"
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }
