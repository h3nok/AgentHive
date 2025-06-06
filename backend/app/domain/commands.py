"""
Command pattern and Saga helpers for complex operations.

This module provides command execution and saga orchestration capabilities.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import uuid
from enum import Enum

from ..core.observability import get_logger, with_tracing
from .schemas import Command, CommandResult

logger = get_logger(__name__)


class CommandStatus(str, Enum):
    """Command execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"


@dataclass
class SagaStep:
    """Single step in a saga."""
    name: str
    command: Command
    compensate_command: Optional[Command] = None
    retry_count: int = 3
    timeout: float = 30.0


@dataclass
class SagaContext:
    """Context for saga execution."""
    saga_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    steps: List[SagaStep] = field(default_factory=list)
    completed_steps: List[str] = field(default_factory=list)
    failed_step: Optional[str] = None
    status: CommandStatus = CommandStatus.PENDING
    results: Dict[str, CommandResult] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class CommandHandler(ABC):
    """Abstract base class for command handlers."""
    
    @abstractmethod
    async def execute(self, command: Command) -> CommandResult:
        """Execute the command."""
        pass
    
    @abstractmethod
    def can_handle(self, command: Command) -> bool:
        """Check if this handler can handle the command."""
        pass


class CommandExecutor:
    """Executor for running commands."""
    
    def __init__(self):
        self.handlers: List[CommandHandler] = []
        self._running_commands: Dict[str, asyncio.Task] = {}
    
    def register_handler(self, handler: CommandHandler) -> None:
        """Register a command handler."""
        self.handlers.append(handler)
        logger.info(f"Registered command handler: {handler.__class__.__name__}")
    
    @with_tracing("command_execute")
    async def execute(self, command: Command) -> CommandResult:
        """Execute a command."""
        start_time = datetime.utcnow()
        
        # Find appropriate handler
        handler = None
        for h in self.handlers:
            if h.can_handle(command):
                handler = h
                break
        
        if not handler:
            return CommandResult(
                command_id=command.command_id,
                success=False,
                error="No handler found for command type: " + command.command_type,
                execution_time_ms=0
            )
        
        try:
            # Execute command
            logger.info(f"Executing command: {command.command_type} ({command.command_id})")
            
            # Store running task
            task = asyncio.create_task(handler.execute(command))
            self._running_commands[command.command_id] = task
            
            result = await task
            
            # Calculate execution time
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            result.execution_time_ms = execution_time
            
            logger.info(f"Command completed: {command.command_id} in {execution_time:.2f}ms")
            return result
            
        except asyncio.CancelledError:
            logger.warning(f"Command cancelled: {command.command_id}")
            raise
        except Exception as e:
            logger.error(f"Command failed: {command.command_id}", exc_info=True)
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            return CommandResult(
                command_id=command.command_id,
                success=False,
                error=str(e),
                execution_time_ms=execution_time
            )
        finally:
            # Remove from running commands
            self._running_commands.pop(command.command_id, None)
    
    async def cancel_command(self, command_id: str) -> bool:
        """Cancel a running command."""
        task = self._running_commands.get(command_id)
        if task and not task.done():
            task.cancel()
            return True
        return False


