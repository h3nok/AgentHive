"""
Debug API endpoints for router tracing and performance monitoring.

This module provides WebSocket endpoints for real-time router trace debugging
and performance monitoring in development environments.
"""

from typing import Dict, Set, Optional, List, AsyncIterator
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
import asyncio
import json
import time
import inspect
from datetime import datetime

from app.core.observability import get_logger
from app.core.errors import BaseRouterException
from app.core.settings import settings
from app.domain.schemas import RequestContext, AgentType, PromptIn, ChatResponse
from app.domain.mediator import Event, EventType
from .deps import RouterChainDep, AgentFactory, Mediator, RequestId

logger = get_logger(__name__)

# Create debug router
debug_router = APIRouter(prefix="/debug", tags=["debug"])

# Active WebSocket connections for router traces
# Dict[session_id, Set[WebSocket]]
router_trace_connections: Dict[str, Set[WebSocket]] = {}


class RouterTraceEmitter:
    """Emits router trace events to connected WebSocket clients."""
    
    @staticmethod
    async def emit_trace(session_id: str, trace_data: dict):
        """Emit a router trace event to all connected clients for a session."""
        if session_id not in router_trace_connections:
            return
        
        # Copy the set to avoid modification during iteration
        connections = router_trace_connections[session_id].copy()
        disconnected_connections = set()
        
        for websocket in connections:
            try:
                await websocket.send_text(json.dumps(trace_data))
            except Exception as e:
                logger.debug(f"Failed to send trace to WebSocket: {e}")
                disconnected_connections.add(websocket)
        
        # Remove disconnected connections
        if disconnected_connections:
            router_trace_connections[session_id] -= disconnected_connections
            if not router_trace_connections[session_id]:
                del router_trace_connections[session_id]
    
    @staticmethod
    async def emit_router_step(
        session_id: str,
        step_id: str,
        step_name: str,
        agent_type: AgentType,
        confidence: float,
        intent: str,
        method: str,
        latency_ms: float,
        metadata: Optional[Dict] = None
    ):
        """Emit a router step trace."""
        step_data = {
            "type": "router_step",
            "sessionId": session_id,
            "step": {
                "id": step_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "step": step_name,
                "agent": agent_type.value,
                "confidence": confidence,
                "intent": intent,
                "method": method,
                "latency_ms": latency_ms,
                "metadata": metadata or {}
            }
        }
        await RouterTraceEmitter.emit_trace(session_id, step_data)
    
    @staticmethod
    async def emit_router_trace(
        session_id: str,
        trace_id: str,
        query: str,
        user_id: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        steps: Optional[List] = None,
        final_agent: AgentType = AgentType.GENERAL,
        total_latency_ms: float = 0.0,
        metadata: Optional[Dict] = None
    ):
        """Emit a router trace start event."""
        trace_data = {
            "type": "router_trace_start",
            "sessionId": session_id,
            "trace": {
                "id": trace_id,
                "query": query,
                "userId": user_id,
                "timestamp": (timestamp or datetime.utcnow()).isoformat() + "Z",
                "steps": steps or [],
                "finalAgent": final_agent.value,
                "totalLatency": total_latency_ms,
                "metadata": metadata or {}
            }
        }
        await RouterTraceEmitter.emit_trace(session_id, trace_data)
    
    @staticmethod
    async def emit_router_decision(
        session_id: str,
        trace_id: str,
        final_agent: AgentType,
        confidence: float,
        intent: str,
        method: str,
        total_latency_ms: float,
        metadata: Optional[Dict] = None
    ):
        """Emit a final router decision event."""
        decision_data = {
            "type": "router_decision",
            "sessionId": session_id,
            "decision": {
                "traceId": trace_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "finalAgent": final_agent.value,
                "confidence": confidence,
                "intent": intent,
                "method": method,
                "totalLatency": total_latency_ms,
                "metadata": metadata or {}
            }
        }
        await RouterTraceEmitter.emit_trace(session_id, decision_data)
    
    @staticmethod
    async def emit_router_trace_complete(
        session_id: str,
        trace_id: str,
        query: str,
        total_latency: float,
        final_agent: AgentType,
        final_confidence: float,
        steps: List,
        success: bool = True,
        error: Optional[str] = None
    ):
        """Emit a complete router trace."""
        trace_data = {
            "type": "router_trace_complete",
            "sessionId": session_id,
            "trace": {
                "id": trace_id,
                "query": query,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "totalLatency": total_latency,
                "finalAgent": final_agent.value,
                "finalConfidence": final_confidence,
                "steps": steps,
                "success": success,
                "error": error
            }
        }
        await RouterTraceEmitter.emit_trace(session_id, trace_data)


# Global instance for use in router chain
router_trace_emitter = RouterTraceEmitter()


