"""
Chat API endpoints.

This module provides chat-related API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from ..core.settings import settings
from ..db.session import get_db
from ..db.crud import (
    get_session,
    get_user_sessions,
    create_session,
    update_session,
    delete_session,
    get_message,
    get_session_messages,
    create_message,
    update_message,
    delete_message
)
from ..domain.schemas import (
    Session as SessionSchema,
    SessionCreate,
    SessionUpdate,
    Message as MessageSchema,
    MessageCreate,
    MessageUpdate,
    PromptIn,
    ResponseOut
)
from .base import get_current_active_user
from ..services.router import RouterService


# Create router
router = APIRouter()

# Create router service
router_service = RouterService()


@router.get("/sessions", response_model=List[SessionSchema])
async def get_sessions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> List[SessionSchema]:
    """Get user sessions.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Current user
        
    Returns:
        List[SessionSchema]: List of sessions
    """
    sessions = get_user_sessions(db, current_user.id, skip, limit)
    return sessions


@router.post("/sessions", response_model=SessionSchema)
async def create_new_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> SessionSchema:
    """Create new session.
    
    Args:
        session_in: Session creation data
        db: Database session
        current_user: Current user
        
    Returns:
        SessionSchema: Created session
    """
    session = create_session(
        db=db,
        user_id=current_user.id,
        metadata=session_in.metadata
    )
    return session


@router.get("/sessions/{session_id}", response_model=SessionSchema)
async def get_session_by_id(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> SessionSchema:
    """Get session by ID.
    
    Args:
        session_id: Session ID
        db: Database session
        current_user: Current user
        
    Returns:
        SessionSchema: Session
        
    Raises:
        HTTPException: If session not found or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return session


@router.put("/sessions/{session_id}", response_model=SessionSchema)
async def update_session_by_id(
    session_id: UUID,
    session_in: SessionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> SessionSchema:
    """Update session by ID.
    
    Args:
        session_id: Session ID
        session_in: Session update data
        db: Database session
        current_user: Current user
        
    Returns:
        SessionSchema: Updated session
        
    Raises:
        HTTPException: If session not found or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    session = update_session(db, session_id, session_in.dict(exclude_unset=True))
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session_by_id(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> None:
    """Delete session by ID.
    
    Args:
        session_id: Session ID
        db: Database session
        current_user: Current user
        
    Raises:
        HTTPException: If session not found or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    delete_session(db, session_id)


@router.get("/sessions/{session_id}/messages", response_model=List[MessageSchema])
async def get_session_messages_by_id(
    session_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> List[MessageSchema]:
    """Get session messages by ID.
    
    Args:
        session_id: Session ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Current user
        
    Returns:
        List[MessageSchema]: List of messages
        
    Raises:
        HTTPException: If session not found or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    messages = get_session_messages(db, session_id, skip, limit)
    return messages


@router.post("/sessions/{session_id}/messages", response_model=MessageSchema)
async def create_session_message(
    session_id: UUID,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> MessageSchema:
    """Create session message.
    
    Args:
        session_id: Session ID
        message_in: Message creation data
        db: Database session
        current_user: Current user
        
    Returns:
        MessageSchema: Created message
        
    Raises:
        HTTPException: If session not found or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    message = create_message(
        db=db,
        session_id=session_id,
        role=message_in.role,
        content=message_in.content,
        metadata=message_in.metadata
    )
    return message


@router.get("/sessions/{session_id}/messages/{message_id}", response_model=MessageSchema)
async def get_session_message_by_id(
    session_id: UUID,
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> MessageSchema:
    """Get session message by ID.
    
    Args:
        session_id: Session ID
        message_id: Message ID
        db: Database session
        current_user: Current user
        
    Returns:
        MessageSchema: Message
        
    Raises:
        HTTPException: If session or message not found, or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    message = get_message(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    if message.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message does not belong to session"
        )
    return message


@router.put("/sessions/{session_id}/messages/{message_id}", response_model=MessageSchema)
async def update_session_message(
    session_id: UUID,
    message_id: UUID,
    message_in: MessageUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> MessageSchema:
    """Update session message.
    
    Args:
        session_id: Session ID
        message_id: Message ID
        message_in: Message update data
        db: Database session
        current_user: Current user
        
    Returns:
        MessageSchema: Updated message
        
    Raises:
        HTTPException: If session or message not found, or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    message = get_message(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    if message.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message does not belong to session"
        )
    message = update_message(
        db,
        message_id,
        message_in.dict(exclude_unset=True)
    )
    return message


@router.delete(
    "/sessions/{session_id}/messages/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_session_message(
    session_id: UUID,
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> None:
    """Delete session message.
    
    Args:
        session_id: Session ID
        message_id: Message ID
        db: Database session
        current_user: Current user
        
    Raises:
        HTTPException: If session or message not found, or not owned by user
    """
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    message = get_message(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    if message.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message does not belong to session"
        )
    delete_message(db, message_id)


@router.post("/chat", response_model=ResponseOut)
async def chat(
    prompt: PromptIn,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> ResponseOut:
    """Process chat prompt.
    
    Args:
        prompt: Chat prompt
        db: Database session
        current_user: Current user
        
    Returns:
        ResponseOut: Chat response
        
    Raises:
        HTTPException: If session not found or not owned by user
    """
    # Get or create session
    if prompt.session_id:
        session = get_session(db, prompt.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    else:
        session = create_session(db, current_user.id)
    
    # Create user message
    user_message = create_message(
        db=db,
        session_id=session.id,
        role="user",
        content=prompt.content,
        metadata=prompt.metadata
    )
    
    # Process prompt
    response = await router_service.process_prompt(
        db=db,
        session_id=session.id,
        user_id=current_user.id,
        prompt=prompt
    )
    
    # Create assistant message
    assistant_message = create_message(
        db=db,
        session_id=session.id,
        role="assistant",
        content=response.content,
        metadata=response.metadata
    )
    
    return response 