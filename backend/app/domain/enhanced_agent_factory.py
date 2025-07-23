"""
Enhanced Agent Factory with LangChain and LlamaIndex Integration.

This module extends the existing AgentFactory to support both custom agents
and framework-enhanced agents, providing a seamless migration path.
"""

from typing import Dict, Any, Optional, Union
import asyncio
from enum import Enum

from .agent_factory import BaseAgent, AgentFactory, AgentType, AgentManifest
from .langchain_agent_wrapper import LangChainAgentWrapper, EnhancedHRAgent, create_langchain_agent
from .llamaindex_rag_system import get_rag_system, EnterpriseRAGSystem
from ..core.observability import get_logger, with_tracing
from ..core.config import settings

logger = get_logger(__name__)


class AgentFramework(Enum):
    """Supported agent frameworks."""
    CUSTOM = "custom"
    LANGCHAIN = "langchain"
    HYBRID = "hybrid"


class EnhancedAgentFactory(AgentFactory):
    """
    Enhanced Agent Factory supporting multiple frameworks.
    
    This factory extends the base AgentFactory to support:
    - Original custom agents (backward compatibility)
    - LangChain-enhanced agents
    - Hybrid agents with RAG capabilities
    """
    
    def __init__(self):
        super().__init__()
        self.rag_system: Optional[EnterpriseRAGSystem] = None
        self.framework_preference: Dict[str, AgentFramework] = {
            # Define which agents should use which frameworks
            "hr": AgentFramework.LANGCHAIN,
            "support": AgentFramework.LANGCHAIN,
            "general": AgentFramework.HYBRID,
            "code": AgentFramework.LANGCHAIN,
            "data": AgentFramework.HYBRID,
        }
        
    async def initialize(self) -> None:
        """Initialize the enhanced factory with framework support."""
        try:
            # Initialize base factory
            await super().initialize()
            
            # Initialize RAG system
            self.rag_system = await get_rag_system()
            
            logger.info("Enhanced Agent Factory initialized with framework support")
            
        except Exception as e:
            logger.error(f"Enhanced factory initialization failed: {e}")
            raise
    
    @with_tracing("create_enhanced_agent")
    async def create_agent(
        self, 
        agent_type: Union[AgentType, str], 
        agent_id: Optional[str] = None,
        framework: Optional[AgentFramework] = None
    ) -> BaseAgent:
        """
        Create an agent with framework enhancement.
        
        Args:
            agent_type: Type of agent to create
            agent_id: Optional specific agent ID
            framework: Optional framework preference override
            
        Returns:
            Enhanced agent instance
        """
        try:
            # Convert string to AgentType if needed
            if isinstance(agent_type, str):
                try:
                    agent_type = AgentType(agent_type.upper())
                except ValueError:
                    logger.warning(f"Unknown agent type: {agent_type}, using GENERAL")
                    agent_type = AgentType.GENERAL
            
            # Get agent manifest
            manifest = await self._get_agent_manifest(agent_type, agent_id)
            
            # Determine framework to use
            framework_to_use = framework or self._determine_framework(agent_type)
            
            # Create agent based on framework
            if framework_to_use == AgentFramework.LANGCHAIN:
                return await self._create_langchain_agent(agent_type, manifest, agent_id)
            elif framework_to_use == AgentFramework.HYBRID:
                return await self._create_hybrid_agent(agent_type, manifest, agent_id)
            else:
                # Fall back to custom agent
                return await self._create_custom_agent(agent_type, manifest, agent_id)
                
        except Exception as e:
            logger.error(f"Enhanced agent creation failed: {e}")
            # Fallback to base factory
            return await super().create_agent(agent_type, agent_id)
    
    def _determine_framework(self, agent_type: AgentType) -> AgentFramework:
        """Determine which framework to use for an agent type."""
        agent_type_str = agent_type.value.lower()
        return self.framework_preference.get(agent_type_str, AgentFramework.CUSTOM)
    
    async def _create_langchain_agent(
        self, 
        agent_type: AgentType, 
        manifest: AgentManifest, 
        agent_id: Optional[str]
    ) -> LangChainAgentWrapper:
        """Create a LangChain-enhanced agent."""
        try:
            # Use the factory function from langchain_agent_wrapper
            agent = await create_langchain_agent(
                agent_id or f"{agent_type.value.lower()}_agent",
                manifest
            )
            
            logger.info(f"Created LangChain agent: {agent_type.value}")
            return agent
            
        except Exception as e:
            logger.error(f"LangChain agent creation failed: {e}")
            raise
    
    async def _create_hybrid_agent(
        self, 
        agent_type: AgentType, 
        manifest: AgentManifest, 
        agent_id: Optional[str]
    ) -> 'HybridRAGAgent':
        """Create a hybrid agent with RAG capabilities."""
        try:
            # Create LangChain agent first
            langchain_agent = await self._create_langchain_agent(agent_type, manifest, agent_id)
            
            # Wrap with RAG capabilities
            hybrid_agent = HybridRAGAgent(langchain_agent, self.rag_system)
            await hybrid_agent.initialize()
            
            logger.info(f"Created hybrid RAG agent: {agent_type.value}")
            return hybrid_agent
            
        except Exception as e:
            logger.error(f"Hybrid agent creation failed: {e}")
            raise
    
    async def _create_custom_agent(
        self, 
        agent_type: AgentType, 
        manifest: AgentManifest, 
        agent_id: Optional[str]
    ) -> BaseAgent:
        """Create a custom agent using the original factory."""
        return await super().create_agent(agent_type, agent_id)
    
    async def _get_agent_manifest(
        self, 
        agent_type: AgentType, 
        agent_id: Optional[str]
    ) -> AgentManifest:
        """Get agent manifest with framework enhancements."""
        # Get base manifest
        manifest = await super()._load_agent_manifest(agent_type, agent_id)
        
        # Add framework-specific configurations
        framework = self._determine_framework(agent_type)
        
        if framework in [AgentFramework.LANGCHAIN, AgentFramework.HYBRID]:
            # Add LangChain-specific config
            manifest.config.update({
                "framework": framework.value,
                "memory_window": 10,
                "max_iterations": 5,
                "streaming": True,
                "tools_enabled": True
            })
            
        if framework == AgentFramework.HYBRID:
            # Add RAG-specific config
            manifest.config.update({
                "rag_enabled": True,
                "rag_top_k": 5,
                "rag_similarity_threshold": 0.7,
                "query_decomposition": True
            })
        
        return manifest
    
    async def get_agent_capabilities(self, agent_type: Union[AgentType, str]) -> Dict[str, Any]:
        """Get enhanced capabilities for an agent type."""
        try:
            # Convert string to AgentType if needed
            if isinstance(agent_type, str):
                agent_type = AgentType(agent_type.upper())
            
            framework = self._determine_framework(agent_type)
            base_capabilities = await super().get_agent_capabilities(agent_type)
            
            # Add framework-specific capabilities
            enhanced_capabilities = {
                **base_capabilities,
                "framework": framework.value,
                "enhanced_features": []
            }
            
            if framework in [AgentFramework.LANGCHAIN, AgentFramework.HYBRID]:
                enhanced_capabilities["enhanced_features"].extend([
                    "conversation_memory",
                    "tool_integration",
                    "streaming_responses",
                    "chain_of_thought",
                    "error_recovery"
                ])
            
            if framework == AgentFramework.HYBRID:
                enhanced_capabilities["enhanced_features"].extend([
                    "rag_retrieval",
                    "document_search",
                    "query_decomposition",
                    "context_synthesis",
                    "knowledge_base_access"
                ])
            
            return enhanced_capabilities
            
        except Exception as e:
            logger.error(f"Failed to get agent capabilities: {e}")
            return {"error": str(e)}
    
    async def migrate_agent_to_framework(
        self, 
        agent_id: str, 
        target_framework: AgentFramework
    ) -> Dict[str, Any]:
        """Migrate an existing agent to a different framework."""
        try:
            # This would implement agent migration logic
            # For now, return migration plan
            return {
                "agent_id": agent_id,
                "current_framework": "custom",
                "target_framework": target_framework.value,
                "migration_steps": [
                    "Backup current agent configuration",
                    "Create new framework-enhanced agent",
                    "Migrate conversation history",
                    "Update routing configuration",
                    "Validate functionality",
                    "Switch traffic to new agent"
                ],
                "estimated_downtime": "< 5 minutes",
                "rollback_available": True
            }
            
        except Exception as e:
            logger.error(f"Agent migration planning failed: {e}")
            return {"error": str(e)}


