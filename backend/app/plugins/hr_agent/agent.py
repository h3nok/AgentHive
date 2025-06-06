"""
HR agent implementation for handling employee-related inquiries.

This agent specializes in HR questions, vacation time requests, time off management, 
benefits inquiries, and UKG system questions.
"""

from typing import Union, AsyncIterator

from app.domain.agent_factory import BaseAgent
from app.domain.schemas import RequestContext, AgentResponse, AgentType, AgentManifest
from app.adapters.llm_openai import OpenAIAdapter
from app.core.observability import get_logger, measure_tokens

logger = get_logger(__name__)


class Agent(BaseAgent):
    """HR specialist agent implementation."""
    
    def __init__(self, agent_id: str, manifest: AgentManifest):
        super().__init__(agent_id, manifest)
        self.llm_adapter: OpenAIAdapter | None = None
        self.system_prompt = manifest.config.get(
            "system_prompt",
            "You are an HR specialist AI assistant."
        )
        
    async def _initialize(self) -> None:
        """Initialize the HR agent."""
        self.llm_adapter = OpenAIAdapter()
        logger.info(f"HR agent initialized: {self.agent_id}")
        
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:
        """Handle HR-related queries."""
        try:
            if not self.llm_adapter:
                await self._initialize()
            
            # Check if this is a UKG demo request
            if self._is_ukg_demo_request(context.prompt.prompt):
                return await self._handle_ukg_demo_request(context)
            
            # Handle general HR requests
            return await self._handle_general_hr_request(context)
            
        except (RuntimeError, ValueError, TypeError) as e:
            logger.error(f"Error handling HR request: {str(e)}")
            return AgentResponse(
                content="I'm sorry, I encountered an error processing your HR request. Please try again or contact IT support.",
                agent_id=self.agent_id,
                agent_type=AgentType.HR
            )
    
    def _is_ukg_demo_request(self, message: str) -> bool:
        """Check if the message is requesting UKG demo functionality."""
        message_lower = message.lower()
        ukg_keywords = [
            "vacation time", "time off", "pto", "paid time off",
            "sick leave", "holiday", "absence", "leave request",
            "ukg", "kronos", "schedule", "clock in", "clock out"
        ]
        return any(keyword in message_lower for keyword in ukg_keywords)
    
    async def _handle_ukg_demo_request(self, context: RequestContext) -> AgentResponse:
        """Handle UKG demo-specific requests."""
        if not self.llm_adapter:
            await self._initialize()
            
        # This is a mock implementation for demo purposes        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": context.prompt.prompt}
        ]
        
        if context.prompt.history:
            # Add recent conversation history for context
            for msg in context.prompt.history[-5:]:  # Last 5 messages for context
                messages.insert(-1, {
                    "role": msg.role.value,
                    "content": msg.content
                })
        
        try:
            @measure_tokens
            async def get_response():
                if not self.llm_adapter:
                    raise RuntimeError("LLM adapter not initialized")
                return await self.llm_adapter.complete(
                    prompt=context.prompt.prompt,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800
                )
            
            response = await get_response()
            
            return AgentResponse(
                content=response.content,
                agent_id=self.agent_id,
                agent_type=AgentType.HR,
                metadata={"demo_mode": True, "ukg_request": True}
            )
            
        except (RuntimeError, ValueError, ConnectionError) as e:
            logger.error(f"Error processing UKG demo request: {str(e)}")
            return AgentResponse(
                content="I'm sorry, I'm having trouble processing your HR request right now. Please try again in a moment.",
                agent_id=self.agent_id,
                agent_type=AgentType.HR
            )
    
    async def _handle_general_hr_request(self, context: RequestContext) -> AgentResponse:
        """Handle general HR requests."""
        if not self.llm_adapter:
            await self._initialize()
            
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": context.prompt.prompt}
        ]
        
        try:
            @measure_tokens
            async def get_response():
                if not self.llm_adapter:
                    raise RuntimeError("LLM adapter not initialized")
                return await self.llm_adapter.complete(
                    prompt=context.prompt.prompt,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000
                )
            
            response = await get_response()
            
            return AgentResponse(
                content=response.content,
                agent_id=self.agent_id,
                agent_type=AgentType.HR
            )
            
        except (RuntimeError, ValueError, ConnectionError) as e:
            logger.error(f"Error processing general HR request: {str(e)}")
            return AgentResponse(
                content="I'm sorry, I encountered an error processing your request. Please try again.",
                agent_id=self.agent_id,
                agent_type=AgentType.HR
            )
    
    def get_capabilities(self) -> list[str]:
        """Get HR agent capabilities."""
        return self.manifest.capabilities
