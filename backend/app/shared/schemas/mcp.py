from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from enum import Enum
import uuid
from datetime import datetime

# Existing ContextType, ContextItem, etc. would be imported or defined here

class ToolCallType(str, Enum):
    FUNCTION = "function"
    API = "api"
    PLUGIN = "plugin"
    OTHER = "other"

class ToolCall(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ToolCallType
    name: str
    input: Dict[str, Any]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)

class ToolResult(BaseModel):
    id: str
    output: Dict[str, Any]
    success: bool = True
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)

class AgentMessageType(str, Enum):
    USER = "user"
    AGENT = "agent"
    TOOL = "tool"
    SYSTEM = "system"

class AgentMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: AgentMessageType
    sender: str
    content: str
    tool_calls: Optional[List[ToolCall]] = None
    tool_results: Optional[List[ToolResult]] = None
    context: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now) 