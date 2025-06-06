"""
Abstract Factory pattern implementation for agent creation.

This module provides a registry-based factory for creating and managing agent instances.
"""

from abc import ABC, abstractmethod
from typing import Dict, Type, Optional, Union, AsyncIterator, Any
import importlib
import json
from pathlib import Path
import asyncio

from ..core.observability import get_logger, with_tracing, measure_tokens
from ..core.errors import AgentNotFoundException
from .schemas import RequestContext, AgentResponse, AgentType, AgentManifest, AgentRegistration

logger = get_logger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all agents."""
    
    def __init__(self, agent_id: str, manifest: AgentManifest):
        self.agent_id = agent_id
        self.manifest = manifest
        self.initialized = False
    
    async def initialize(self) -> None:
        """Initialize the agent (load models, connect to services, etc.)."""
        if not self.initialized:
            await self._initialize()
            self.initialized = True
    
    @abstractmethod
    async def _initialize(self) -> None:
        """Agent-specific initialization logic."""
        pass
    
    @abstractmethod
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:
        """
        Handle the request and return a response.
        
        Can return either:
        - AgentResponse for non-streaming responses
        - AsyncIterator[str] for streaming responses
        """
        pass
    
    async def cleanup(self) -> None:
        """Cleanup resources when agent is unloaded."""
        pass
    
    def get_capabilities(self) -> list[str]:
        """Get the agent's capabilities."""
        return self.manifest.capabilities
    
    def get_cost_estimate(self, context: RequestContext) -> float:
        """Estimate the cost for handling this request."""
        # Base implementation uses fixed cost from manifest
        return self.manifest.cost_per_call