class SagaOrchestrator:
    """Orchestrator for running distributed sagas."""
    
    def __init__(self, executor: CommandExecutor):
        self.executor = executor
        self._running_sagas: Dict[str, SagaContext] = {}
    
    @with_tracing("saga_execute")
    async def execute_saga(self, context: SagaContext) -> bool:
        """Execute a saga with automatic compensation on failure."""
        logger.info(f"Starting saga: {context.saga_id}")
        
        context.status = CommandStatus.RUNNING
        self._running_sagas[context.saga_id] = context
        
        try:
            # Execute each step
            for step in context.steps:
                if not await self._execute_step(context, step):
                    # Step failed, start compensation
                    await self._compensate_saga(context)
                    return False
            
            # All steps completed successfully
            context.status = CommandStatus.COMPLETED
            logger.info(f"Saga completed successfully: {context.saga_id}")
            return True
            
        except Exception as e:
            logger.error(f"Saga failed with exception: {context.saga_id}", exc_info=True)
            context.status = CommandStatus.FAILED
            await self._compensate_saga(context)
            return False
        finally:
            # Remove from running sagas
            self._running_sagas.pop(context.saga_id, None)
    
    async def _execute_step(self, context: SagaContext, step: SagaStep) -> bool:
        """Execute a single saga step with retries."""
        logger.info(f"Executing saga step: {step.name}")
        
        for attempt in range(step.retry_count):
            try:
                # Execute with timeout
                result = await asyncio.wait_for(
                    self.executor.execute(step.command),
                    timeout=step.timeout
                )
                
                if result.success:
                    context.completed_steps.append(step.name)
                    context.results[step.name] = result
                    return True
                
                logger.warning(
                    f"Step {step.name} failed (attempt {attempt + 1}/{step.retry_count}): {result.error}"
                )
                
                # Wait before retry
                if attempt < step.retry_count - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    
            except asyncio.TimeoutError:
                logger.error(f"Step {step.name} timed out after {step.timeout}s")
            except Exception as e:
                logger.error(f"Step {step.name} failed with exception", exc_info=True)
        
        # All attempts failed
        context.failed_step = step.name
        return False
    
    async def _compensate_saga(self, context: SagaContext) -> None:
        """Compensate completed steps in reverse order."""
        logger.info(f"Starting saga compensation: {context.saga_id}")
        context.status = CommandStatus.COMPENSATING
        
        # Compensate in reverse order
        for step_name in reversed(context.completed_steps):
            # Find the step
            step = next((s for s in context.steps if s.name == step_name), None)
            if not step or not step.compensate_command:
                continue
            
            try:
                logger.info(f"Compensating step: {step_name}")
                
                result = await asyncio.wait_for(
                    self.executor.execute(step.compensate_command),
                    timeout=step.timeout
                )
                
                if not result.success:
                    logger.error(f"Failed to compensate step {step_name}: {result.error}")
                    
            except Exception as e:
                logger.error(f"Exception during compensation of {step_name}", exc_info=True)
        
        context.status = CommandStatus.COMPENSATED
        logger.info(f"Saga compensation completed: {context.saga_id}")
    
    def get_saga_status(self, saga_id: str) -> Optional[SagaContext]:
        """Get the status of a running saga."""
        return self._running_sagas.get(saga_id)


# Example command handlers
class ChatCommand(Command):
    """Command for chat operations."""
    pass


class ChatCommandHandler(CommandHandler):
    """Handler for chat commands."""
    
    async def execute(self, command: Command) -> CommandResult:
        """Execute chat command."""
        try:
            # Simulate chat operation
            await asyncio.sleep(0.1)
            
            return CommandResult(
                command_id=command.command_id,
                success=True,
                result={"message": "Chat command executed"}
            )
        except Exception as e:
            return CommandResult(
                command_id=command.command_id,
                success=False,
                error=str(e)
            )
    
    def can_handle(self, command: Command) -> bool:
        """Check if this is a chat command."""
        return command.command_type == "chat"


class SessionCommand(Command):
    """Command for session operations."""
    pass


class SessionCommandHandler(CommandHandler):
    """Handler for session commands."""
    
    async def execute(self, command: Command) -> CommandResult:
        """Execute session command."""
        try:
            # Simulate session operation
            operation = command.payload.get("operation", "create")
            
            if operation == "create":
                session_id = str(uuid.uuid4())
                return CommandResult(
                    command_id=command.command_id,
                    success=True,
                    result={"session_id": session_id}
                )
            elif operation == "delete":
                return CommandResult(
                    command_id=command.command_id,
                    success=True,
                    result={"deleted": True}
                )
            else:
                raise ValueError(f"Unknown operation: {operation}")
                
        except Exception as e:
            return CommandResult(
                command_id=command.command_id,
                success=False,
                error=str(e)
            )
    
    def can_handle(self, command: Command) -> bool:
        """Check if this is a session command."""
        return command.command_type == "session"


# Global command executor
command_executor = CommandExecutor()
saga_orchestrator = SagaOrchestrator(command_executor)


def initialize_command_handlers():
    """Initialize default command handlers."""
    command_executor.register_handler(ChatCommandHandler())
    command_executor.register_handler(SessionCommandHandler())
    logger.info("Initialized command handlers") 