class HybridRAGAgent(BaseAgent):
    """
    Hybrid agent that combines LangChain capabilities with RAG.
    
    This agent wraps a LangChain agent and adds RAG capabilities
    for enhanced knowledge retrieval and context awareness.
    """
    
    def __init__(self, langchain_agent: LangChainAgentWrapper, rag_system: EnterpriseRAGSystem):
        super().__init__(langchain_agent.agent_id, langchain_agent.manifest)
        self.langchain_agent = langchain_agent
        self.rag_system = rag_system
        
        # RAG configuration
        self.rag_enabled = True
        self.rag_top_k = 5
        self.similarity_threshold = 0.7
        self.use_query_decomposition = True
    
    async def initialize(self) -> None:
        """Initialize the hybrid agent."""
        await self.langchain_agent.initialize()
        logger.info(f"Hybrid RAG agent initialized: {self.agent_id}")
    
    async def handle(self, context) -> Union[Any, AsyncIterator[str]]:
        """Handle request with RAG-enhanced context."""
        try:
            # First, get relevant context from RAG system
            if self.rag_enabled:
                rag_context = await self._get_rag_context(context.prompt.prompt)
                
                # Enhance the prompt with RAG context
                enhanced_prompt = self._enhance_prompt_with_context(
                    context.prompt.prompt, 
                    rag_context
                )
                
                # Update context with enhanced prompt
                context.prompt.prompt = enhanced_prompt
            
            # Use LangChain agent to handle the enhanced request
            return await self.langchain_agent.handle(context)
            
        except Exception as e:
            logger.error(f"Hybrid agent error: {e}")
            # Fallback to LangChain agent without RAG
            return await self.langchain_agent.handle(context)
    
    async def _get_rag_context(self, query: str) -> Dict[str, Any]:
        """Get relevant context from RAG system."""
        try:
            if self.use_query_decomposition and len(query.split()) > 10:
                # Use query decomposition for complex queries
                return await self.rag_system.query_with_decomposition(query)
            else:
                # Use regular query for simple queries
                return await self.rag_system.query(query, top_k=self.rag_top_k)
                
        except Exception as e:
            logger.error(f"RAG context retrieval failed: {e}")
            return {"response": "", "source_nodes": []}
    
    def _enhance_prompt_with_context(self, original_prompt: str, rag_context: Dict[str, Any]) -> str:
        """Enhance the original prompt with RAG context."""
        try:
            if not rag_context.get("source_nodes"):
                return original_prompt
            
            # Build context from source nodes
            context_parts = []
            for node in rag_context["source_nodes"][:3]:  # Use top 3 sources
                context_parts.append(f"- {node['content'][:200]}...")
            
            context_text = "\n".join(context_parts)
            
            enhanced_prompt = f"""Based on the following relevant information:

{context_text}

Please answer this question: {original_prompt}

Use the provided context when relevant, but also use your general knowledge. If the context doesn't contain relevant information, please say so."""

            return enhanced_prompt
            
        except Exception as e:
            logger.error(f"Prompt enhancement failed: {e}")
            return original_prompt


# Global enhanced factory instance
_enhanced_factory: Optional[EnhancedAgentFactory] = None


async def get_enhanced_agent_factory() -> EnhancedAgentFactory:
    """Get or create the global enhanced agent factory."""
    global _enhanced_factory
    
    if _enhanced_factory is None:
        _enhanced_factory = EnhancedAgentFactory()
        await _enhanced_factory.initialize()
    
    return _enhanced_factory


async def create_enhanced_agent(
    agent_type: Union[AgentType, str], 
    agent_id: Optional[str] = None,
    framework: Optional[AgentFramework] = None
) -> BaseAgent:
    """Convenience function for creating enhanced agents."""
    factory = await get_enhanced_agent_factory()
    return await factory.create_agent(agent_type, agent_id, framework)
