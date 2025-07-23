"""
Enhanced Agent Orchestrator with Framework Integration.

This module extends the existing AgentOrchestrator to support LangChain and LlamaIndex
enhanced agents while maintaining backward compatibility with custom agents.
"""

import asyncio
from typing import Dict, Any, Optional, List, Union
from datetime import datetime

from .agent_orchestrator import (
    AgentOrchestrator, Agent, Task, Workflow, TaskStatus, 
    AgentStatus, TaskPriority, AgentCapability
)
from ..domain.enhanced_agent_factory import (
    get_enhanced_agent_factory, EnhancedAgentFactory, AgentFramework
)
from ..domain.langchain_agent_wrapper import LangChainAgentWrapper
from ..domain.enhanced_agent_factory import HybridRAGAgent
from ..domain.agent_factory import BaseAgent, AgentType
from ..domain.schemas import RequestContext, AgentPrompt
from .observability import get_logger, with_tracing

logger = get_logger(__name__)


class EnhancedAgent(Agent):
    """Enhanced Agent with framework support."""
    
    def __init__(self, agent_id: str, name: str, agent_type: str, 
                 capabilities: List[AgentCapability], framework: AgentFramework,
                 agent_instance: BaseAgent):
        super().__init__(agent_id, name, agent_type, capabilities)
        self.framework = framework
        self.agent_instance = agent_instance
        self.framework_features = []
        
        # Add framework-specific features
        if framework in [AgentFramework.LANGCHAIN, AgentFramework.HYBRID]:
            self.framework_features.extend([
                "conversation_memory", "tool_integration", "streaming_responses"
            ])
        
        if framework == AgentFramework.HYBRID:
            self.framework_features.extend([
                "rag_retrieval", "document_search", "query_decomposition"
            ])


