"""
Debug WebSocket endpoints for router tracing.

This module provides a simplified WebSocket endpoint for router trace debugging
without the complex dependencies that cause compilation errors.
"""

from typing import Dict, Set, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from datetime import datetime

from app.core.observability import get_logger
from app.core.settings import settings

logger = get_logger(__name__)

# Create debug router
debug_websocket_router = APIRouter(prefix="/debug", tags=["debug"])

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
        agent_type: str,
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
                "agent": agent_type,
                "confidence": confidence,
                "intent": intent,
                "method": method,
                "latency_ms": latency_ms,
                "metadata": metadata or {}
            }
        }
        await RouterTraceEmitter.emit_trace(session_id, step_data)


# Global instance for use in router chain
router_trace_emitter = RouterTraceEmitter()


@debug_websocket_router.websocket("/router-trace/{session_id}")
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
    if settings.ENVIRONMENT not in ["development", "test"]:
        await websocket.close(code=1000, reason="Debug endpoint not available in production")
        return
    
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
        
        # Send a test trace event to demonstrate functionality
        await asyncio.sleep(1)
        await RouterTraceEmitter.emit_router_step(
            session_id=session_id,
            step_id="test-step-1",
            step_name="connection_test",
            agent_type="general",
            confidence=1.0,
            intent="test_connection",
            method="websocket",
            latency_ms=0.0,
            metadata={"test": True, "connection_time": datetime.utcnow().isoformat()}
        )
        
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
                except Exception:
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
        except Exception:
            pass


@debug_websocket_router.get("/health")
async def debug_websocket_health():
    """Debug WebSocket health check."""
    return {
        "status": "websocket_debug_ok",
        "environment": settings.ENVIRONMENT,
        "active_connections": sum(len(conns) for conns in router_trace_connections.values())
    }
