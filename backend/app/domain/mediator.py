"""
Mediator pattern implementation for component communication.

This module provides an event bus for decoupled communication between components.
"""

from typing import Dict, List, Callable, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import asyncio
import json
from enum import Enum

from ..core.observability import get_logger
from ..adapters.queue_redis import RedisAdapter

logger = get_logger(__name__)


class EventType(str, Enum):
    """System event types."""
    AGENT_STARTED = "agent.started"
    AGENT_COMPLETED = "agent.completed"
    AGENT_FAILED = "agent.failed"
    ROUTING_COMPLETED = "routing.completed"
    TOKEN_GENERATED = "token.generated"
    SESSION_CREATED = "session.created"
    SESSION_UPDATED = "session.updated"
    METRICS_RECORDED = "metrics.recorded"
    ERROR_OCCURRED = "error.occurred"


@dataclass
class Event:
    """Event data structure."""
    type: EventType
    payload: Dict[str, Any]
    timestamp: datetime = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "type": self.type.value,
            "payload": self.payload,
            "timestamp": self.timestamp.isoformat(),
            "session_id": self.session_id,
            "request_id": self.request_id
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        """Create event from dictionary."""
        return cls(
            type=EventType(data["type"]),
            payload=data["payload"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            session_id=data.get("session_id"),
            request_id=data.get("request_id")
        )


class EventHandler:
    """Handler for specific event types."""
    
    def __init__(self, event_type: EventType, callback: Callable, filter_fn: Optional[Callable] = None):
        self.event_type = event_type
        self.callback = callback
        self.filter_fn = filter_fn
    
    async def handle(self, event: Event) -> Any:
        """Handle the event if it matches criteria."""
        if event.type != self.event_type:
            return None
        
        if self.filter_fn and not self.filter_fn(event):
            return None
        
        if asyncio.iscoroutinefunction(self.callback):
            return await self.callback(event)
        else:
            return self.callback(event)


class EventBus:
    """Central event bus for publish/subscribe communication."""
    
    def __init__(self, redis_adapter: Optional[RedisAdapter] = None):
        self.handlers: Dict[EventType, List[EventHandler]] = {}
        self.redis_adapter = redis_adapter
        self._local_subscribers: Dict[str, asyncio.Queue] = {}
        self._running = False
        self._tasks: List[asyncio.Task] = []
    
    async def start(self) -> None:
        """Start the event bus."""
        self._running = True
        
        if self.redis_adapter:
            # Start Redis pub/sub listener
            task = asyncio.create_task(self._redis_listener())
            self._tasks.append(task)
        
        logger.info("Event bus started")
    
    async def stop(self) -> None:
        """Stop the event bus."""
        self._running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self._tasks, return_exceptions=True)
        
        self._tasks.clear()
        logger.info("Event bus stopped")
    
    def subscribe(self, event_type: EventType, callback: Callable, filter_fn: Optional[Callable] = None) -> EventHandler:
        """Subscribe to an event type."""
        handler = EventHandler(event_type, callback, filter_fn)
        
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        
        self.handlers[event_type].append(handler)
        logger.debug(f"Subscribed to {event_type.value}")
        
        return handler
    
    def unsubscribe(self, handler: EventHandler) -> None:
        """Unsubscribe a handler."""
        if handler.event_type in self.handlers:
            self.handlers[handler.event_type].remove(handler)
            logger.debug(f"Unsubscribed from {handler.event_type.value}")
    
    async def publish(self, event: Event) -> None:
        """Publish an event to all subscribers."""
        logger.debug(f"Publishing event: {event.type.value}")
        
        # Publish to local handlers
        await self._publish_local(event)
        
        # Publish to Redis if available
        if self.redis_adapter:
            await self._publish_redis(event)
    
    async def _publish_local(self, event: Event) -> None:
        """Publish event to local handlers."""
        handlers = self.handlers.get(event.type, [])
        
        # Execute handlers concurrently
        tasks = [handler.handle(event) for handler in handlers]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # Also publish to session-specific queues if applicable
        if event.session_id and event.session_id in self._local_subscribers:
            queue = self._local_subscribers[event.session_id]
            await queue.put(event)
    
    async def _publish_redis(self, event: Event) -> None:
        """Publish event to Redis pub/sub."""
        channel = f"events:{event.type.value}"
        if event.session_id:
            channel = f"{channel}:{event.session_id}"
        
        try:
            await self.redis_adapter.publish(channel, json.dumps(event.to_dict()))
        except Exception as e:
            logger.error(f"Failed to publish to Redis: {str(e)}")
    
    async def _redis_listener(self) -> None:
        """Listen for events from Redis pub/sub."""
        if not self.redis_adapter:
            return
        
        # Subscribe to all event types
        channels = [f"events:{event_type.value}:*" for event_type in EventType]
        
        try:
            async for message in self.redis_adapter.subscribe_pattern(channels):
                if not self._running:
                    break
                
                try:
                    event_data = json.loads(message['data'])
                    event = Event.from_dict(event_data)
                    
                    # Only process if we have local handlers
                    if event.type in self.handlers:
                        await self._publish_local(event)
                
                except Exception as e:
                    logger.error(f"Failed to process Redis message: {str(e)}")
        
        except Exception as e:
            logger.error(f"Redis listener error: {str(e)}")
    
    def create_session_queue(self, session_id: str) -> asyncio.Queue:
        """Create a queue for session-specific events."""
        if session_id not in self._local_subscribers:
            self._local_subscribers[session_id] = asyncio.Queue()
        return self._local_subscribers[session_id]
    
    def remove_session_queue(self, session_id: str) -> None:
        """Remove a session-specific queue."""
        self._local_subscribers.pop(session_id, None)
    
    async def wait_for_event(
        self,
        event_type: EventType,
        timeout: Optional[float] = None,
        filter_fn: Optional[Callable] = None
    ) -> Optional[Event]:
        """Wait for a specific event type."""
        future = asyncio.Future()
        
        def callback(event: Event):
            if not future.done():
                future.set_result(event)
        
        handler = self.subscribe(event_type, callback, filter_fn)
        
        try:
            return await asyncio.wait_for(future, timeout)
        except asyncio.TimeoutError:
            return None
        finally:
            self.unsubscribe(handler)