class EnhancedAgentOrchestrator(AgentOrchestrator):
    """
    Enhanced orchestrator supporting framework-based agents.
    
    This orchestrator extends the base functionality to:
    - Create and manage framework-enhanced agents
    - Route tasks to appropriate agent frameworks
    - Monitor framework-specific performance metrics
    - Provide seamless migration between frameworks
    """
    
    def __init__(self):
        super().__init__()
        self.enhanced_factory: Optional[EnhancedAgentFactory] = None
        self.framework_agents: Dict[str, EnhancedAgent] = {}
        self.framework_metrics: Dict[str, Dict[str, Any]] = {
            "custom": {"total_requests": 0, "avg_response_time": 0.0, "success_rate": 1.0},
            "langchain": {"total_requests": 0, "avg_response_time": 0.0, "success_rate": 1.0},
            "hybrid": {"total_requests": 0, "avg_response_time": 0.0, "success_rate": 1.0}
        }
        
    async def initialize(self) -> None:
        """Initialize the enhanced orchestrator."""
        try:
            # Initialize base orchestrator
            await super().initialize()
            
            # Initialize enhanced agent factory
            self.enhanced_factory = await get_enhanced_agent_factory()
            
            # Create default enhanced agents
            await self._create_default_enhanced_agents()
            
            logger.info("Enhanced Agent Orchestrator initialized successfully")
            
        except Exception as e:
            logger.error(f"Enhanced orchestrator initialization failed: {e}")
            raise
    
    async def _create_default_enhanced_agents(self) -> None:
        """Create default enhanced agents for common use cases."""
        try:
            # Create enhanced HR agent
            hr_agent = await self.enhanced_factory.create_agent(
                AgentType.HR, 
                agent_id="enhanced_hr_agent",
                framework=AgentFramework.LANGCHAIN
            )
            
            await self.register_enhanced_agent(
                agent_id="enhanced_hr_agent",
                name="Enhanced HR Assistant",
                agent_type="hr",
                capabilities=[
                    AgentCapability(
                        name="hr_support",
                        description="Handle HR inquiries with UKG integration and policy search",
                        performance_score=0.95
                    ),
                    AgentCapability(
                        name="benefits_info",
                        description="Provide benefits information and guidance",
                        performance_score=0.90
                    )
                ],
                framework=AgentFramework.LANGCHAIN,
                agent_instance=hr_agent
            )
            
            # Create hybrid general agent with RAG
            general_agent = await self.enhanced_factory.create_agent(
                AgentType.GENERAL,
                agent_id="hybrid_general_agent", 
                framework=AgentFramework.HYBRID
            )
            
            await self.register_enhanced_agent(
                agent_id="hybrid_general_agent",
                name="Hybrid General Assistant",
                agent_type="general",
                capabilities=[
                    AgentCapability(
                        name="general_assistance",
                        description="General assistance with RAG-enhanced knowledge base",
                        performance_score=0.92
                    ),
                    AgentCapability(
                        name="document_search",
                        description="Search and retrieve information from documents",
                        performance_score=0.88
                    )
                ],
                framework=AgentFramework.HYBRID,
                agent_instance=general_agent
            )
            
            logger.info("Default enhanced agents created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create default enhanced agents: {e}")
    
    async def register_enhanced_agent(
        self,
        agent_id: str,
        name: str,
        agent_type: str,
        capabilities: List[AgentCapability],
        framework: AgentFramework,
        agent_instance: BaseAgent,
        max_concurrent_tasks: int = 5
    ) -> None:
        """Register an enhanced agent with the orchestrator."""
        try:
            # Create enhanced agent wrapper
            enhanced_agent = EnhancedAgent(
                agent_id=agent_id,
                name=name,
                agent_type=agent_type,
                capabilities=capabilities,
                framework=framework,
                agent_instance=agent_instance
            )
            enhanced_agent.max_concurrent_tasks = max_concurrent_tasks
            
            # Register with both systems
            self.framework_agents[agent_id] = enhanced_agent
            self.agents[agent_id] = enhanced_agent
            
            logger.info(f"Registered enhanced agent: {agent_id} ({framework.value})")
            
        except Exception as e:
            logger.error(f"Failed to register enhanced agent: {e}")
            raise
    
    @with_tracing("enhanced_task_execution")
    async def _call_agent_execute(
        self, 
        agent: Agent, 
        execution_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute task using enhanced agent capabilities."""
        try:
            start_time = datetime.utcnow()
            
            # Check if this is an enhanced agent
            if agent.agent_id in self.framework_agents:
                enhanced_agent = self.framework_agents[agent.agent_id]
                result = await self._execute_enhanced_agent(enhanced_agent, execution_context)
                
                # Update framework metrics
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                await self._update_framework_metrics(
                    enhanced_agent.framework, 
                    execution_time, 
                    success=True
                )
                
                return result
            else:
                # Fall back to base orchestrator for custom agents
                return await super()._call_agent_execute(agent, execution_context)
                
        except Exception as e:
            logger.error(f"Enhanced agent execution failed: {e}")
            
            # Update framework metrics for failure
            if agent.agent_id in self.framework_agents:
                enhanced_agent = self.framework_agents[agent.agent_id]
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                await self._update_framework_metrics(
                    enhanced_agent.framework, 
                    execution_time, 
                    success=False
                )
            
            raise
    
    async def _execute_enhanced_agent(
        self, 
        enhanced_agent: EnhancedAgent, 
        execution_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute task using framework-enhanced agent."""
        try:
            # Create request context for the enhanced agent
            request_context = RequestContext(
                request_id=execution_context.get("task_id", "unknown"),
                user_id=execution_context.get("user_id", "system"),
                session_id=execution_context.get("session_id", "orchestrator"),
                prompt=AgentPrompt(
                    prompt=execution_context.get("input_data", {}).get("prompt", ""),
                    context=execution_context.get("context", {})
                ),
                stream=execution_context.get("stream", False),
                metadata=execution_context.get("metadata", {})
            )
            
            # Execute using the enhanced agent
            response = await enhanced_agent.agent_instance.handle(request_context)
            
            # Handle different response types
            if hasattr(response, 'content'):
                # AgentResponse object
                return {
                    "success": True,
                    "result": response.content,
                    "metadata": response.metadata,
                    "agent_type": response.agent_type,
                    "framework": enhanced_agent.framework.value
                }
            else:
                # Direct string response or other format
                return {
                    "success": True,
                    "result": str(response),
                    "framework": enhanced_agent.framework.value
                }
                
        except Exception as e:
            logger.error(f"Enhanced agent execution error: {e}")
            return {
                "success": False,
                "error": str(e),
                "framework": enhanced_agent.framework.value
            }
    
    async def _update_framework_metrics(
        self, 
        framework: AgentFramework, 
        execution_time: float, 
        success: bool
    ) -> None:
        """Update performance metrics for framework."""
        try:
            framework_key = framework.value
            metrics = self.framework_metrics[framework_key]
            
            # Update request count
            metrics["total_requests"] += 1
            
            # Update average response time
            current_avg = metrics["avg_response_time"]
            total_requests = metrics["total_requests"]
            metrics["avg_response_time"] = (
                (current_avg * (total_requests - 1) + execution_time) / total_requests
            )
            
            # Update success rate
            if success:
                current_success_rate = metrics["success_rate"]
                metrics["success_rate"] = (
                    (current_success_rate * (total_requests - 1) + 1.0) / total_requests
                )
            else:
                current_success_rate = metrics["success_rate"]
                metrics["success_rate"] = (
                    (current_success_rate * (total_requests - 1) + 0.0) / total_requests
                )
                
        except Exception as e:
            logger.error(f"Failed to update framework metrics: {e}")
    
    async def create_agent_on_demand(
        self, 
        agent_type: Union[AgentType, str],
        framework: Optional[AgentFramework] = None
    ) -> str:
        """Create a new enhanced agent on demand."""
        try:
            if not self.enhanced_factory:
                raise RuntimeError("Enhanced factory not initialized")
            
            # Generate unique agent ID
            agent_id = f"dynamic_{agent_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            # Create agent using enhanced factory
            agent_instance = await self.enhanced_factory.create_agent(
                agent_type, agent_id, framework
            )
            
            # Get agent capabilities
            capabilities_info = await self.enhanced_factory.get_agent_capabilities(agent_type)
            
            # Create capabilities list
            capabilities = [
                AgentCapability(
                    name=f"{agent_type}_capability",
                    description=f"Dynamic {agent_type} agent capabilities",
                    performance_score=0.85
                )
            ]
            
            # Determine framework
            used_framework = framework or self.enhanced_factory._determine_framework(
                AgentType(agent_type.upper()) if isinstance(agent_type, str) else agent_type
            )
            
            # Register the agent
            await self.register_enhanced_agent(
                agent_id=agent_id,
                name=f"Dynamic {agent_type.title()} Agent",
                agent_type=str(agent_type).lower(),
                capabilities=capabilities,
                framework=used_framework,
                agent_instance=agent_instance
            )
            
            logger.info(f"Created dynamic agent: {agent_id}")
            return agent_id
            
        except Exception as e:
            logger.error(f"Failed to create dynamic agent: {e}")
            raise
    
    async def migrate_agent_framework(
        self, 
        agent_id: str, 
        target_framework: AgentFramework
    ) -> Dict[str, Any]:
        """Migrate an agent to a different framework."""
        try:
            if agent_id not in self.framework_agents:
                return {"error": "Agent not found or not framework-enhanced"}
            
            current_agent = self.framework_agents[agent_id]
            
            if current_agent.framework == target_framework:
                return {"message": "Agent already using target framework"}
            
            # Create new agent instance with target framework
            new_agent_instance = await self.enhanced_factory.create_agent(
                AgentType(current_agent.agent_type.upper()),
                agent_id=f"{agent_id}_migrated",
                framework=target_framework
            )
            
            # Create new enhanced agent
            new_enhanced_agent = EnhancedAgent(
                agent_id=f"{agent_id}_migrated",
                name=f"{current_agent.name} (Migrated)",
                agent_type=current_agent.agent_type,
                capabilities=current_agent.capabilities,
                framework=target_framework,
                agent_instance=new_agent_instance
            )
            
            # Register new agent
            self.framework_agents[f"{agent_id}_migrated"] = new_enhanced_agent
            self.agents[f"{agent_id}_migrated"] = new_enhanced_agent
            
            return {
                "success": True,
                "original_agent": agent_id,
                "migrated_agent": f"{agent_id}_migrated",
                "old_framework": current_agent.framework.value,
                "new_framework": target_framework.value,
                "message": "Migration completed successfully"
            }
            
        except Exception as e:
            logger.error(f"Agent migration failed: {e}")
            return {"error": str(e)}
    
    async def get_enhanced_system_status(self) -> Dict[str, Any]:
        """Get enhanced system status including framework metrics."""
        try:
            base_status = await self.get_system_status()
            
            # Add framework-specific information
            framework_status = {
                "framework_agents": len(self.framework_agents),
                "framework_metrics": self.framework_metrics,
                "agent_frameworks": {
                    agent_id: agent.framework.value 
                    for agent_id, agent in self.framework_agents.items()
                },
                "framework_features": {
                    agent_id: agent.framework_features
                    for agent_id, agent in self.framework_agents.items()
                }
            }
            
            return {
                **base_status,
                "enhanced_features": framework_status
            }
            
        except Exception as e:
            logger.error(f"Failed to get enhanced system status: {e}")
            return {"error": str(e)}
    
    async def get_framework_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive framework performance report."""
        try:
            report = {
                "timestamp": datetime.utcnow().isoformat(),
                "framework_comparison": {},
                "agent_performance": {},
                "recommendations": []
            }
            
            # Framework comparison
            for framework, metrics in self.framework_metrics.items():
                if metrics["total_requests"] > 0:
                    report["framework_comparison"][framework] = {
                        "total_requests": metrics["total_requests"],
                        "avg_response_time": round(metrics["avg_response_time"], 3),
                        "success_rate": round(metrics["success_rate"], 3),
                        "performance_score": round(
                            metrics["success_rate"] / max(metrics["avg_response_time"], 0.1), 3
                        )
                    }
            
            # Agent performance by framework
            for agent_id, agent in self.framework_agents.items():
                if agent_id in self.agents:
                    base_agent = self.agents[agent_id]
                    report["agent_performance"][agent_id] = {
                        "framework": agent.framework.value,
                        "current_load": base_agent.current_load,
                        "health_score": base_agent.health_score,
                        "features": agent.framework_features
                    }
            
            # Generate recommendations
            if report["framework_comparison"]:
                best_framework = max(
                    report["framework_comparison"].items(),
                    key=lambda x: x[1]["performance_score"]
                )[0]
                report["recommendations"].append(
                    f"Consider migrating more agents to {best_framework} framework for optimal performance"
                )
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate performance report: {e}")
            return {"error": str(e)}


# Global enhanced orchestrator instance
_enhanced_orchestrator: Optional[EnhancedAgentOrchestrator] = None


async def get_enhanced_orchestrator() -> EnhancedAgentOrchestrator:
    """Get or create the global enhanced orchestrator."""
    global _enhanced_orchestrator
    
    if _enhanced_orchestrator is None:
        _enhanced_orchestrator = EnhancedAgentOrchestrator()
        await _enhanced_orchestrator.initialize()
    
    return _enhanced_orchestrator


async def submit_enhanced_task(
    name: str,
    required_capabilities: List[str],
    input_data: Dict[str, Any],
    priority: TaskPriority = TaskPriority.NORMAL,
    preferred_framework: Optional[AgentFramework] = None
) -> str:
    """Submit a task with framework preference."""
    orchestrator = await get_enhanced_orchestrator()
    
    # Add framework preference to context
    context = input_data.get("context", {})
    if preferred_framework:
        context["preferred_framework"] = preferred_framework.value
    
    return await orchestrator.submit_task(
        name=name,
        required_capabilities=required_capabilities,
        input_data=input_data,
        priority=priority,
        context=context
    )
