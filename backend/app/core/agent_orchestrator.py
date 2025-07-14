"""
Multi-Agent Orchestration System

This module implements advanced multi-agent collaboration capabilities including:
- Agent workflow orchestration
- Task delegation and coordination
- Context sharing between agents
- Performance monitoring and optimization
- Dynamic agent selection and load balancing
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Callable, Union
from uuid import uuid4

from .observability import get_logger, with_tracing
from .redis_cluster import get_redis_cluster

logger = get_logger(__name__)


class TaskStatus(Enum):
    """Task execution status."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentStatus(Enum):
    """Agent availability status."""
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    ERROR = "error"


class TaskPriority(Enum):
    """Task priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class AgentCapability:
    """Agent capability definition."""
    name: str
    description: str
    required_resources: Dict[str, Any] = field(default_factory=dict)
    performance_score: float = 1.0
    cost_per_execution: float = 0.0


@dataclass
class Task:
    """Task definition for agent execution."""
    task_id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    description: str = ""
    priority: TaskPriority = TaskPriority.NORMAL
    required_capabilities: List[str] = field(default_factory=list)
    input_data: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    timeout: float = 300.0  # 5 minutes default
    retry_count: int = 0
    max_retries: int = 3
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None


@dataclass
class Agent:
    """Agent definition and state."""
    agent_id: str
    name: str
    agent_type: str
    capabilities: List[AgentCapability] = field(default_factory=list)
    status: AgentStatus = AgentStatus.AVAILABLE
    current_load: int = 0
    max_concurrent_tasks: int = 5
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    last_activity: float = field(default_factory=time.time)
    health_score: float = 1.0
    execution_context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WorkflowStep:
    """Workflow step definition (extended for DAG/conditional logic)."""
    step_id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    required_capability: str = ""
    input_mapping: Dict[str, str] = field(default_factory=dict)
    output_mapping: Dict[str, str] = field(default_factory=dict)
    condition: Optional[str] = None  # Python expression or callable as string
    parallel: bool = False
    retry_policy: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)  # List of step_ids this step depends on
    agent_selector: Optional[str] = None  # Name of agent selection strategy or callable


@dataclass
class Workflow:
    """Multi-agent workflow definition (extended for DAG/conditional logic)."""
    workflow_id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    description: str = ""
    steps: List[WorkflowStep] = field(default_factory=list)
    shared_context: Dict[str, Any] = field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    current_step: int = 0
    execution_log: List[Dict[str, Any]] = field(default_factory=list)
    # New: quick lookup for steps by id
    step_lookup: Dict[str, WorkflowStep] = field(default_factory=dict)
    # New: track completed step ids
    completed_steps: List[str] = field(default_factory=list)


class AgentOrchestrator:
    """Multi-agent orchestration system."""
    
    def __init__(self):
        """Initialize the orchestrator."""
        self.agents: Dict[str, Agent] = {}
        self.tasks: Dict[str, Task] = {}
        self.workflows: Dict[str, Workflow] = {}
        self.task_queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.agent_selectors: Dict[str, Callable] = {}
        self.performance_monitor_task: Optional[asyncio.Task] = None
        self.task_processor_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
        self._initialized = False
        
        # Register default agent selectors
        self._register_default_selectors()
    
    def _register_default_selectors(self):
        """Register default agent selection strategies."""
        self.agent_selectors = {
            'round_robin': self._round_robin_selector,
            'least_loaded': self._least_loaded_selector,
            'performance_based': self._performance_based_selector,
            'capability_match': self._capability_match_selector
        }
    
    async def initialize(self):
        """Initialize the orchestrator."""
        if self._initialized:
            return
        
        async with self._lock:
            if self._initialized:
                return
            
            # Start background tasks
            self.performance_monitor_task = asyncio.create_task(
                self._performance_monitor_loop()
            )
            self.task_processor_task = asyncio.create_task(
                self._task_processor_loop()
            )
            
            self._initialized = True
            logger.info("Agent orchestrator initialized")
    
    async def register_agent(
        self,
        agent_id: str,
        name: str,
        agent_type: str,
        capabilities: List[AgentCapability],
        max_concurrent_tasks: int = 5
    ) -> Agent:
        """Register a new agent with the orchestrator."""
        agent = Agent(
            agent_id=agent_id,
            name=name,
            agent_type=agent_type,
            capabilities=capabilities,
            max_concurrent_tasks=max_concurrent_tasks
        )
        
        self.agents[agent_id] = agent
        
        # Store agent info in Redis for persistence
        redis_client = await get_redis_cluster()
        await redis_client.set(
            f"agent:{agent_id}",
            json.dumps({
                'name': name,
                'type': agent_type,
                'capabilities': [
                    {
                        'name': cap.name,
                        'description': cap.description,
                        'performance_score': cap.performance_score
                    }
                    for cap in capabilities
                ],
                'max_concurrent_tasks': max_concurrent_tasks,
                'registered_at': time.time()
            })
        )
        
        logger.info(f"Registered agent {name} ({agent_id}) with {len(capabilities)} capabilities")
        return agent
    
    async def unregister_agent(self, agent_id: str):
        """Unregister an agent from the orchestrator."""
        if agent_id in self.agents:
            agent = self.agents[agent_id]
            agent.status = AgentStatus.OFFLINE
            
            # Cancel any running tasks
            await self._cancel_agent_tasks(agent_id)
            
            # Remove from registry
            del self.agents[agent_id]
            
            # Remove from Redis
            redis_client = await get_redis_cluster()
            await redis_client.set(f"agent:{agent_id}", "")
            
            logger.info(f"Unregistered agent {agent.name} ({agent_id})")
    
    async def submit_task(
        self,
        name: str,
        required_capabilities: List[str],
        input_data: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        timeout: float = 300.0,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Submit a task for execution."""
        task = Task(
            name=name,
            required_capabilities=required_capabilities,
            input_data=input_data,
            priority=priority,
            timeout=timeout,
            context=context or {}
        )
        
        self.tasks[task.task_id] = task
        
        # Add to priority queue (negative priority for max heap behavior)
        await self.task_queue.put((-priority.value, time.time(), task.task_id))
        
        logger.info(f"Submitted task {name} ({task.task_id}) with priority {priority.value}")
        return task.task_id
    
    async def submit_workflow(
        self,
        workflow: Workflow,
        priority: TaskPriority = TaskPriority.NORMAL
    ) -> str:
        """Submit a multi-step workflow for execution (DAG/conditional support)."""
        self.workflows[workflow.workflow_id] = workflow
        # Build step lookup for fast access
        workflow.step_lookup = {step.step_id: step for step in workflow.steps}
        workflow.completed_steps = []
        # Find all root steps (no dependencies)
        ready_steps = [step for step in workflow.steps if not step.dependencies]
        for step in ready_steps:
            await self._submit_workflow_step(workflow, step, priority)
        logger.info(f"Submitted workflow {workflow.name} ({workflow.workflow_id}) [DAG mode]")
        return workflow.workflow_id

    async def _submit_workflow_step(self, workflow: Workflow, step: WorkflowStep, priority: TaskPriority):
        """Submit a single workflow step as a task, with condition and agent selection support."""
        # Evaluate condition if present (TODO: secure eval or use a callable registry)
        if step.condition:
            # Example: condition = 'shared_context["foo"] == "bar"'
            try:
                if not eval(step.condition, {}, {"shared_context": workflow.shared_context}):
                    logger.info(f"Step {step.name} ({step.step_id}) condition not met, skipping.")
                    return
            except Exception as e:
                logger.error(f"Error evaluating condition for step {step.name}: {e}")
                return
        # TODO: Use agent_selector if present
        task_id = await self.submit_task(
            name=f"{workflow.name}:{step.name}",
            required_capabilities=[step.required_capability],
            input_data=self._prepare_step_input(workflow, step),
            priority=priority,
            context={
                'workflow_id': workflow.workflow_id,
                'step_id': step.step_id,
                'is_workflow_step': True
            }
        )
        workflow.execution_log.append({
            'step_id': step.step_id,
            'task_id': task_id,
            'started_at': time.time(),
            'status': 'submitted'
        })

    def _prepare_step_input(self, workflow: Workflow, step: WorkflowStep) -> Dict[str, Any]:
        """Prepare input data for a workflow step."""
        input_data = {}
        
        # Apply input mapping from shared context
        for output_key, input_key in step.input_mapping.items():
            if input_key in workflow.shared_context:
                input_data[output_key] = workflow.shared_context[input_key]
        
        return input_data
    
    async def _task_processor_loop(self):
        """Main task processing loop."""
        while True:
            try:
                # Get next task from queue
                _, _, task_id = await self.task_queue.get()
                
                if task_id not in self.tasks:
                    continue
                
                task = self.tasks[task_id]
                
                # Check if task is still valid
                if task.status != TaskStatus.PENDING:
                    continue
                
                # Find suitable agent
                agent = await self._select_agent(task)
                if not agent:
                    # Re-queue task for later
                    await asyncio.sleep(1)
                    await self.task_queue.put((-task.priority.value, time.time(), task_id))
                    continue
                
                # Assign and execute task
                await self._execute_task(task, agent)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in task processor loop: {e}")
                await asyncio.sleep(1)
    
    async def _select_agent(self, task: Task) -> Optional[Agent]:
        """Select the best agent for a task."""
        # Filter agents by capabilities
        capable_agents = []
        for agent in self.agents.values():
            if (agent.status == AgentStatus.AVAILABLE and
                agent.current_load < agent.max_concurrent_tasks and
                self._agent_has_capabilities(agent, task.required_capabilities)):
                capable_agents.append(agent)
        
        if not capable_agents:
            return None
        
        # Use performance-based selection as default
        return self._performance_based_selector(capable_agents, task)
    
    def _agent_has_capabilities(self, agent: Agent, required_capabilities: List[str]) -> bool:
        """Check if agent has required capabilities."""
        agent_capabilities = {cap.name for cap in agent.capabilities}
        return all(cap in agent_capabilities for cap in required_capabilities)
    
    def _round_robin_selector(self, agents: List[Agent], task: Task) -> Agent:
        """Round-robin agent selection."""
        return min(agents, key=lambda a: a.last_activity)
    
    def _least_loaded_selector(self, agents: List[Agent], task: Task) -> Agent:
        """Select agent with least current load."""
        return min(agents, key=lambda a: a.current_load)
    
    def _performance_based_selector(self, agents: List[Agent], task: Task) -> Agent:
        """Select agent based on performance score."""
        def score_agent(agent: Agent) -> float:
            # Calculate composite score
            load_factor = 1.0 - (agent.current_load / agent.max_concurrent_tasks)
            health_factor = agent.health_score
            performance_factor = agent.performance_metrics.get('avg_execution_time', 1.0)
            
            # Weight factors (can be tuned)
            return (load_factor * 0.4 + health_factor * 0.3 + 
                   (1.0 / performance_factor) * 0.3)
        
        return max(agents, key=score_agent)
    
    def _capability_match_selector(self, agents: List[Agent], task: Task) -> Agent:
        """Select agent with best capability match."""
        def capability_score(agent: Agent) -> float:
            matching_caps = [
                cap for cap in agent.capabilities
                if cap.name in task.required_capabilities
            ]
            return sum(cap.performance_score for cap in matching_caps)
        
        return max(agents, key=capability_score)
    
    @with_tracing("execute_task")
    async def _execute_task(self, task: Task, agent: Agent):
        """Execute a task on the selected agent."""
        try:
            # Update task and agent status
            task.status = TaskStatus.ASSIGNED
            task.assigned_agent = agent.agent_id
            task.started_at = time.time()
            
            agent.current_load += 1
            if agent.current_load >= agent.max_concurrent_tasks:
                agent.status = AgentStatus.BUSY
            
            logger.info(f"Executing task {task.name} on agent {agent.name}")
            
            # Create execution context
            execution_context = {
                'task_id': task.task_id,
                'agent_id': agent.agent_id,
                'input_data': task.input_data,
                'context': task.context,
                'timeout': task.timeout
            }
            
            # Execute task (this would interface with actual agent implementation)
            result = await self._call_agent_execute(agent, execution_context)
            
            # Update task with result
            task.status = TaskStatus.COMPLETED
            task.result = result
            task.completed_at = time.time()
            
            # Update agent metrics
            execution_time = task.completed_at - task.started_at
            self._update_agent_performance(agent, execution_time, success=True)
            
            # Handle workflow completion
            if task.context.get('is_workflow_step'):
                await self._handle_workflow_step_completion(task)
            
            logger.info(f"Task {task.name} completed successfully in {execution_time:.2f}s")
            
        except asyncio.TimeoutError:
            task.status = TaskStatus.FAILED
            task.error = "Task timeout"
            self._update_agent_performance(agent, task.timeout, success=False)
            logger.error(f"Task {task.name} timed out")
            
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            self._update_agent_performance(agent, 0, success=False)
            logger.error(f"Task {task.name} failed: {e}")
            
        finally:
            # Update agent load
            agent.current_load -= 1
            agent.last_activity = time.time()
            if agent.current_load < agent.max_concurrent_tasks:
                agent.status = AgentStatus.AVAILABLE
    
    async def _call_agent_execute(
        self,
        agent: Agent,
        execution_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Call agent's execute method (placeholder for actual implementation)."""
        # This would interface with the actual agent execution system
        # For now, simulate execution
        await asyncio.sleep(0.1)  # Simulate work
        
        return {
            'status': 'success',
            'output': f"Task executed by {agent.name}",
            'execution_time': 0.1,
            'metadata': {
                'agent_type': agent.agent_type,
                'capabilities_used': execution_context.get('context', {}).get('required_capabilities', [])
            }
        }
    
    def _update_agent_performance(self, agent: Agent, execution_time: float, success: bool):
        """Update agent performance metrics."""
        if 'total_executions' not in agent.performance_metrics:
            agent.performance_metrics['total_executions'] = 0
            agent.performance_metrics['successful_executions'] = 0
            agent.performance_metrics['avg_execution_time'] = 0
        
        agent.performance_metrics['total_executions'] += 1
        if success:
            agent.performance_metrics['successful_executions'] += 1
        
        # Update average execution time (exponential moving average)
        current_avg = agent.performance_metrics['avg_execution_time']
        agent.performance_metrics['avg_execution_time'] = (
            current_avg * 0.9 + execution_time * 0.1
        )
        
        # Update success rate
        agent.performance_metrics['success_rate'] = (
            agent.performance_metrics['successful_executions'] / 
            agent.performance_metrics['total_executions']
        )
        
        # Update health score based on recent performance
        agent.health_score = min(1.0, agent.performance_metrics['success_rate'] * 1.1)
    
    async def _handle_workflow_step_completion(self, task: Task):
        """Handle completion of a workflow step (DAG/conditional support)."""
        workflow_id = task.context['workflow_id']
        step_id = task.context['step_id']
        if workflow_id not in self.workflows:
            return
        workflow = self.workflows[workflow_id]
        # Update execution log
        for log_entry in workflow.execution_log:
            if log_entry['step_id'] == step_id:
                log_entry['completed_at'] = time.time()
                log_entry['status'] = 'completed' if task.status == TaskStatus.COMPLETED else 'failed'
                log_entry['result'] = task.result
                break
        # Update shared context with step output
        if task.result and task.status == TaskStatus.COMPLETED:
            step = workflow.step_lookup.get(step_id)
            if step and step.output_mapping:
                for output_key, context_key in step.output_mapping.items():
                    if output_key in task.result:
                        workflow.shared_context[context_key] = task.result[output_key]
        # Mark step as completed
        workflow.completed_steps.append(step_id)
        # Find next steps whose dependencies are all completed
        for next_step in workflow.steps:
            if next_step.step_id in workflow.completed_steps:
                continue
            if all(dep in workflow.completed_steps for dep in next_step.dependencies):
                await self._submit_workflow_step(workflow, next_step, TaskPriority.NORMAL)  # TODO: propagate priority
        # Check if workflow is complete
        await self._check_workflow_completion(workflow)

    async def _check_workflow_completion(self, workflow: Workflow):
        """Check if workflow is complete (DAG/conditional support)."""
        # Workflow is complete if all steps are completed or skipped (TODO: handle skipped steps)
        if len(workflow.completed_steps) == len(workflow.steps):
            workflow.status = TaskStatus.COMPLETED
            logger.info(f"Workflow {workflow.name} completed [DAG mode]")
        elif any(log.get('status') == 'failed' for log in workflow.execution_log):
            workflow.status = TaskStatus.FAILED
            logger.error(f"Workflow {workflow.name} failed [DAG mode]")
    
    async def _performance_monitor_loop(self):
        """Monitor agent performance and health."""
        while True:
            try:
                await asyncio.sleep(60)  # Monitor every minute
                
                # Update agent health scores
                for agent in self.agents.values():
                    # Check if agent is responsive
                    if time.time() - agent.last_activity > 300:  # 5 minutes
                        agent.health_score *= 0.9  # Decay health score
                        if agent.health_score < 0.5:
                            agent.status = AgentStatus.ERROR
                
                # Log performance metrics
                self._log_performance_metrics()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in performance monitor loop: {e}")
    
    def _log_performance_metrics(self):
        """Log current performance metrics."""
        total_agents = len(self.agents)
        active_agents = len([a for a in self.agents.values() if a.status == AgentStatus.AVAILABLE])
        total_tasks = len(self.tasks)
        completed_tasks = len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED])
        
        logger.info(
            f"Performance metrics - Agents: {active_agents}/{total_agents}, "
            f"Tasks: {completed_tasks}/{total_tasks}"
        )
    
    async def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed status of an agent."""
        if agent_id not in self.agents:
            return None
        
        agent = self.agents[agent_id]
        return {
            'agent_id': agent.agent_id,
            'name': agent.name,
            'type': agent.agent_type,
            'status': agent.status.value,
            'current_load': agent.current_load,
            'max_concurrent_tasks': agent.max_concurrent_tasks,
            'health_score': agent.health_score,
            'performance_metrics': agent.performance_metrics,
            'capabilities': [
                {
                    'name': cap.name,
                    'description': cap.description,
                    'performance_score': cap.performance_score
                }
                for cap in agent.capabilities
            ]
        }
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed status of a task."""
        if task_id not in self.tasks:
            return None
        
        task = self.tasks[task_id]
        return {
            'task_id': task.task_id,
            'name': task.name,
            'status': task.status.value,
            'priority': task.priority.value,
            'assigned_agent': task.assigned_agent,
            'created_at': task.created_at,
            'started_at': task.started_at,
            'completed_at': task.completed_at,
            'execution_time': (
                task.completed_at - task.started_at 
                if task.started_at and task.completed_at else None
            ),
            'result': task.result,
            'error': task.error
        }
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status."""
        return {
            'agents': {
                'total': len(self.agents),
                'available': len([a for a in self.agents.values() if a.status == AgentStatus.AVAILABLE]),
                'busy': len([a for a in self.agents.values() if a.status == AgentStatus.BUSY]),
                'offline': len([a for a in self.agents.values() if a.status == AgentStatus.OFFLINE]),
                'error': len([a for a in self.agents.values() if a.status == AgentStatus.ERROR])
            },
            'tasks': {
                'total': len(self.tasks),
                'pending': len([t for t in self.tasks.values() if t.status == TaskStatus.PENDING]),
                'running': len([t for t in self.tasks.values() if t.status == TaskStatus.RUNNING]),
                'completed': len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED]),
                'failed': len([t for t in self.tasks.values() if t.status == TaskStatus.FAILED])
            },
            'workflows': {
                'total': len(self.workflows),
                'running': len([w for w in self.workflows.values() if w.status == TaskStatus.RUNNING]),
                'completed': len([w for w in self.workflows.values() if w.status == TaskStatus.COMPLETED])
            },
            'queue_size': self.task_queue.qsize()
        }
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a task."""
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            return False
        
        task.status = TaskStatus.CANCELLED
        
        # If task is assigned, reduce agent load
        if task.assigned_agent and task.assigned_agent in self.agents:
            agent = self.agents[task.assigned_agent]
            agent.current_load = max(0, agent.current_load - 1)
            if agent.current_load < agent.max_concurrent_tasks:
                agent.status = AgentStatus.AVAILABLE
        
        logger.info(f"Cancelled task {task.name} ({task_id})")
        return True
    
    async def _cancel_agent_tasks(self, agent_id: str):
        """Cancel all tasks assigned to an agent."""
        for task in self.tasks.values():
            if task.assigned_agent == agent_id and task.status in [TaskStatus.ASSIGNED, TaskStatus.RUNNING]:
                await self.cancel_task(task.task_id)
    
    async def close(self):
        """Close the orchestrator and cleanup."""
        if self.performance_monitor_task:
            self.performance_monitor_task.cancel()
            try:
                await self.performance_monitor_task
            except asyncio.CancelledError:
                pass
        
        if self.task_processor_task:
            self.task_processor_task.cancel()
            try:
                await self.task_processor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Agent orchestrator closed")


# Global orchestrator instance
orchestrator = AgentOrchestrator()


async def get_orchestrator() -> AgentOrchestrator:
    """Get the global agent orchestrator."""
    if not orchestrator._initialized:
        await orchestrator.initialize()
    return orchestrator
