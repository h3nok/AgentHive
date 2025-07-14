"""
Sessions API router for managing chat sessions.

This module provides endpoints for creating, reading, updating, and deleting chat sessions.
"""

from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.observability import get_logger
from .deps import DevFriendlyUser, RedisClient

logger = get_logger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    title: Optional[str] = None
    folder_id: Optional[str] = None

class SessionPreview(BaseModel):
    id: str = Field(..., alias="session_id")
    title: Optional[str] = None
    folder_id: Optional[str] = None
    pinned: bool = False
    updated_at: datetime
    created_at: datetime
    preview: str = ""

    class Config:
        populate_by_name = True

class MessageOut(BaseModel):
    message_id: str
    role: str
    agent: Optional[str] = None
    content: Optional[str] = None
    created_at: datetime

class SessionDetail(SessionPreview):
    messages: List[MessageOut] = []

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    folder_id: Optional[str] = None
    pinned: Optional[bool] = None

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

async def _get_session_preview(redis: Any, session_id: str) -> str:
    """Get a preview of the latest message in the session."""
    try:
        # Get the latest message from the session
        messages_key = f"session:{session_id}:messages"
        message_ids = await redis.lrange(messages_key, -1, -1)
        
        if not message_ids:
            return ""
        
        message_id = message_ids[0]
        if isinstance(message_id, bytes):
            message_id = message_id.decode()
        
        message_data = await redis.hgetall(f"message:{message_id}")
        if not message_data:
            return ""
        
        content = message_data.get(b'content', b'').decode() if isinstance(message_data.get(b'content'), bytes) else message_data.get('content', '')
        return content[:50] if content else ""
    except Exception as e:
        logger.warning(f"Failed to get session preview for {session_id}: {e}")
        return ""

