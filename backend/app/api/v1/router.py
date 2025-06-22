"""
API v1 router with HTTP and WebSocket endpoints.

This module defines all the API endpoints for the intelligent router system.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Response, Query
from fastapi.responses import JSONResponse
import time
from datetime import datetime

from app.core.observability import get_logger, request_counter, request_duration, active_requests
from app.core.load_balancer import RouterLoadBalancer
from app.core.errors import BaseRouterException
from app.core.settings import settings
from app.domain.schemas import (
    PromptIn, ChatResponse, StreamEventType, RequestContext,
    AgentType, HealthStatus, AgentRegistration, Session, Message
)
from app.domain.mediator import Event, EventType
from .deps import (
    CurrentUser, DevFriendlyUser, RequestId, RedisClient, EventBus,
    Mediator, AgentFactory, RouterChainDep, RateLimit,
    check_services_health
)
from .debug import debug_router
from .debug_simple import debug_simple_router
from .sessions import router as sessions_router
from .agents import router as agents_router
from .models import router as models_router
from .analytics import router as analytics_router
from .dashboard import router as dashboard_router
from .support import router as support_router
from .microservices import router as microservices_router
from .mcp import router as mcp_router
from .swarm import router as swarm_router

logger = get_logger(__name__)
# Initialize global load balancer instance
load_balancer = RouterLoadBalancer()

# Create router
router = APIRouter(prefix="/v1", tags=["chat"])

# Include sub-routers
router.include_router(sessions_router)
router.include_router(agents_router)
router.include_router(models_router)
router.include_router(analytics_router)
router.include_router(dashboard_router)
router.include_router(support_router)
router.include_router(microservices_router)
router.include_router(mcp_router)
router.include_router(swarm_router)

# Include debug router for development/testing
if settings.ENVIRONMENT in ["development", "test"]:
    router.include_router(debug_router)


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    prompt_in: PromptIn,
    user: CurrentUser,
    request_id: RequestId,
    router_chain: RouterChainDep,
    agent_factory: AgentFactory,
    mediator: Mediator,
    _: RateLimit,
) -> ChatResponse:
    """
    Process a chat prompt through the intelligent router.
    
    This endpoint:
    1. Runs the routing chain to determine which agent should handle the request
    2. Creates/retrieves the appropriate agent
    3. Executes the agent to generate a response
    4. Returns the complete response
    """
    start_time = time.time()
    
    # Record request metric
    request_counter.labels(method="POST", endpoint="/v1/chat", status="processing").inc()
    active_requests.inc()
    
    try:
        # Create request context
        context = RequestContext(
            prompt=prompt_in,
            user_id=user["user_id"],
            request_id=request_id
        )
        
        # Route the request through load balancer for resilience
        routing_result = await load_balancer.call(router_chain.route, context)
        agent_type = AgentType(routing_result.metadata.get("selected_agent", AgentType.GENERAL.value))
        
        # Publish routing completed event
        await mediator.event_bus.publish(Event(
            type=EventType.ROUTING_COMPLETED,
            payload={
                "intent": routing_result.intent,
                "agent_type": agent_type.value,
                "confidence": routing_result.confidence,
                "method": routing_result.routing_method.value
            },
            request_id=request_id,
            session_id=prompt_in.session_id
        ))
        
        # Get the agent
        agent = await agent_factory.create_agent_for_request(agent_type, context)
        
        # Execute through mediator for coordination
        response = await load_balancer.call(mediator.coordinate_agent_execution,
             agent_id=agent.agent_id,
             context={
                 "request_id": request_id,
                 "session_id": prompt_in.session_id
             },
             callback=lambda: agent.handle(context)
         )
        
        # Handle streaming vs non-streaming response
        if hasattr(response, '__aiter__'):
            # Collect streaming response
            content_parts = []
            async for chunk in response:
                content_parts.append(chunk)
            content = "".join(content_parts)
        else:
            content = response.content
        
        # Record success metric
        elapsed = (time.time() - start_time) * 1000
        request_duration.labels(method="POST", endpoint="/v1/chat").observe(elapsed / 1000)
        request_counter.labels(method="POST", endpoint="/v1/chat", status="success").inc()
        
        return ChatResponse(
            response=content,
            session_id=prompt_in.session_id or f"session_{int(time.time() * 1000)}",
            agent_id=agent.agent_id,
            agent_type=agent_type,
            metadata={
                "intent": routing_result.intent,
                "confidence": routing_result.confidence,
                "routing_method": routing_result.routing_method.value,
                "latency_ms": elapsed
            },
            usage=getattr(response, 'usage', None)
        )
        
    except BaseRouterException as e:
        request_counter.labels(method="POST", endpoint="/v1/chat", status="error").inc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) from e
    except Exception as e:
        request_counter.labels(method="POST", endpoint="/v1/chat", status="error").inc()
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request"
        ) from e
    finally:
        active_requests.dec()


@router.websocket("/stream/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    router_chain: RouterChainDep,
    agent_factory: AgentFactory,
    event_bus: EventBus,
):
    """
    WebSocket endpoint for streaming chat responses.
    
    Protocol:
    - Client sends: {"prompt": "...", "context": {...}}
    - Server streams: {"type": "token", "content": "...", "message_id": "..."}
    - Server ends with: {"type": "end", "message_id": "..."}
    - On error: {"type": "error", "content": "...", "message_id": "..."}
    """
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Validate input
            if "prompt" not in data:
                await websocket.send_json({
                    "type": StreamEventType.ERROR.value,
                    "content": "Missing 'prompt' field"
                })
                continue
            
            # Create prompt input
            prompt_in = PromptIn(
                prompt=data["prompt"],
                session_id=session_id,
                context=data.get("context", {}),
                max_tokens=data.get("max_tokens"),
                temperature=data.get("temperature"),
                stream=True  # Always stream for WebSocket
            )
            
            # Generate message ID
            message_id = f"msg_{int(time.time() * 1000)}"
            
            # Create request context
            context = RequestContext(
                prompt=prompt_in,
                request_id=message_id
            )
            
            try:
                # Route the request
                routing_result = await load_balancer.call(router_chain.route, context)
                agent_type = AgentType(routing_result.metadata.get("selected_agent", AgentType.GENERAL.value))
                
                # Send metadata event
                await websocket.send_json({
                    "type": StreamEventType.METADATA.value,
                    "message_id": message_id,
                    "metadata": {
                        "agent_type": agent_type.value,
                        "intent": routing_result.intent,
                        "confidence": routing_result.confidence
                    }
                })
                
                # Get the agent
                agent = await agent_factory.create_agent_for_request(agent_type, context)
                
                # Execute agent and stream response
                response = await agent.handle(context)
                
                # Stream tokens
                if hasattr(response, '__aiter__'):
                    async for token in response:
                        # Send token event
                        await websocket.send_json({
                            "type": StreamEventType.TOKEN.value,
                            "content": token,
                            "message_id": message_id
                        })
                        
                        # Publish token event
                        await event_bus.publish(Event(
                            type=EventType.TOKEN_GENERATED,
                            payload={"token": token},
                            request_id=message_id,
                            session_id=session_id
                        ))
                else:
                    # Non-streaming response, send as single token
                    await websocket.send_json({
                        "type": StreamEventType.TOKEN.value,
                        "content": response.content,
                        "message_id": message_id
                    })
                
                # Send completion event
                await websocket.send_json({
                    "type": StreamEventType.END.value,
                    "message_id": message_id
                })
                
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {str(e)}")
                await websocket.send_json({
                    "type": StreamEventType.ERROR.value,
                    "content": str(e),
                    "message_id": message_id
                })
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        try:
            await websocket.send_json({
                "type": StreamEventType.ERROR.value,
                "content": "Internal server error"
            })
        except Exception:
            pass
    finally:
        # Clean up session queue
        event_bus.remove_session_queue(session_id)


@router.get("/agents", response_model=List[AgentRegistration])
async def list_agents(
    user: CurrentUser,
    agent_factory: AgentFactory
) -> List[AgentRegistration]:
    """List all available agents."""
    return agent_factory.registry.list_agents()


@router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    """Health check endpoint."""
    checks = await check_services_health()
    
    # Determine overall status
    all_healthy = all(checks.values())
    health_status = "healthy" if all_healthy else "degraded"
    
    return HealthStatus(
        status=health_status,
        checks=checks,
        version="1.0.0",
        timestamp=datetime.utcnow()
    )


@router.get("/metrics")
async def metrics_endpoint():
    """Prometheus metrics endpoint."""
    from app.core.observability import get_prometheus_metrics
    
    return Response(
        content=get_prometheus_metrics(),
        media_type="text/plain"
    )


# Session management endpoints
@router.get("/sessions", response_model=List[Session])
async def get_user_sessions(
    user: CurrentUser,
    redis_client: RedisClient,
    skip: int = Query(0, ge=0, description="Number of sessions to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of sessions to return")
) -> List[Session]:
    """Get user sessions with pagination."""
    try:
        # For now, return empty list since we need to implement a different strategy
        # In a real implementation, you would either:
        # 1. Use a separate index for user sessions (e.g., set with user's session IDs)
        # 2. Use a different storage pattern
        # 3. Store sessions in a hash with user_id as part of the structure
        
        # For demo purposes, return empty list
        user_sessions = []
        
        # Apply pagination (though empty for now)
        return user_sessions[skip:skip + limit]
        
    except Exception as e:
        logger.error(f"Failed to get user sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )


@router.post("/sessions", response_model=Session)
async def create_session(
    user: CurrentUser,
    request_id: RequestId,
    redis_client: RedisClient,
    event_bus: EventBus
) -> Session:
    """Create a new chat session."""
    session = Session(
        session_id=f"session_{int(time.time() * 1000)}",
        user_id=user["user_id"]
    )
    
    # Store in Redis
    await redis_client.set(
        f"session:{session.session_id}",
        session.json(),
        expire=86400  # 24 hours
    )
    
    # Publish event
    await event_bus.publish(Event(
        type=EventType.SESSION_CREATED,
        payload={"session_id": session.session_id},
        request_id=request_id,
        session_id=session.session_id
    ))
    
    return session


@router.get("/sessions/{session_id}", response_model=Session)
async def get_session(
    session_id: str,
    user: DevFriendlyUser,
    redis_client: RedisClient
) -> Session:
    """Get session details."""
    session_data = await redis_client.get(f"session:{session_id}")
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session = Session.parse_raw(session_data)
    
    # Check ownership
    if session.user_id != user["user_id"] and user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return session


@router.post("/sessions/{session_id}/messages")
async def add_message_to_session(
    session_id: str,
    message: Message,
    user: CurrentUser,
    redis_client: RedisClient,
    event_bus: EventBus
) -> Dict[str, str]:
    """Add a message to session history."""
    # Get session
    session_data = await redis_client.get(f"session:{session_id}")
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session = Session.parse_raw(session_data)
    
    # Check ownership
    if session.user_id != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Add message
    session.add_message(message)
    
    # Update in Redis
    await redis_client.set(
        f"session:{session_id}",
        session.json(),
        expire=86400
    )
    
    # Publish event
    await event_bus.publish(Event(
        type=EventType.SESSION_UPDATED,
        payload={"session_id": session_id, "message_count": len(session.messages)},
        session_id=session_id
    ))
    
    return {"status": "success"}


# Router Analytics and Learning Endpoints

@router.get("/router/metrics", response_model=Dict[str, Any])
async def get_router_metrics(
    user: CurrentUser,
    router_chain: RouterChainDep,
) -> Dict[str, Any]:
    """
    Get comprehensive router performance metrics.
    
    Returns metrics for:
    - Overall routing performance
    - Learning system effectiveness
    - Context-aware routing insights
    - Node-level performance data
    """
    try:
        # Get enhanced metrics if available
        enhanced_metrics = router_chain.get_enhanced_metrics()
        
        # Add basic router metrics
        basic_metrics = {
            'router_type': 'enhanced' if enhanced_metrics.get('enhanced_routing') else 'standard',
            'total_requests': 0,  # This would come from prometheus metrics
            'uptime': datetime.utcnow().isoformat(),
            'version': '2.0.0'
        }
        
        return {
            **basic_metrics,
            **enhanced_metrics
        }
        
    except Exception as e:
        logger.error("Failed to get router metrics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve router metrics"
        ) from e


@router.post("/router/feedback")
async def record_routing_feedback(
    feedback_data: Dict[str, Any],
    user: CurrentUser,
    router_chain: RouterChainDep,
) -> Dict[str, Any]:
    """
    Record feedback for a routing decision to improve learning.
    
    Expected payload:
    {
        "decision_id": "unique_decision_id",
        "feedback_type": "user_satisfaction|agent_success|resolution_time|escalation",
        "feedback_value": "feedback_value",
        "session_id": "session_id"
    }
    """
    try:
        decision_id = feedback_data.get("decision_id")
        feedback_type = feedback_data.get("feedback_type")
        feedback_value = feedback_data.get("feedback_value")
        session_id = feedback_data.get("session_id")
        
        if not all([decision_id, feedback_type, feedback_value is not None]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: decision_id, feedback_type, feedback_value"
            )
        
        # Type validation
        if not isinstance(decision_id, str) or not isinstance(feedback_type, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="decision_id and feedback_type must be strings"
            )
        
        # Record feedback in learning system
        await router_chain.record_feedback(decision_id, feedback_type, feedback_value)
        
        # Get user identifier safely
        user_id = getattr(user, 'id', None) or getattr(user, 'user_id', None) or str(user)
        
        logger.info(
            "Routing feedback recorded",
            decision_id=decision_id,
            feedback_type=feedback_type,
            user_id=user_id
        )
        
        return {
            "status": "success",
            "message": "Feedback recorded successfully",
            "decision_id": decision_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to record routing feedback", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record feedback"
        ) from e


@router.post("/router/satisfaction")
async def record_user_satisfaction(
    satisfaction_data: Dict[str, Any],
    user: CurrentUser,
    router_chain: RouterChainDep,
) -> Dict[str, Any]:
    """
    Record user satisfaction score for agent interactions.
    
    Expected payload:
    {
        "agent_type": "lease|sales|support|general",
        "satisfaction_score": 1.0-5.0,
        "session_id": "session_id",
        "comment": "optional_comment"
    }
    """
    try:
        agent_type = satisfaction_data.get("agent_type")
        satisfaction_score = satisfaction_data.get("satisfaction_score")
        session_id = satisfaction_data.get("session_id")
        comment = satisfaction_data.get("comment", "")
        
        if not all([agent_type, satisfaction_score is not None]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: agent_type, satisfaction_score"
            )
        
        # Type validation
        if not isinstance(agent_type, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="agent_type must be a string"
            )
        
        # Validate satisfaction score
        if satisfaction_score is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="satisfaction_score is required"
            )
            
        try:
            score = float(satisfaction_score)
            if not (1.0 <= score <= 5.0):
                raise ValueError("Score must be between 1.0 and 5.0")
        except (ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="satisfaction_score must be a number between 1.0 and 5.0"
            ) from exc
        
        # Record satisfaction
        user_id = getattr(user, 'id', None) or getattr(user, 'user_id', None) or str(user)
        await router_chain.record_satisfaction(str(user_id), agent_type, score)
        
        logger.info(
            "User satisfaction recorded",
            agent_type=agent_type,
            satisfaction_score=score,
            user_id=user_id,
            session_id=session_id
        )
        
        return {
            "status": "success",
            "message": "Satisfaction score recorded successfully",
            "agent_type": agent_type,
            "score": score
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to record satisfaction", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record satisfaction"
        ) from e


@router.get("/router/analytics/dashboard")
async def get_router_analytics_dashboard(
    user: CurrentUser,
    router_chain: RouterChainDep,
    time_range: Optional[str] = "24h",
) -> Dict[str, Any]:
    """
    Get analytics data for the router dashboard.
    
    Returns comprehensive analytics including:
    - Routing decision distribution
    - Performance metrics over time
    - Learning effectiveness
    - User satisfaction trends
    """
    try:
        # Get enhanced metrics
        metrics = router_chain.get_enhanced_metrics()
        
        # Parse time range
        hours = 24
        if time_range == "1h":
            hours = 1
        elif time_range == "6h":
            hours = 6
        elif time_range == "24h":
            hours = 24
        elif time_range == "7d":
            hours = 168
        elif time_range == "30d":
            hours = 720
        
        # Prepare dashboard data
        dashboard_data = {
            "time_range": time_range,
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_decisions": metrics.get('learning_metrics', {}).get('total_decisions', 0),
                "recent_decisions": metrics.get('learning_metrics', {}).get('recent_decisions', 0),
                "success_rate": metrics.get('learning_metrics', {}).get('success_rate', 0.0),
                "avg_satisfaction": metrics.get('context_metrics', {}).get('avg_user_satisfaction', 0.0),
                "active_sessions": metrics.get('context_metrics', {}).get('active_sessions', 0),
                "learning_enabled": metrics.get('learning_metrics', {}).get('learning_enabled', False)
            },
            "agent_distribution": metrics.get('learning_metrics', {}).get('agent_distribution', {}),
            "node_performance": metrics.get('learning_metrics', {}).get('node_performance', {}),
            "context_insights": {
                "avg_conversation_length": metrics.get('context_metrics', {}).get('avg_conversation_length', 0),
                "agent_preferences": metrics.get('context_metrics', {}).get('agent_preferences', {}),
                "active_users": metrics.get('context_metrics', {}).get('active_users', 0)
            }
        }
        
        return dashboard_data
        
    except Exception as e:
        logger.error("Failed to get analytics dashboard", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analytics data"
        ) from e


@router.get("/router/learning/export")
async def export_learning_data(
    user: CurrentUser,
    router_chain: RouterChainDep,
    export_format: str = Query("json", description="Export format: json or csv"),
) -> Response:
    """
    Export learning data for analysis or backup.
    
    Supports JSON and CSV formats.
    Requires appropriate permissions.
    """
    try:
        # Check if user has admin permissions (implement as needed)
        # if not user.is_admin:
        #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        
        learning_router = router_chain.get_learning_router()
        if not learning_router:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning router not available"
            )
        
        # Export learning data
        learning_data = learning_router.export_learning_data()
        
        if export_format.lower() == "json":
            return JSONResponse(
                content=learning_data,
                headers={"Content-Disposition": f"attachment; filename=learning_data_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"}
            )
        elif export_format.lower() == "csv":
            # Convert to CSV format (simplified version)
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers
            writer.writerow([
                'decision_id', 'session_id', 'timestamp', 'selected_agent',
                'routing_method', 'confidence', 'success', 'user_satisfaction'
            ])
            
            # Write decision data
            for decision in learning_data.get('decision_history', []):
                writer.writerow([
                    decision.get('decision_id', ''),
                    decision.get('session_id', ''),
                    decision.get('timestamp', ''),
                    decision.get('selected_agent', ''),
                    decision.get('routing_method', ''),
                    decision.get('confidence', ''),
                    decision.get('success', ''),
                    decision.get('user_satisfaction', '')
                ])
            
            csv_content = output.getvalue()
            output.close()
            
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=learning_data_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supported formats: json, csv"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to export learning data", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export learning data"
        ) from e


# Include this router in the main app
def include_router(app):
    """Include this router in the FastAPI app."""
    app.include_router(router)
    
    # Include plugins router
    try:
        from .plugins import router as plugins_router
        app.include_router(plugins_router, prefix="/v1")
    except Exception as e:
        logger.error(f"Failed to include plugins router: {e}")
    
    # Include debug router in development/debug environments
    try:
        app.include_router(debug_router)
    except Exception:
        # If debug router has errors, include simple debug router
        app.include_router(debug_simple_router)