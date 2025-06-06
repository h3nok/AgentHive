"""
SQLAlchemy models for the application.

This module defines the database models using SQLAlchemy ORM.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from uuid import UUID as UUID_uuid4, uuid4

from ..domain.schemas import AgentType, MessageRole

Base = declarative_base()


class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="user")
    metrics = relationship("RequestMetrics", back_populates="user")


class Session(Base):
    """Chat session model."""
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata_ = Column("metadata", JSON, default=dict)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session")
    metrics = relationship("RequestMetrics", back_populates="session")


class Message(Base):
    """Chat message model."""
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(String, nullable=False)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="messages")


class Agent(Base):
    """Agent model."""
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    agent_type = Column(SQLEnum(AgentType), nullable=False)
    config = Column(JSON, nullable=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    metrics = relationship("RequestMetrics", back_populates="agent")


class RequestMetrics(Base):
    """Request metrics model."""
    __tablename__ = "request_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    request_id = Column(UUID(as_uuid=True), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    processing_time = Column(Float, nullable=False)
    token_count = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    success = Column(Boolean, default=True)
    error_message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="metrics")
    user = relationship("User", back_populates="metrics")
    agent = relationship("Agent", back_populates="metrics")


class RateLimit(Base):
    """Rate limit model."""
    __tablename__ = "rate_limits"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    key = Column(String, unique=True, index=True)
    requests = Column(Integer, default=0)
    window_start = Column(DateTime, default=datetime.utcnow)
    window_end = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 