async def _get_session_from_redis(redis: Any, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Get session data from Redis."""
    try:
        session_data = await redis.hgetall(f"session:{session_id}")
        if not session_data:
            return None
        
        # Convert bytes to strings if necessary
        session = {}
        for key, value in session_data.items():
            if isinstance(key, bytes):
                key = key.decode()
            if isinstance(value, bytes):
                value = value.decode()
            session[key] = value
        
        # Check ownership
        if session.get('user_id') != user_id:
            return None
        
        return session
    except Exception as e:
        logger.error(f"Failed to get session {session_id}: {e}")
        return None

async def _save_session_to_redis(redis: Any, session_data: Dict[str, Any]) -> None:
    """Save session data to Redis."""
    try:
        session_id = session_data['session_id']
        user_id = session_data['user_id']
        
        # Save session hash
        await redis.hset(f"session:{session_id}", mapping=session_data)
        
        # Add to user's sessions set
        await redis.sadd(f"user:{user_id}:sessions", session_id)
        
        # Set TTL (24 hours)
        await redis.expire(f"session:{session_id}", 86400)
        
    except Exception as e:
        logger.error(f"Failed to save session: {e}")
        raise HTTPException(status_code=500, detail="Failed to save session")

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("", response_model=SessionPreview)
async def create_session(
    payload: SessionCreate,
    user: DevFriendlyUser,
    redis: RedisClient
):
    """Create a new task session."""
    import uuid
    
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    session_data = {
        'session_id': session_id,
        'user_id': user.get('user_id', user.get('oid', user.get('sub', user.get('id', 'unknown')))),
        'title': payload.title or "New Chat",
        'folder_id': payload.folder_id,
        'pinned': False,
        'created_at': now.isoformat(),
        'updated_at': now.isoformat()
    }
    
    await _save_session_to_redis(redis, session_data)
    
    return SessionPreview(
        session_id=session_id,
        title=session_data['title'],
        folder_id=session_data.get('folder_id'),
        pinned=False,
        created_at=now,
        updated_at=now,
        preview=""
    )

@router.get("", response_model=List[SessionPreview])
async def list_sessions(
    user: DevFriendlyUser,
    redis: RedisClient,
    limit: int = Query(50, le=100)
):
    """List all sessions for the current user."""
    try:
        user_id = user.get('user_id', user.get('oid', user.get('sub', user.get('id', 'unknown'))))
        
        # Get all session IDs for the user
        session_ids = await redis.smembers(f"user:{user_id}:sessions")
        
        sessions = []
        for session_id in session_ids:
            if isinstance(session_id, bytes):
                session_id = session_id.decode()
            
            session_data = await _get_session_from_redis(redis, session_id, user_id)
            if session_data:
                preview = await _get_session_preview(redis, session_id)
                
                sessions.append(SessionPreview(
                    session_id=session_id,
                    title=session_data.get('title', 'Untitled'),
                    folder_id=session_data.get('folder_id'),
                    pinned=session_data.get('pinned', 'false').lower() == 'true',
                    created_at=datetime.fromisoformat(session_data.get('created_at', datetime.utcnow().isoformat())),
                    updated_at=datetime.fromisoformat(session_data.get('updated_at', datetime.utcnow().isoformat())),
                    preview=preview
                ))
        
        # Sort by pinned status and updated_at
        sessions.sort(key=lambda s: (not s.pinned, s.updated_at), reverse=True)
        
        return sessions[:limit]
        
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to list sessions")

@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: str,
    user: DevFriendlyUser,
    redis: RedisClient
):
    """Get a specific session with all its messages."""
    try:
        user_id = user.get('user_id', user.get('oid', user.get('sub', user.get('id', 'unknown'))))
        
        session_data = await _get_session_from_redis(redis, session_id, user_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get messages for the session
        messages = []
        try:
            messages_key = f"session:{session_id}:messages"
            message_ids = await redis.lrange(messages_key, 0, -1)
            
            for message_id in message_ids:
                if isinstance(message_id, bytes):
                    message_id = message_id.decode()
                
                message_data = await redis.hgetall(f"message:{message_id}")
                if message_data:
                    # Convert bytes to strings
                    message = {}
                    for key, value in message_data.items():
                        if isinstance(key, bytes):
                            key = key.decode()
                        if isinstance(value, bytes):
                            value = value.decode()
                        message[key] = value
                    
                    messages.append(MessageOut(
                        message_id=message_id,
                        role=message.get('role', 'user'),
                        agent=message.get('agent'),
                        content=message.get('content', ''),
                        created_at=datetime.fromisoformat(message.get('created_at', datetime.utcnow().isoformat()))
                    ))
        except Exception as e:
            logger.warning(f"Failed to get messages for session {session_id}: {e}")
        
        preview = await _get_session_preview(redis, session_id)
        
        return SessionDetail(
            session_id=session_id,
            title=session_data.get('title', 'Untitled'),
            folder_id=session_data.get('folder_id'),
            pinned=session_data.get('pinned', 'false').lower() == 'true',
            created_at=datetime.fromisoformat(session_data.get('created_at', datetime.utcnow().isoformat())),
            updated_at=datetime.fromisoformat(session_data.get('updated_at', datetime.utcnow().isoformat())),
            preview=preview,
            messages=messages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get session")

@router.patch("/{session_id}", response_model=SessionPreview)
async def update_session(
    session_id: str,
    payload: SessionUpdate,
    user: DevFriendlyUser,
    redis: RedisClient
):
    """Update a session."""
    try:
        user_id = user.get('user_id', user.get('oid', user.get('sub', user.get('id', 'unknown'))))
        
        session_data = await _get_session_from_redis(redis, session_id, user_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update fields
        update_data = payload.model_dump(exclude_unset=True)
        if update_data:
            session_data.update(update_data)
            session_data['updated_at'] = datetime.utcnow().isoformat()
            
            await _save_session_to_redis(redis, session_data)
        
        preview = await _get_session_preview(redis, session_id)
        
        return SessionPreview(
            session_id=session_id,
            title=session_data.get('title', 'Untitled'),
            folder_id=session_data.get('folder_id'),
            pinned=session_data.get('pinned', 'false').lower() == 'true',
            created_at=datetime.fromisoformat(session_data.get('created_at', datetime.utcnow().isoformat())),
            updated_at=datetime.fromisoformat(session_data.get('updated_at', datetime.utcnow().isoformat())),
            preview=preview
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update session")

@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    user: DevFriendlyUser,
    redis: RedisClient
):
    """Delete a session and all its messages."""
    try:
        user_id = user.get('user_id', user.get('oid', user.get('sub', user.get('id', 'unknown'))))
        
        session_data = await _get_session_from_redis(redis, session_id, user_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete all messages in the session
        try:
            messages_key = f"session:{session_id}:messages"
            message_ids = await redis.lrange(messages_key, 0, -1)
            
            for message_id in message_ids:
                if isinstance(message_id, bytes):
                    message_id = message_id.decode()
                await redis.delete(f"message:{message_id}")
            
            # Delete the messages list
            await redis.delete(messages_key)
        except Exception as e:
            logger.warning(f"Failed to delete messages for session {session_id}: {e}")
        
        # Delete the session
        await redis.delete(f"session:{session_id}")
        
        # Remove from user's sessions set
        await redis.srem(f"user:{user_id}:sessions", session_id)
        
        return Response(status_code=204)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")
