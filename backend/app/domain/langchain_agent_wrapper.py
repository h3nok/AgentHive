"""
LangChain Agent Wrapper for AgentHive Integration.

This module provides a wrapper that integrates LangChain agents with AgentHive's
existing BaseAgent interface, maintaining compatibility while adding framework capabilities.
"""

from typing import Union, AsyncIterator, List, Dict, Any, Optional
from abc import ABC, abstractmethod
import asyncio
from datetime import datetime

from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool, BaseTool
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.callbacks import AsyncCallbackHandler

from ..domain.agent_factory import BaseAgent
from ..domain.schemas import RequestContext, AgentResponse, AgentManifest
from ..core.observability import get_logger, with_tracing, measure_tokens
from ..adapters.llm_openai import OpenAIAdapter

logger = get_logger(__name__)


class AgentHiveCallbackHandler(AsyncCallbackHandler):
    """Custom callback handler for AgentHive observability integration."""
    
    def __init__(self, request_context: RequestContext):
        self.request_context = request_context
        self.start_time = datetime.utcnow()
        self.tokens_used = 0
        
    async def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs):
        logger.debug(f"LLM started for request {self.request_context.request_id}")
        
    async def on_llm_end(self, response, **kwargs):
        if hasattr(response, 'llm_output') and response.llm_output:
            token_usage = response.llm_output.get('token_usage', {})
            self.tokens_used += token_usage.get('total_tokens', 0)
        
    async def on_tool_start(self, serialized: Dict[str, Any], input_str: str, **kwargs):
        logger.debug(f"Tool {serialized.get('name')} started with input: {input_str[:100]}...")
        
    async def on_tool_end(self, output: str, **kwargs):
        logger.debug(f"Tool completed with output: {output[:100]}...")


class LangChainAgentWrapper(BaseAgent):
    """
    Wrapper that integrates LangChain agents with AgentHive's BaseAgent interface.
    
    This maintains compatibility with existing AgentHive systems while providing
    access to LangChain's advanced agent capabilities.
    """
    
    def __init__(self, agent_id: str, manifest: AgentManifest):
        super().__init__(agent_id, manifest)
        self.llm: Optional[ChatOpenAI] = None
        self.tools: List[BaseTool] = []
        self.memory: Optional[ConversationBufferWindowMemory] = None
        self.agent_executor: Optional[AgentExecutor] = None
        self.openai_adapter: Optional[OpenAIAdapter] = None
        
        # Configuration from manifest
        self.max_tokens = manifest.config.get("max_tokens", 1500)
        self.temperature = manifest.config.get("temperature", 0.3)
        self.memory_window = manifest.config.get("memory_window", 10)
        
    async def _initialize(self) -> None:
        """Initialize the LangChain agent with tools and memory."""
        try:
            # Initialize OpenAI adapter for compatibility
            from app.domain.llm_factory import create_llm_adapter
            self.openai_adapter = create_llm_adapter()
            
            # Create LangChain LLM
            self.llm = ChatOpenAI(
                model="gpt-4",
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                streaming=True
            )
            
            # Initialize memory
            self.memory = ConversationBufferWindowMemory(
                k=self.memory_window,
                memory_key="chat_history",
                return_messages=True
            )
            
            # Initialize tools (will be populated by subclasses)
            await self._setup_tools()
            
            # Create agent prompt
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.manifest.config.get(
                    "system_prompt", 
                    "You are a helpful AI assistant."
                )),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad")
            ])
            
            # Create agent
            agent = create_openai_functions_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=prompt
            )
            
            # Create agent executor
            self.agent_executor = AgentExecutor(
                agent=agent,
                tools=self.tools,
                memory=self.memory,
                verbose=True,
                max_iterations=5,
                early_stopping_method="generate"
            )
            
            logger.info(f"LangChain agent initialized: {self.agent_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize LangChain agent: {e}")
            raise RuntimeError(f"LangChain agent initialization failed: {e}")
    
    @abstractmethod
    async def _setup_tools(self) -> None:
        """Setup agent-specific tools. Must be implemented by subclasses."""
        pass
    
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:
        """Handle request using LangChain agent."""
        try:
            if not self.agent_executor:
                await self._initialize()
            
            # Create callback handler for observability
            callback_handler = AgentHiveCallbackHandler(context)
            
            # Check if streaming is requested
            if context.stream:
                return self._handle_streaming(context, callback_handler)
            else:
                return await self._handle_non_streaming(context, callback_handler)
                
        except Exception as e:
            logger.error(f"LangChain agent error: {e}")
            return AgentResponse(
                content=f"I apologize, but I encountered an error processing your request: {str(e)}",
                agent_type=self.manifest.agent_type,
                metadata={
                    "error": str(e),
                    "agent_id": self.agent_id
                }
            )
    
    async def _handle_non_streaming(
        self, 
        context: RequestContext, 
        callback_handler: AgentHiveCallbackHandler
    ) -> AgentResponse:
        """Handle non-streaming response."""
        try:
            # Execute agent
            result = await self.agent_executor.ainvoke(
                {"input": context.prompt.prompt},
                callbacks=[callback_handler]
            )
            
            return AgentResponse(
                content=result["output"],
                agent_type=self.manifest.agent_type,
                metadata={
                    "agent_id": self.agent_id,
                    "tokens_used": callback_handler.tokens_used,
                    "execution_time": (datetime.utcnow() - callback_handler.start_time).total_seconds(),
                    "intermediate_steps": len(result.get("intermediate_steps", []))
                }
            )
            
        except Exception as e:
            logger.error(f"Non-streaming execution error: {e}")
            raise
    
    async def _handle_streaming(
        self, 
        context: RequestContext, 
        callback_handler: AgentHiveCallbackHandler
    ) -> AsyncIterator[str]:
        """Handle streaming response."""
        try:
            # For streaming, we'll use the agent executor's stream method
            async for chunk in self.agent_executor.astream(
                {"input": context.prompt.prompt},
                callbacks=[callback_handler]
            ):
                if "output" in chunk:
                    yield chunk["output"]
                elif "intermediate_step" in chunk:
                    # Optionally yield intermediate steps for debugging
                    step = chunk["intermediate_step"]
                    if isinstance(step, tuple) and len(step) == 2:
                        action, observation = step
                        yield f"\n[Tool: {action.tool}] {observation}\n"
                        
        except Exception as e:
            logger.error(f"Streaming execution error: {e}")
            yield f"Error: {str(e)}"
    
    def add_tool(self, tool: BaseTool) -> None:
        """Add a tool to the agent."""
        self.tools.append(tool)
        logger.debug(f"Added tool {tool.name} to agent {self.agent_id}")
    
    def create_tool_from_function(
        self, 
        name: str, 
        description: str, 
        func: callable
    ) -> Tool:
        """Create a LangChain tool from a function."""
        return Tool(
            name=name,
            description=description,
            func=func
        )
    
    async def get_conversation_history(self) -> List[BaseMessage]:
        """Get conversation history from memory."""
        if self.memory:
            return self.memory.chat_memory.messages
        return []
    
    async def clear_memory(self) -> None:
        """Clear conversation memory."""
        if self.memory:
            self.memory.clear()
            logger.debug(f"Cleared memory for agent {self.agent_id}")