@debug_router.websocket("/router-trace/{session_id}")
async def router_trace_websocket(
    websocket: WebSocket,
    session_id: str
):
    """
    WebSocket endpoint for real-time router trace debugging.
    
    This endpoint provides live streaming of router decision traces for a specific
    chat session, including step-by-step routing decisions, confidence scores,
    and performance metrics.
    
    Protocol:
    - Server sends: router trace events as JSON
    - Events include: router steps, complete traces, performance metrics
    """
    await websocket.accept()
    
    # Add connection to tracking
    if session_id not in router_trace_connections:
        router_trace_connections[session_id] = set()
    router_trace_connections[session_id].add(websocket)
    
    logger.info(f"Router trace WebSocket connected for session {session_id}")
    
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "sessionId": session_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }))
        
        # Keep connection alive and handle any incoming messages
        while True:
            try:
                # Wait for ping/pong or other control messages
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                
                # Handle ping/pong for keepalive
                if message == "ping":
                    await websocket.send_text("pong")
                elif message == "pong":
                    # Client pong response, connection is alive
                    pass
                else:
                    # Handle other control messages if needed
                    logger.debug(f"Received router trace message: {message}")
                    
            except asyncio.TimeoutError:
                # Send ping to check if connection is still alive
                try:
                    await websocket.send_text("ping")
                except:
                    break
            except Exception as e:
                logger.debug(f"Router trace WebSocket error: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"Router trace WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Router trace WebSocket error: {e}")
    finally:
        # Clean up connection tracking
        if session_id in router_trace_connections:
            router_trace_connections[session_id].discard(websocket)
            if not router_trace_connections[session_id]:
                del router_trace_connections[session_id]
        
        try:
            await websocket.close()
        except:
            pass


@debug_router.get("/router-trace/sessions")
async def get_active_trace_sessions():
    """Get list of sessions with active router trace connections."""
    return {
        "active_sessions": list(router_trace_connections.keys()),
        "total_connections": sum(len(connections) for connections in router_trace_connections.values())
    }


@debug_router.delete("/router-trace/sessions/{session_id}")
async def disconnect_trace_session(session_id: str):
    """Disconnect all router trace connections for a session."""
    if session_id in router_trace_connections:
        connections = router_trace_connections[session_id].copy()
        for websocket in connections:
            try:
                await websocket.close()
            except:
                pass
        del router_trace_connections[session_id]
        return {"message": f"Disconnected {len(connections)} connections for session {session_id}"}
    else:
        return {"message": f"No active connections for session {session_id}"}


@debug_router.post("/chat", response_model=ChatResponse)
async def debug_chat_endpoint(
    prompt_in: PromptIn,
    request_id: RequestId,
    router_chain: RouterChainDep,
    agent_factory: AgentFactory,
    mediator: Mediator,
) -> ChatResponse:
    """
    Development-only chat endpoint that doesn't require authentication.
    
    This endpoint is identical to /v1/chat but bypasses authentication
    for development and testing purposes.
    
    WARNING: This endpoint should only be available in development environments.
    """
    if settings.ENVIRONMENT not in ["development", "test"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debug endpoint not available in production"
        )
    
    try:
        # Create request context for debugging user
        context = RequestContext(
            prompt=prompt_in,
            user_id="dev_user",
            request_id=request_id,
            metadata={"debug_mode": True}
        )
        
        # Start timing
        start_time = time.time()
        
        # Run the routing chain to determine agent
        routing_result = await router_chain.route(context)
        agent_type = AgentType(routing_result.metadata.get("selected_agent", AgentType.GENERAL.value))
        
        # Emit router trace for debugging (with session_id fallback)
        session_id = prompt_in.session_id or f"debug_session_{int(time.time() * 1000)}"
        await RouterTraceEmitter.emit_router_trace(
            session_id=session_id,
            trace_id=request_id,
            query=prompt_in.prompt,
            user_id="dev_user",
            timestamp=datetime.utcnow(),
            final_agent=agent_type,
            total_latency_ms=(time.time() - start_time) * 1000,
            metadata={"debug_mode": True}
        )
        
        # Get the appropriate agent
        agent = await agent_factory.create_agent_for_request(agent_type, context)
        
        # Execute the agent - handle both streaming and non-streaming responses
        agent_response = await agent.handle(context)
        
        # Handle different response types
        if inspect.isasyncgen(agent_response):
            # It's an async iterator (streaming response), collect all chunks
            response_chunks = []
            async for chunk in agent_response:
                response_chunks.append(chunk)
            response_content = "".join(response_chunks)
        else:
            # It's an AgentResponse object (non-streaming)
            response_content = agent_response.content
        
        # Calculate total processing time
        processing_time = time.time() - start_time
        
        logger.info(f"Debug chat request processed successfully", extra={
            "session_id": session_id,
            "agent_type": agent_type.value,
            "processing_time": processing_time,
            "request_id": request_id,
            "response_type": "streaming" if inspect.isasyncgen(agent_response) else "complete"
        })
        
        return ChatResponse(
            response=response_content,
            session_id=session_id,
            agent_id=agent.agent_id,
            agent_type=agent_type,
            metadata={
                "intent": routing_result.intent,
                "confidence": routing_result.confidence,
                "routing_method": routing_result.routing_method.value,
                "debug_mode": True,
                "response_type": "streaming" if inspect.isasyncgen(agent_response) else "complete"
            }
        )
        
    except BaseRouterException as e:
        logger.error(f"Router error in debug chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in debug chat: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@debug_router.get("/health")
async def debug_health():
    """Debug health endpoint."""
    return {
        "status": "healthy",
        "service": "debug-router",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "active_sessions": list(router_trace_connections.keys()),
        "total_connections": sum(len(connections) for connections in router_trace_connections.values())
    }
