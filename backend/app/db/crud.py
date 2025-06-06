"""
Database CRUD operations.

This module provides CRUD operations for database models.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .models import User, Session as DBSession, Message, Agent, RequestMetrics, RateLimit
from ..domain.schemas import AgentType, MessageRole


# User operations
def get_user(db: Session, user_id: UUID) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    """Get users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


def create_user(
    db: Session,
    email: str,
    hashed_password: str,
    full_name: Optional[str] = None
) -> User:
    """Create new user."""
    db_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(
    db: Session,
    user_id: UUID,
    update_data: Dict[str, Any]
) -> Optional[User]:
    """Update user."""
    db_user = get_user(db, user_id)
    if db_user:
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: UUID) -> bool:
    """Delete user."""
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# Session operations
def get_session(db: Session, session_id: UUID) -> Optional[DBSession]:
    """Get session by ID."""
    return db.query(DBSession).filter(DBSession.id == session_id).first()


def get_user_sessions(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[DBSession]:
    """Get user sessions with pagination."""
    return (
        db.query(DBSession)
        .filter(DBSession.user_id == user_id)
        .order_by(desc(DBSession.updated_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_session(
    db: Session,
    user_id: UUID,
    metadata: Optional[Dict[str, Any]] = None
) -> DBSession:
    """Create new session."""
    db_session = DBSession(
        user_id=user_id,
        metadata=metadata or {}
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def update_session(
    db: Session,
    session_id: UUID,
    update_data: Dict[str, Any]
) -> Optional[DBSession]:
    """Update session."""
    db_session = get_session(db, session_id)
    if db_session:
        for key, value in update_data.items():
            setattr(db_session, key, value)
        db.commit()
        db.refresh(db_session)
    return db_session


def delete_session(db: Session, session_id: UUID) -> bool:
    """Delete session."""
    db_session = get_session(db, session_id)
    if db_session:
        db.delete(db_session)
        db.commit()
        return True
    return False


# Message operations
def get_message(db: Session, message_id: UUID) -> Optional[Message]:
    """Get message by ID."""
    return db.query(Message).filter(Message.id == message_id).first()


def get_session_messages(
    db: Session,
    session_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[Message]:
    """Get session messages with pagination."""
    return (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_message(
    db: Session,
    session_id: UUID,
    role: MessageRole,
    content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Message:
    """Create new message."""
    db_message = Message(
        session_id=session_id,
        role=role,
        content=content,
        metadata=metadata or {}
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def update_message(
    db: Session,
    message_id: UUID,
    update_data: Dict[str, Any]
) -> Optional[Message]:
    """Update message."""
    db_message = get_message(db, message_id)
    if db_message:
        for key, value in update_data.items():
            setattr(db_message, key, value)
        db.commit()
        db.refresh(db_message)
    return db_message


def delete_message(db: Session, message_id: UUID) -> bool:
    """Delete message."""
    db_message = get_message(db, message_id)
    if db_message:
        db.delete(db_message)
        db.commit()
        return True
    return False


# Agent operations
def get_agent(db: Session, agent_id: UUID) -> Optional[Agent]:
    """Get agent by ID."""
    return db.query(Agent).filter(Agent.id == agent_id).first()


def get_agents(
    db: Session,
    agent_type: Optional[AgentType] = None,
    enabled: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Agent]:
    """Get agents with filters and pagination."""
    query = db.query(Agent)
    if agent_type:
        query = query.filter(Agent.agent_type == agent_type)
    if enabled is not None:
        query = query.filter(Agent.enabled == enabled)
    return query.order_by(Agent.load_order).offset(skip).limit(limit).all()


def create_agent(
    db: Session,
    agent_type: AgentType,
    name: str,
    version: str,
    description: Optional[str] = None,
    enabled: bool = True,
    load_order: int = 0,
    capabilities: Optional[List[str]] = None,
    config: Optional[Dict[str, Any]] = None
) -> Agent:
    """Create new agent."""
    db_agent = Agent(
        agent_type=agent_type,
        name=name,
        version=version,
        description=description,
        enabled=enabled,
        load_order=load_order,
        capabilities=capabilities or [],
        config=config or {}
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


def update_agent(
    db: Session,
    agent_id: UUID,
    update_data: Dict[str, Any]
) -> Optional[Agent]:
    """Update agent."""
    db_agent = get_agent(db, agent_id)
    if db_agent:
        for key, value in update_data.items():
            setattr(db_agent, key, value)
        db.commit()
        db.refresh(db_agent)
    return db_agent


def delete_agent(db: Session, agent_id: UUID) -> bool:
    """Delete agent."""
    db_agent = get_agent(db, agent_id)
    if db_agent:
        db.delete(db_agent)
        db.commit()
        return True
    return False


# Request metrics operations
def get_metrics(db: Session, metrics_id: UUID) -> Optional[RequestMetrics]:
    """Get metrics by ID."""
    return db.query(RequestMetrics).filter(RequestMetrics.id == metrics_id).first()


def get_metrics_by_request_id(
    db: Session,
    request_id: str
) -> Optional[RequestMetrics]:
    """Get metrics by request ID."""
    return (
        db.query(RequestMetrics)
        .filter(RequestMetrics.request_id == request_id)
        .first()
    )


def create_metrics(
    db: Session,
    request_id: str,
    session_id: UUID,
    user_id: UUID,
    agent_id: UUID,
    success: bool = True,
    error: Optional[str] = None,
    token_usage: Optional[Dict[str, Any]] = None,
    latency: Optional[Dict[str, Any]] = None
) -> RequestMetrics:
    """Create new metrics."""
    db_metrics = RequestMetrics(
        request_id=request_id,
        session_id=session_id,
        user_id=user_id,
        agent_id=agent_id,
        success=success,
        error=error,
        token_usage=token_usage,
        latency=latency
    )
    db.add(db_metrics)
    db.commit()
    db.refresh(db_metrics)
    return db_metrics


def update_metrics(
    db: Session,
    metrics_id: UUID,
    update_data: Dict[str, Any]
) -> Optional[RequestMetrics]:
    """Update metrics."""
    db_metrics = get_metrics(db, metrics_id)
    if db_metrics:
        for key, value in update_data.items():
            setattr(db_metrics, key, value)
        db.commit()
        db.refresh(db_metrics)
    return db_metrics


def delete_metrics(db: Session, metrics_id: UUID) -> bool:
    """Delete metrics."""
    db_metrics = get_metrics(db, metrics_id)
    if db_metrics:
        db.delete(db_metrics)
        db.commit()
        return True
    return False


# Rate limit operations
def get_rate_limit(db: Session, key: str) -> Optional[RateLimit]:
    """Get rate limit by key."""
    return db.query(RateLimit).filter(RateLimit.key == key).first()


def create_rate_limit(
    db: Session,
    key: str,
    window_end: Optional[datetime] = None
) -> RateLimit:
    """Create new rate limit."""
    db_rate_limit = RateLimit(
        key=key,
        window_end=window_end
    )
    db.add(db_rate_limit)
    db.commit()
    db.refresh(db_rate_limit)
    return db_rate_limit


def update_rate_limit(
    db: Session,
    key: str,
    update_data: Dict[str, Any]
) -> Optional[RateLimit]:
    """Update rate limit."""
    db_rate_limit = get_rate_limit(db, key)
    if db_rate_limit:
        for key, value in update_data.items():
            setattr(db_rate_limit, key, value)
        db.commit()
        db.refresh(db_rate_limit)
    return db_rate_limit


def delete_rate_limit(db: Session, key: str) -> bool:
    """Delete rate limit."""
    db_rate_limit = get_rate_limit(db, key)
    if db_rate_limit:
        db.delete(db_rate_limit)
        db.commit()
        return True
    return False 