class Mediator:
    """Mediator for coordinating complex interactions."""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self._workflows: Dict[str, Callable] = {}
    
    def register_workflow(self, name: str, workflow: Callable) -> None:
        """Register a workflow handler."""
        self._workflows[name] = workflow
        logger.info(f"Registered workflow: {name}")
    
    async def execute_workflow(self, name: str, context: Dict[str, Any]) -> Any:
        """Execute a named workflow."""
        if name not in self._workflows:
            raise ValueError(f"Unknown workflow: {name}")
        
        workflow = self._workflows[name]
        
        # Publish workflow start event
        await self.event_bus.publish(Event(
            type=EventType.AGENT_STARTED,
            payload={"workflow": name, "context": context},
            request_id=context.get("request_id")
        ))
        
        try:
            # Execute workflow
            if asyncio.iscoroutinefunction(workflow):
                result = await workflow(context, self)
            else:
                result = workflow(context, self)
            
            # Publish workflow completion event
            await self.event_bus.publish(Event(
                type=EventType.AGENT_COMPLETED,
                payload={"workflow": name, "result": result},
                request_id=context.get("request_id")
            ))
            
            return result
            
        except Exception as e:
            # Publish workflow failure event
            await self.event_bus.publish(Event(
                type=EventType.AGENT_FAILED,
                payload={"workflow": name, "error": str(e)},
                request_id=context.get("request_id")
            ))
            raise
    
    async def coordinate_agent_execution(
        self,
        agent_id: str,
        context: Dict[str, Any],
        callback: Callable
    ) -> Any:
        """Coordinate agent execution with event publishing."""
        request_id = context.get("request_id")
        session_id = context.get("session_id")
        
        # Publish start event
        await self.event_bus.publish(Event(
            type=EventType.AGENT_STARTED,
            payload={"agent_id": agent_id},
            request_id=request_id,
            session_id=session_id
        ))
        
        try:
            # Execute agent callback
            result = await callback()
            
            # Publish completion event
            await self.event_bus.publish(Event(
                type=EventType.AGENT_COMPLETED,
                payload={"agent_id": agent_id, "result_size": len(str(result))},
                request_id=request_id,
                session_id=session_id
            ))
            
            return result
            
        except Exception as e:
            # Publish failure event
            await self.event_bus.publish(Event(
                type=EventType.AGENT_FAILED,
                payload={"agent_id": agent_id, "error": str(e)},
                request_id=request_id,
                session_id=session_id
            ))
            raise


# Global event bus instance
event_bus = EventBus()
mediator = Mediator(event_bus) 