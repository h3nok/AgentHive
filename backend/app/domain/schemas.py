"""
Pydantic schemas for request/response models.

This module defines all the data models used across the application.
"""

from typing import Dict, List, Optional, Any, Union, AsyncIterator
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator
import uuid
from uuid import UUID, uuid4


class AgentType(str, Enum):
    """Available agent types."""
    GENERAL = "general"
    SALES = "sales"
    SUPPORT = "support"
    HR = "hr"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    CUSTOM = "custom"


class RoutingMethod(str, Enum):
    """Routing decision methods."""
    REGEX = "regex"
    ML_CLASSIFIER = "ml_classifier"
    LLM_ROUTER = "llm_router"
    FALLBACK = "fallback"


class MessageRole(str, Enum):
    """Message roles in conversation."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class StreamEventType(str, Enum):
    """WebSocket stream event types."""
    TOKEN = "token"
    END = "end"
    ERROR = "error"
    METADATA = "metadata"


# Request Models
class Message(BaseModel):
    """Single message in a conversation."""
    role: MessageRole
    content: str
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PromptIn(BaseModel):
    """Input prompt for chat endpoint."""
    prompt: str = Field(..., description="User's input prompt")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context")
    history: Optional[List[Message]] = Field(default_factory=list, description="Conversation history")
    max_tokens: Optional[int] = Field(2000, description="Maximum tokens for response")
    temperature: Optional[float] = Field(0.7, description="Temperature for LLM sampling")
    stream: bool = Field(True, description="Enable streaming response")
    
    @validator("session_id", pre=True)
    @classmethod
    def generate_session_id(cls, v):
        return v or str(uuid.uuid4())


class RequestContext(BaseModel):
    """Context passed through the routing chain."""
    prompt: PromptIn
    user_id: Optional[str] = None
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        arbitrary_types_allowed = True


# Response Models
class IntentResult(BaseModel):
    """Result of intent classification."""
    intent: str
    confidence: float
    entities: Dict[str, Any] = Field(default_factory=dict)
    routing_method: RoutingMethod
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentResponse(BaseModel):
    """Response from an agent."""
    content: str
    agent_id: str
    agent_type: AgentType
    metadata: Dict[str, Any] = Field(default_factory=dict)
    usage: Optional[Dict[str, int]] = None
    latency_ms: Optional[float] = None
    
    class Config:
        arbitrary_types_allowed = True


class ChatResponse(BaseModel):
    """Response for chat endpoint."""
    response: str
    session_id: str
    agent_id: str
    agent_type: AgentType
    metadata: Dict[str, Any] = Field(default_factory=dict)
    usage: Optional[Dict[str, int]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class StreamEvent(BaseModel):
    """Event for WebSocket streaming."""
    type: StreamEventType
    content: Optional[str] = None
    message_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Agent Models
class AgentManifest(BaseModel):
    """Agent plugin manifest."""
    name: str
    description: str
    version: str
    agent_type: AgentType
    cost_per_call: float = 0.0
    module_path: str
    capabilities: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    config: Dict[str, Any] = Field(default_factory=dict)


class AgentRegistration(BaseModel):
    """Agent registration info."""
    agent_id: str
    agent_type: AgentType
    manifest: AgentManifest
    enabled: bool = True
    load_order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Metrics Models
class TokenUsage(BaseModel):
    """Token usage metrics."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    model: str
    cost: Optional[float] = None


class LatencyMetrics(BaseModel):
    """Latency metrics for operations."""
    routing_ms: float
    agent_selection_ms: float
    agent_execution_ms: float
    total_ms: float


class RequestMetrics(BaseModel):
    """Complete request metrics."""
    request_id: str
    session_id: str
    agent_id: str
    token_usage: Optional[TokenUsage] = None
    latency: LatencyMetrics
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    success: bool = True
    error: Optional[str] = None


# Command Models (for Command pattern)
class Command(BaseModel):
    """Base command model."""
    command_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    command_type: str
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        arbitrary_types_allowed = True


class CommandResult(BaseModel):
    """Result of command execution."""
    command_id: str
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Health Check Models
class HealthStatus(BaseModel):
    """Health check status."""
    status: str  # healthy, degraded, unhealthy
    checks: Dict[str, bool]
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Session Models
class Session(BaseModel):
    """Chat session."""
    session_id: str
    user_id: Optional[str] = None
    messages: List[Message] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def add_message(self, message: Message) -> None:
        """Add a message to the session."""
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 