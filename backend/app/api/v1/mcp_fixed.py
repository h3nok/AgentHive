"""
TSC Model Context Protocol (MCP) Router
Manages context storage, retrieval, and processing for conversation sessions
"""

from fastapi import APIRouter, Path, Body, HTTPException, Query
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timedelta
from enum import Enum
import uuid
import logging
import json

from .deps import DevFriendlyUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mcp", tags=["mcp"])

# ============================================================================
# MCP Schemas and Models
# ============================================================================

class ContextType(str, Enum):
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
    session_id: str
    context_items: List[ContextItem]
    replace_existing: bool = False

class ContextResponse(BaseModel):
    session_id: str
    status: str
    message: str
    items_processed: int

class ContextQueryParams(BaseModel):
    context_types: Optional[List[ContextType]] = None
    limit: int = 100
    min_priority: Optional[int] = None
    max_age_minutes: Optional[int] = None

class ProcessWithContextRequest(BaseModel):
    session_id: str
    query: str
    model: Optional[str] = None
    context_types: Optional[List[ContextType]] = None
    context_limit: int = 20
    min_priority: Optional[int] = None

class ProcessWithContextResponse(BaseModel):
    session_id: str
    result: Dict[str, Any]
    context_used: int
    has_context: bool

# ============================================================================
# Mock Context Service for Demonstration
# ============================================================================