class AgentRegistry:
    """Registry for managing agent types and instances."""
    
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        self._agent_classes: Dict[AgentType, Type[BaseAgent]] = {}
        self._registrations: Dict[str, AgentRegistration] = {}
        self._lock = asyncio.Lock()
    
    async def register_agent_class(self, agent_type: AgentType, agent_class: Type[BaseAgent]) -> None:
        """Register an agent class for a specific type."""
        async with self._lock:
            self._agent_classes[agent_type] = agent_class
            logger.info(f"Registered agent class for type: {agent_type.value}")
    
    async def load_plugin(self, plugin_path: Path) -> Optional[str]:
        """Load an agent plugin from a directory."""
        manifest_path = plugin_path / "manifest.json"
        
        if not manifest_path.exists():
            logger.error(f"No manifest.json found in {plugin_path}")
            return None
        
        try:
            # Load manifest
            with open(manifest_path, 'r') as f:
                manifest_data = json.load(f)
            
            manifest = AgentManifest(**manifest_data)
            
            # Import the agent module
            module_path = f"app.plugins.{plugin_path.name}.{manifest.module_path}"
            module = importlib.import_module(module_path)
            
            # Get the agent class (assumes it's named 'Agent')
            agent_class = getattr(module, 'Agent', None)
            if not agent_class:
                logger.error(f"No Agent class found in {module_path}")
                return None
            
            # Register the agent class
            await self.register_agent_class(manifest.agent_type, agent_class)
            
            # Create registration
            agent_id = f"{manifest.agent_type.value}_{manifest.name}"
            registration = AgentRegistration(
                agent_id=agent_id,
                agent_type=manifest.agent_type,
                manifest=manifest,
                enabled=True
            )
            
            async with self._lock:
                self._registrations[agent_id] = registration
            
            logger.info(f"Loaded plugin: {manifest.name} (v{manifest.version})")
            return agent_id
            
        except Exception as e:
            logger.error(f"Failed to load plugin from {plugin_path}: {str(e)}")
            return None
    
    async def create_agent(self, agent_type: AgentType, agent_id: Optional[str] = None) -> BaseAgent:
        """Create an agent instance."""
        # Find registration if agent_id provided
        if agent_id:
            registration = self._registrations.get(agent_id)
            if not registration:
                raise AgentNotFoundException(f"Agent {agent_id} not found")
            agent_type = registration.agent_type
            manifest = registration.manifest
        else:
            # Find any registration for this type
            registrations = [
                r for r in self._registrations.values()
                if r.agent_type == agent_type and r.enabled
            ]
            if not registrations:
                raise AgentNotFoundException(f"No agent found for type {agent_type.value}")
            
            # Use the first enabled registration
            registration = sorted(registrations, key=lambda r: r.load_order)[0]
            agent_id = registration.agent_id
            manifest = registration.manifest
        
        # Check if agent already exists
        async with self._lock:
            if agent_id in self._agents:
                return self._agents[agent_id]
        
        # Get agent class
        agent_class = self._agent_classes.get(agent_type)
        if not agent_class:
            raise AgentNotFoundException(f"No agent class registered for type {agent_type.value}")
        
        # Create instance
        agent = agent_class(agent_id, manifest)
        await agent.initialize()
        
        # Cache the instance
        async with self._lock:
            self._agents[agent_id] = agent
        
        logger.info(f"Created agent instance: {agent_id}")
        return agent
    
    async def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an existing agent instance."""
        return self._agents.get(agent_id)
    
    def list_agents(self) -> list[AgentRegistration]:
        """List all registered agents."""
        return list(self._registrations.values())
    
    async def unload_agent(self, agent_id: str) -> None:
        """Unload an agent instance."""
        async with self._lock:
            agent = self._agents.pop(agent_id, None)
            if agent:
                await agent.cleanup()
                logger.info(f"Unloaded agent: {agent_id}")


class AgentFactory:
    """Factory for creating agents with proper lifecycle management."""
    
    def __init__(self, registry: AgentRegistry):
        self.registry = registry
    
    @with_tracing("agent_factory_create")
    async def create_agent_for_request(
        self,
        agent_type: AgentType,
        context: RequestContext
    ) -> BaseAgent:
        """Create or retrieve an agent for handling a request."""
        # For now, use agent type as the key
        # In future, could implement more sophisticated selection based on context
        
        agent = await self.registry.create_agent(agent_type)
        
        # Log agent selection
        logger.info(
            "Agent created for request",
            agent_id=agent.agent_id,
            agent_type=agent_type.value,
            request_id=context.request_id
        )
        
        return agent
    
    async def estimate_cost(
        self,
        agent_type: AgentType,
        context: RequestContext
    ) -> float:
        """Estimate the cost of using an agent for a request."""
        try:
            agent = await self.registry.create_agent(agent_type)
            return agent.get_cost_estimate(context)
        except AgentNotFoundException:
            # Return a default cost if agent not found
            return 0.01  # $0.01 default


# Example General Agent Implementation
class GeneralAgent(BaseAgent):
    """Default general-purpose agent."""
    
    def __init__(self, agent_id: str, manifest: AgentManifest):
        super().__init__(agent_id, manifest)
        self.llm_adapter = None
    
    async def _initialize(self) -> None:
        """Initialize the general agent."""
        # Import here to avoid circular dependencies
        from ..adapters.llm_openai import OpenAIAdapter
        self.llm_adapter = OpenAIAdapter()
        logger.info("General agent initialized")
    
    @measure_tokens
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:
        """Handle general queries."""
        if not self.llm_adapter:
            raise RuntimeError("Agent not initialized")
        
        # Build conversation history
        messages = [
            {"role": msg.role.value, "content": msg.content}
            for msg in context.prompt.history
        ]
        messages.append({"role": "user", "content": context.prompt.prompt})
        
        if context.prompt.stream:
            # Return streaming response
            return self._stream_response(context, messages)
        else:
            # Return complete response
            response = await self.llm_adapter.complete(
                prompt=context.prompt.prompt,
                messages=messages,
                temperature=context.prompt.temperature,
                max_tokens=context.prompt.max_tokens
            )
            
            return AgentResponse(
                content=response.content,
                agent_id=self.agent_id,
                agent_type=AgentType.GENERAL,
                metadata={"model": response.model},
                usage=response.usage,
                latency_ms=response.metadata.get("latency_ms")
            )
    
    async def _stream_response(self, context: RequestContext, messages: list) -> AsyncIterator[str]:
        """Stream response tokens."""
        async for chunk in self.llm_adapter.stream_complete(
            prompt=context.prompt.prompt,
            messages=messages,
            temperature=context.prompt.temperature,
            max_tokens=context.prompt.max_tokens
        ):
            yield chunk.content


# Global registry instance
agent_registry = AgentRegistry()
agent_factory = AgentFactory(agent_registry)


async def initialize_builtin_agents():
    """Initialize built-in agents."""
    # Register the general agent
    await agent_registry.register_agent_class(AgentType.GENERAL, GeneralAgent)
    
    # Create a manifest for the general agent
    general_manifest = AgentManifest(
        name="general",
        description="General purpose conversational agent",
        version="1.0.0",
        agent_type=AgentType.GENERAL,
        module_path="agent",
        capabilities=["conversation", "q&a", "general_knowledge"],
        cost_per_call=0.01
    )
    
    # Register it
    registration = AgentRegistration(
        agent_id="general_builtin",
        agent_type=AgentType.GENERAL,
        manifest=general_manifest
    )
    
    agent_registry._registrations["general_builtin"] = registration
    
    logger.info("Initialized built-in agents") 