class EnhancedHRAgent(LangChainAgentWrapper):
    """
    Enhanced HR Agent using LangChain framework.
    
    This agent demonstrates the integration of LangChain capabilities
    with AgentHive's existing HR agent functionality.
    """
    
    async def _setup_tools(self) -> None:
        """Setup HR-specific tools."""
        # UKG System Tool
        ukg_tool = self.create_tool_from_function(
            name="ukg_lookup",
            description="Look up employee information, vacation balances, and time-off requests in UKG system",
            func=self._ukg_lookup
        )
        self.add_tool(ukg_tool)
        
        # Policy Search Tool
        policy_tool = self.create_tool_from_function(
            name="policy_search",
            description="Search company HR policies and procedures",
            func=self._policy_search
        )
        self.add_tool(policy_tool)
        
        # Benefits Information Tool
        benefits_tool = self.create_tool_from_function(
            name="benefits_info",
            description="Get information about employee benefits, health insurance, and retirement plans",
            func=self._benefits_info
        )
        self.add_tool(benefits_tool)
    
    async def _ukg_lookup(self, query: str) -> str:
        """UKG system lookup functionality."""
        # This would integrate with the existing UKG connector
        try:
            # For now, return mock data - will integrate with real connector
            return f"UKG Lookup Result for '{query}': Employee found, 15 vacation days remaining, last request approved."
        except Exception as e:
            return f"UKG lookup error: {str(e)}"
    
    async def _policy_search(self, query: str) -> str:
        """HR policy search functionality."""
        # This would integrate with the RAG system
        try:
            # Mock policy search - will integrate with LlamaIndex RAG
            return f"Policy Search Result for '{query}': Found relevant policies regarding vacation time, sick leave, and remote work guidelines."
        except Exception as e:
            return f"Policy search error: {str(e)}"
    
    async def _benefits_info(self, query: str) -> str:
        """Benefits information lookup."""
        try:
            # Mock benefits info - will integrate with benefits system
            return f"Benefits Information for '{query}': Health insurance coverage includes medical, dental, and vision. 401k matching up to 6%."
        except Exception as e:
            return f"Benefits lookup error: {str(e)}"


# Factory function for creating LangChain-enhanced agents
async def create_langchain_agent(
    agent_id: str, 
    manifest: AgentManifest
) -> LangChainAgentWrapper:
    """Factory function to create appropriate LangChain agent based on type."""
    
    agent_type = manifest.agent_type.lower()
    
    if agent_type == "hr":
        agent = EnhancedHRAgent(agent_id, manifest)
    else:
        # Default to base wrapper for other agent types
        agent = LangChainAgentWrapper(agent_id, manifest)
    
    await agent.initialize()
    return agent