class MockContextService:
    """Mock context service for demonstration purposes"""
    
    def __init__(self):
        # In-memory storage for demo (would use Redis/database in production)
        self._context_store: Dict[str, List[ContextItem]] = {}
    
    async def store_context(
        self,
        session_id: str,
        context_items: List[ContextItem],
        replace_existing: bool = False
    ) -> Dict[str, Any]:
        """Store context items for a session"""
        try:
            if replace_existing:
                self._context_store[session_id] = context_items
            else:
                if session_id not in self._context_store:
                    self._context_store[session_id] = []
                self._context_store[session_id].extend(context_items)
            
            # Clean up expired items
            await self._cleanup_expired_items(session_id)
            
            return {
                "status": "success",
                "message": f"Stored {len(context_items)} context items",
                "items_processed": len(context_items)
            }
        except Exception as e:
            logger.error("Error storing context: %s", str(e))
            raise e
    
    async def retrieve_context(
        self,
        session_id: str,
        context_types: Optional[List[ContextType]] = None,
        limit: int = 100,
        min_priority: Optional[int] = None,
        max_age_minutes: Optional[int] = None
    ) -> List[ContextItem]:
        """Retrieve context items with filtering"""
        try:
            items = self._context_store.get(session_id, [])
            
            # Apply filters
            filtered_items = []
            for item in items:
                # Check expiration
                if item.expiration and datetime.now() > item.expiration:
                    continue
                
                # Filter by context type
                if context_types and item.type not in context_types:
                    continue
                
                # Filter by priority
                if min_priority is not None and item.priority < min_priority:
                    continue
                
                # Filter by age
                if max_age_minutes is not None:
                    age = datetime.now() - item.timestamp
                    if age > timedelta(minutes=max_age_minutes):
                        continue
                
                filtered_items.append(item)
            
            # Sort by priority (descending) and timestamp (descending)
            filtered_items.sort(
                key=lambda x: (x.priority, x.timestamp),
                reverse=True
            )
            
            return filtered_items[:limit]
        except Exception as e:
            logger.error("Error retrieving context: %s", str(e))
            raise e
    
    async def delete_context_items(
        self,
        session_id: str,
        context_ids: Optional[List[str]] = None,
        context_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Delete context items"""
        try:
            items = self._context_store.get(session_id, [])
            original_count = len(items)
            
            if context_ids:
                # Delete by specific IDs
                items = [item for item in items if item.id not in context_ids]
            elif context_types:
                # Delete by types
                items = [item for item in items if item.type.value not in context_types]
            else:
                # Delete all
                items = []
            
            self._context_store[session_id] = items
            deleted_count = original_count - len(items)
            
            return {
                "deleted_count": deleted_count,
                "status": "success"
            }
        except Exception as e:
            logger.error("Error deleting context: %s", str(e))
            raise e
    
    async def format_context_for_llm(self, context_items: List[ContextItem]) -> str:
        """Format context items for LLM consumption"""
        try:
            if not context_items:
                return ""
            
            formatted_parts = []
            
            # Group by type for better organization
            by_type = {}
            for item in context_items:
                if item.type not in by_type:
                    by_type[item.type] = []
                by_type[item.type].append(item)
            
            for context_type, items in by_type.items():
                formatted_parts.append(f"\n=== {context_type.value.upper()} ===")
                
                for item in items:
                    content_str = json.dumps(item.content, indent=2)
                    formatted_parts.append(f"[{item.timestamp}] {content_str}")
            
            return "\n".join(formatted_parts)
        except Exception as e:
            logger.error("Error formatting context: %s", str(e))
            return ""
    
    async def _cleanup_expired_items(self, session_id: str):
        """Remove expired context items"""
        items = self._context_store.get(session_id, [])
        now = datetime.now()
        
        valid_items = [
            item for item in items
            if item.expiration is None or item.expiration > now
        ]
        
        self._context_store[session_id] = valid_items

# Initialize mock service
context_service = MockContextService()

# ============================================================================
# Mock Agent Service for LLM Processing
# ============================================================================

class MockAgentService:
    """Mock agent service for demonstration"""
    
    async def process_query_with_context(
        self,
        query: str,
        context: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process query with context using mock LLM"""
        try:
            # Simulate processing time
            import asyncio
            await asyncio.sleep(0.5)
            
            # Generate mock response
            context_summary = "with relevant context" if context else "without context"
            response = f"I understand your query: '{query[:100]}...' and I'm processing it {context_summary}. "
            
            if context:
                response += "Based on the provided context, I can give you a more informed response. "
            
            response += "This is a mock response from the TSC AI assistant."
            
            return {
                "status": "success",
                "message": response,
                "has_context": bool(context),
                "model_used": model or "tsc-gpt-4",
                "confidence": 0.85
            }
        except Exception as e:
            logger.error("Error processing query: %s", str(e))
            return {
                "status": "error",
                "message": f"Error processing query: {str(e)}",
                "has_context": bool(context)
            }

# Initialize mock agent service
agent_service = MockAgentService()

# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/context", response_model=ContextResponse)
async def store_context(
    request: ContextRequest = Body(...),
    current_user: DevFriendlyUser = None
):
    """
    Store context items for a session
    
    This endpoint allows storing multiple context items for a single session.
    Each context item has a type, content, and optional metadata/priority.
    """
    try:
        result = await context_service.store_context(
            session_id=request.session_id,
            context_items=request.context_items,
            replace_existing=request.replace_existing
        )
        
        return ContextResponse(
            session_id=request.session_id,
            status=result["status"],
            message=result["message"],
            items_processed=result.get("items_processed", 0)
        )
    except Exception as e:
        logger.error("Error in store_context endpoint: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store context: {str(e)}"
        ) from e

@router.get("/context/{session_id}")
async def get_context(
    session_id: str = Path(..., description="Session ID to retrieve context for"),
    context_types: Optional[List[ContextType]] = Query(None, description="Filter by context types"),
    limit: int = Query(100, description="Maximum number of items to return"),
    min_priority: Optional[int] = Query(None, description="Minimum priority level"),
    max_age_minutes: Optional[int] = Query(None, description="Maximum age in minutes"),
    current_user: DevFriendlyUser = None
):
    """
    Retrieve context for a session with flexible filtering options
    
    - Filter by context type (e.g., chat_history, document)
    - Limit the number of items returned
    - Filter by minimum priority level
    - Filter by maximum age in minutes
    """
    try:
        items = await context_service.retrieve_context(
            session_id=session_id,
            context_types=context_types,
            limit=limit,
            min_priority=min_priority,
            max_age_minutes=max_age_minutes
        )
        
        return {
            "session_id": session_id,
            "context_items": items,
            "count": len(items)
        }
    except Exception as e:
        logger.error("Error in get_context endpoint: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve context: {str(e)}"
        ) from e

@router.delete("/context/{session_id}")
async def delete_context(
    session_id: str = Path(...),
    context_ids: Optional[List[str]] = Query(None),
    context_types: Optional[List[ContextType]] = Query(None),
    current_user: DevFriendlyUser = None
):
    """
    Delete context items for a session
    
    - Delete by specific context IDs
    - Delete by context types
    - Delete all context for a session if no filters provided
    """
    try:
        result = await context_service.delete_context_items(
            session_id=session_id,
            context_ids=context_ids,
            context_types=[t.value for t in context_types] if context_types else None
        )
        
        return {
            "session_id": session_id,
            "deleted_count": result["deleted_count"],
            "status": "success",
            "message": f"Deleted {result['deleted_count']} context items"
        }
    except Exception as e:
        logger.error("Error in delete_context endpoint: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete context: {str(e)}"
        ) from e

@router.post("/process-with-context", response_model=ProcessWithContextResponse)
async def process_with_context(
    request: ProcessWithContextRequest = Body(...),
    current_user: DevFriendlyUser = None
):
    """
    Process a query with LLM using the session's context
    
    This endpoint combines context retrieval and LLM processing in one call
    """
    try:
        # Retrieve relevant context
        context_items = await context_service.retrieve_context(
            session_id=request.session_id,
            context_types=request.context_types,
            limit=request.context_limit,
            min_priority=request.min_priority
        )
        
        # Format context for LLM
        formatted_context = await context_service.format_context_for_llm(context_items)
        
        # Store user query as context
        user_query_context = ContextItem(
            type=ContextType.CHAT_HISTORY,
            content={"role": "user", "message": request.query},
            priority=5
        )
        
        await context_service.store_context(
            session_id=request.session_id,
            context_items=[user_query_context]
        )
        
        # Process with agent service
        result = await agent_service.process_query_with_context(
            query=request.query,
            context=formatted_context,
            model=request.model
        )
        
        # Store assistant response as context if available
        if result.get("message"):
            assistant_response_context = ContextItem(
                type=ContextType.CHAT_HISTORY,
                content={"role": "assistant", "message": result["message"]},
                priority=5
            )
            
            await context_service.store_context(
                session_id=request.session_id,
                context_items=[assistant_response_context]
            )
        
        return ProcessWithContextResponse(
            session_id=request.session_id,
            result=result,
            context_used=len(context_items),
            has_context=bool(formatted_context)
        )
    except Exception as e:
        logger.error("Error in process_with_context endpoint: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process query with context: {str(e)}"
        ) from e

# ============================================================================
# Advanced Context Management Endpoints
# ============================================================================

@router.get("/context/{session_id}/summary")
async def get_context_summary(
    session_id: str = Path(...),
    current_user: DevFriendlyUser = None
):
    """Get a summary of context for a session"""
    try:
        items = await context_service.retrieve_context(session_id)
        
        # Group by type
        type_counts = {}
        total_items = len(items)
        
        for item in items:
            type_name = item.type.value
            if type_name not in type_counts:
                type_counts[type_name] = 0
            type_counts[type_name] += 1
        
        # Calculate time span
        if items:
            timestamps = [item.timestamp for item in items]
            oldest = min(timestamps)
            newest = max(timestamps)
            time_span_minutes = (newest - oldest).total_seconds() / 60
        else:
            time_span_minutes = 0
        
        return {
            "session_id": session_id,
            "total_items": total_items,
            "type_distribution": type_counts,
            "time_span_minutes": time_span_minutes,
            "has_recent_activity": time_span_minutes < 60  # within last hour
        }
    except Exception as e:
        logger.error("Error getting context summary: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get context summary: {str(e)}"
        ) from e

@router.post("/context/{session_id}/optimize")
async def optimize_context(
    session_id: str = Path(...),
    max_items: int = Query(100, description="Maximum items to keep"),
    current_user: DevFriendlyUser = None
):
    """
    Optimize context by removing low-priority and old items
    """
    try:
        # Get all items
        all_items = await context_service.retrieve_context(
            session_id=session_id,
            limit=1000  # Get all items
        )
        
        if len(all_items) <= max_items:
            return {
                "session_id": session_id,
                "items_before": len(all_items),
                "items_after": len(all_items),
                "items_removed": 0,
                "message": "No optimization needed"
            }
        
        # Sort by priority and recency
        sorted_items = sorted(
            all_items,
            key=lambda x: (x.priority, x.timestamp),
            reverse=True
        )
        
        # Keep only the top items
        optimized_items = sorted_items[:max_items]
        
        # Replace context with optimized set
        await context_service.store_context(
            session_id=session_id,
            context_items=optimized_items,
            replace_existing=True
        )
        
        return {
            "session_id": session_id,
            "items_before": len(all_items),
            "items_after": len(optimized_items),
            "items_removed": len(all_items) - len(optimized_items),
            "message": f"Context optimized, removed {len(all_items) - len(optimized_items)} items"
        }
    except Exception as e:
        logger.error("Error optimizing context: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to optimize context: {str(e)}"
        ) from e

@router.get("/sessions")
async def list_active_sessions(
    current_user: DevFriendlyUser = None
):
    """List all active sessions with context"""
    try:
        # Get all session IDs from context store
        sessions = []
        for session_id in context_service._context_store.keys():
            items = await context_service.retrieve_context(session_id)
            if items:  # Only include sessions with context
                sessions.append({
                    "session_id": session_id,
                    "item_count": len(items),
                    "last_activity": max(item.timestamp for item in items) if items else None
                })
        
        # Sort by last activity
        sessions.sort(key=lambda x: x["last_activity"] or datetime.min, reverse=True)
        
        return {
            "active_sessions": sessions,
            "total_sessions": len(sessions)
        }
    except Exception as e:
        logger.error("Error listing sessions: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list sessions: {str(e)}"
        ) from e

@router.get("/health")
async def mcp_health_check():
    """Health check for MCP service"""
    try:
        # Basic health metrics
        total_sessions = len(context_service._context_store)
        total_items = sum(
            len(items) for items in context_service._context_store.values()
        )
        
        return {
            "status": "healthy",
            "service": "model_context_protocol",
            "total_sessions": total_sessions,
            "total_context_items": total_items,
            "timestamp": datetime.now(),
            "features": [
                "context_storage",
                "context_retrieval",
                "llm_integration",
                "session_management"
            ]
        }
    except Exception as e:
        logger.error("Error in MCP health check: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        ) from e
