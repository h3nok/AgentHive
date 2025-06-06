"""
Agent API router for chat and query processing.

This module provides endpoints for processing chat queries through intelligent agents.
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator, Any, Optional
import json
import datetime
import time
import asyncio
import uuid
import os

from app.core.observability import get_logger
from .deps import DevFriendlyUser, RedisClient, RouterChainDep

logger = get_logger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])

# Cache for recent query results
query_cache = {}
CACHE_TTL = 300  # 5 minutes cache lifetime

def clean_cache():
    """Clean expired cache entries."""
    current_time = time.time()
    expired_keys = [k for k, v in query_cache.items() if current_time - v['timestamp'] > CACHE_TTL]
    for key in expired_keys:
        del query_cache[key]

async def save_message_to_redis(redis: Any, session_id: str, role: str, content: str, agent: Optional[str] = None) -> str:
    """Save a message to Redis and return the message ID."""
    message_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow()
    
    message_data = {
        'message_id': message_id,
        'session_id': session_id,
        'role': role,
        'content': content,
        'agent': agent or '',
        'created_at': now.isoformat()
    }
    
    # Save message hash
    await redis.hset(f"message:{message_id}", mapping=message_data)
    
    # Add to session's message list
    await redis.lpush(f"session:{session_id}:messages", message_id)
    
    # Update session timestamp
    await redis.hset(f"session:{session_id}", "updated_at", now.isoformat())
    
    return message_id

async def process_non_streaming_query(
    session_id: str, 
    query: str, 
    router_chain: Any,
    redis: Any,
    user_id: str,
    explicit_agent: Optional[str] = None
) -> dict:
    """Process query without streaming and return complete response."""
    
    try:
        # Ensure session exists
        session_data = await redis.hgetall(f"session:{session_id}")
        if not session_data:
            # Create session if it doesn't exist
            now = datetime.datetime.utcnow()
            session_data = {
                'session_id': session_id,
                'user_id': user_id,
                'title': 'New Chat',
                'created_at': now.isoformat(),
                'updated_at': now.isoformat(),
                'pinned': 'false'
            }
            await redis.hset(f"session:{session_id}", mapping=session_data)
            await redis.sadd(f"user:{user_id}:sessions", session_id)
        
        # Save user message
        await save_message_to_redis(redis, session_id, "user", query)
        
        # Determine agent to use - explicit agent overrides routing
        selected_agent = explicit_agent
        confidence = 1.0
        routing_method = "explicit"
        routing_result = None
        
        if explicit_agent:
            logger.info(f"Using explicitly requested agent: {explicit_agent}")
        else:
            # Process query through router chain for intelligent routing
            from app.domain.schemas import PromptIn, RequestContext
            
            prompt_request = PromptIn(
                prompt=query,
                session_id=session_id,
                max_tokens=2000,
                temperature=0.7,
                stream=False
            )
            
            context = RequestContext(
                prompt=prompt_request,
                user_id=user_id,
                timestamp=datetime.datetime.utcnow()
            )
            
            # Get router decision
            routing_result = await router_chain.route(context)
            selected_agent = routing_result.metadata.get('selected_agent', 'general')
            confidence = getattr(routing_result, 'confidence', 0.0)
            routing_method = getattr(routing_result, 'routing_method', 'intelligent')
            logger.info(f"Router selected agent: {selected_agent} (confidence: {confidence})")
        
        # Process the request through the agent factory
        full_response = ""
        
        try:
            # Get the appropriate agent from the factory
            from app.domain.agent_factory import agent_registry
            from app.domain.schemas import AgentType
            
            # Map string to AgentType enum
            agent_type_map = {
                'general': AgentType.GENERAL,
                'lease': AgentType.LEASE,
                'sales': AgentType.SALES,
                'support': AgentType.SUPPORT,
                'hr': AgentType.HR
            }
            
            agent_type = agent_type_map.get(selected_agent or 'general', AgentType.GENERAL)
            
            # Create an agent instance for this request
            agent = await agent_registry.create_agent(agent_type)
            
            # Recreate context for agent processing
            from app.domain.schemas import PromptIn, RequestContext
            
            prompt_request = PromptIn(
                prompt=query,
                session_id=session_id,
                max_tokens=2000,
                temperature=0.7,
                stream=False
            )
            
            context = RequestContext(
                prompt=prompt_request,
                user_id=user_id,
                timestamp=datetime.datetime.utcnow()
            )            
            if agent:
                # Handle response from agent
                agent_response = await agent.handle(context)
                
                # Handle agent response with proper type checking
                from collections.abc import AsyncIterator
                if isinstance(agent_response, AsyncIterator):
                    # It's an AsyncIterator[str] - collect all chunks
                    logger.info("Collecting streaming response from agent for non-streaming request")
                    response_chunks = []
                    async for chunk in agent_response:
                        response_chunks.append(chunk)
                    full_response = ''.join(response_chunks)
                else:
                    # It's an AgentResponse object
                    logger.info("Processing non-streaming response from agent") 
                    full_response = agent_response.content
            else:
                # Fallback if agent not found
                full_response = f"I received your query: '{query}'. This is a response from the {agent_type} agent."
                    
        except (ValueError, RuntimeError, asyncio.TimeoutError) as agent_error:
            logger.warning(f"Agent processing failed, using fallback: {agent_error}")
            # Fallback response if agent processing fails
            full_response = f"I received your query: '{query}'. This is a response from the {selected_agent} agent."
        
        # Save assistant response
        if full_response.strip():
            await save_message_to_redis(
                redis, 
                session_id, 
                "assistant", 
                full_response,
                selected_agent
            )
        
        return {
            "content": full_response,
            "agent_type": selected_agent,
            "session_id": session_id,
            "routing_metadata": {
                'selected_agent': selected_agent,
                'confidence': confidence,
                'routing_method': routing_method
            }
        }
        
    except (asyncio.TimeoutError, ValueError, RuntimeError) as e:
        logger.exception(f"Error in process_non_streaming_query: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


async def optimized_event_stream(
    session_id: str, 
    query: str, 
    router_chain: Any,
    redis: Any,
    user_id: str,
    stream: bool = True,
    explicit_agent: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """Process query with optimized chunking and timeout protection."""
    
    # Emit initial status
    yield f"data: {json.dumps({'type': 'status', 'delta': 'thinking'})}\n\n"
    
    try:
        # Ensure session exists
        session_data = await redis.hgetall(f"session:{session_id}")
        if not session_data:
            # Create session if it doesn't exist
            now = datetime.datetime.utcnow()
            session_data = {
                'session_id': session_id,
                'user_id': user_id,
                'title': 'New Chat',
                'created_at': now.isoformat(),
                'updated_at': now.isoformat(),
                'pinned': 'false'
            }
            await redis.hset(f"session:{session_id}", mapping=session_data)
            await redis.sadd(f"user:{user_id}:sessions", session_id)
        
        # Save user message
        await save_message_to_redis(redis, session_id, "user", query)
        
        # Determine agent to use - explicit agent overrides routing
        selected_agent = explicit_agent
        confidence = 1.0
        routing_method = "explicit"
        
        if explicit_agent:
            logger.info(f"Using explicitly requested agent: {explicit_agent}")
            # Emit routing metadata for explicit agent
            yield f"data: {json.dumps({
                'type': 'routing_metadata',
                'data': {
                    'selected_agent': explicit_agent,
                    'confidence': 1.0,
                    'routing_method': 'explicit'
                }
            })}\n\n"
        else:
            # Process query through router chain for intelligent routing
            from app.domain.schemas import PromptIn, RequestContext
            
            prompt_request = PromptIn(
                prompt=query,
                session_id=session_id,
                max_tokens=2000,
                temperature=0.7,
                stream=stream
            )
            
            context = RequestContext(
                prompt=prompt_request,
                user_id=user_id,
                timestamp=datetime.datetime.utcnow()
            )
            
            # Get router decision
            routing_result = await router_chain.route(context)
            selected_agent = routing_result.metadata.get('selected_agent', 'general')
            confidence = getattr(routing_result, 'confidence', 0.0)
            routing_method = getattr(routing_result, 'routing_method', 'intelligent')
            
            # Emit routing metadata
            yield f"data: {json.dumps({
                'type': 'routing_metadata',
                'data': {
                    'selected_agent': selected_agent,
                    'confidence': confidence,
                    'routing_method': routing_method
                }
            })}\n\n"
        
        # Process the request through the agent factory
        full_response = ""
        
        try:
            # Get the appropriate agent from the factory
            from app.domain.agent_factory import agent_registry
            from app.domain.schemas import AgentType
            
            # Map string to AgentType enum
            agent_type_map = {
                'general': AgentType.GENERAL,
                'lease': AgentType.LEASE,
                'sales': AgentType.SALES,
                'support': AgentType.SUPPORT,
                'hr': AgentType.HR
            }
            
            agent_type = agent_type_map.get(selected_agent or 'general', AgentType.GENERAL)
            
            # Create an agent instance for this request
            agent = await agent_registry.create_agent(agent_type)
            
            # Create context for agent processing
            from app.domain.schemas import PromptIn, RequestContext
            
            prompt_request = PromptIn(
                prompt=query,
                session_id=session_id,
                max_tokens=2000,
                temperature=0.7,
                stream=stream
            )
            
            context = RequestContext(
                prompt=prompt_request,
                user_id=user_id,
                timestamp=datetime.datetime.utcnow()
            )
            
            if agent:
                # Handle streaming response from agent
                agent_response = await agent.handle(context)
                
                # Handle agent response with proper type checking
                from collections.abc import AsyncIterator
                if isinstance(agent_response, AsyncIterator):
                    # It's an AsyncIterator[str] - streaming response
                    logger.info("Processing streaming response from agent")
                    response_chunks = []
                    async for chunk in agent_response:
                        response_chunks.append(chunk)
                        if chunk.strip():
                            yield f"data: {json.dumps({'type': 'delta', 'delta': chunk})}\n\n"
                            await asyncio.sleep(0.01)  # Small delay for smooth streaming
                    full_response = ''.join(response_chunks)
                else:
                    # It's an AgentResponse object
                    logger.info("Processing non-streaming response from agent") 
                    full_response = agent_response.content
                    # Stream the response word by word for better UX
                    words = full_response.split()
                    for word in words:
                        yield f"data: {json.dumps({'type': 'delta', 'delta': word + ' '})}\n\n"
                        await asyncio.sleep(0.03)  # Small delay between chunks
                    # Stream the response word by word for better UX
                    words = full_response.split()
                    for word in words:
                        yield f"data: {json.dumps({'type': 'delta', 'delta': word + ' '})}\n\n"
                        await asyncio.sleep(0.03)  # Small delay between chunks
            else:
                # Fallback if agent not found
                fallback_response = f"I received your query: '{query}'. This is a response from the {agent_type} agent."
                full_response = fallback_response
                words = fallback_response.split()
                for word in words:
                    yield f"data: {json.dumps({'type': 'delta', 'delta': word + ' '})}\n\n"
                    await asyncio.sleep(0.05)
                    
        except (ValueError, RuntimeError, asyncio.TimeoutError) as agent_error:
            logger.warning(f"Agent processing failed, using fallback: {agent_error}")
            # Fallback response if agent processing fails
            fallback_response = f"I received your query: '{query}'. This is a response from the {selected_agent} agent."
            full_response = fallback_response
            words = fallback_response.split()
            for word in words:
                yield f"data: {json.dumps({'type': 'delta', 'delta': word + ' '})}\n\n"
                await asyncio.sleep(0.05)
        
        # Save assistant response
        if full_response.strip():
            await save_message_to_redis(
                redis, 
                session_id, 
                "assistant", 
                full_response,
                selected_agent
            )
        
        # Emit completion
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
    except (asyncio.TimeoutError, ValueError, RuntimeError) as e:
        logger.exception(f"Error in optimized_event_stream: {e}")
        yield f"data: {json.dumps({'type': 'error', 'delta': f'Error: {str(e)}'})}\n\n"

@router.post("/query")
async def agent_query(
    request: Request, 
    background_tasks: BackgroundTasks,
    user: DevFriendlyUser,
    redis: RedisClient,
    router_chain: RouterChainDep
):
    """Process a chat query through the intelligent router."""
    try:
        # Schedule cache cleanup
        background_tasks.add_task(clean_cache)
        
        # Track processing time
        start_time = time.time()
        
        # Get request data
        body = await request.json()
        query = body.get('query', body.get('prompt', '')).strip()  # Support both 'query' and 'prompt' fields
        session_id = body.get('session_id') or str(uuid.uuid4())
        stream = body.get('stream', True)  # Default to streaming
        explicit_agent = body.get('explicit_agent') or body.get('agent')  # Extract explicit agent selection
        
        # Get user ID
        user_id = user.get('user_id', user.get('oid', user.get('sub', user.get('id', 'unknown'))))
        
        # Get client-related headers
        client_id = request.headers.get('x-client-id', 'unknown')
        message_count = request.headers.get('x-message-count', '0')
        
        if not query:
            raise HTTPException(status_code=400, detail="Query is required.")

        logger.info(f"Processing query from client {client_id}: '{query}' (message #{message_count})")
        
        # Generate cache key from query
        cache_key = query.lower()
        
        # Check cache for exact query match (only for short, frequent queries)
        if len(query) < 50 and cache_key in query_cache and time.time() - query_cache[cache_key]['timestamp'] < CACHE_TTL:
            logger.info(f"Cache hit for query: {query}")
            cached_response = query_cache[cache_key]['response']
            
            async def cached_stream():
                await asyncio.sleep(0.2)  # Small delay to avoid rate limiting
                for chunk in cached_response:
                    yield f"data: {chunk}\n\n"
                    await asyncio.sleep(0.05)
            
            logger.info(f"Returning cached response in {time.time() - start_time:.2f}s")
            return StreamingResponse(
                cached_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache, no-transform",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        
        # For non-cached queries, process based on stream parameter
        logger.info(f"Cache miss, processing query: {query} (stream={stream})")
        
        # Add special handling for numeric inputs which are likely clarification responses
        is_numeric_input = query.isdigit()
        if is_numeric_input:
            logger.info(f"Detected numeric input '{query}', treating as clarification response")
        
        if stream:
            # Use the optimized event stream with correct headers for SSE
            return StreamingResponse(
                optimized_event_stream(session_id, query, router_chain, redis, user_id, stream, explicit_agent), 
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache, no-transform",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"  # Disable proxy buffering
                }
            )
        else:
            # Process non-streaming request and return JSON response
            response_data = await process_non_streaming_query(session_id, query, router_chain, redis, user_id, explicit_agent)
            return response_data

    except (HTTPException, ValueError, RuntimeError, asyncio.TimeoutError) as e:
        logger.exception(f"Error processing query: {e}")
        # Return a properly formatted error response
        error_message = str(e)
        async def error_stream():
            yield f"data: {json.dumps({'type': 'error', 'delta': f'Server error: {error_message}'})}\n\n"
        
        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for the agent service."""
    try:
        start_time = time.time()
        
        # Basic availability check
        is_available = True
        
        # Test external service connectivity if needed
        azure_client_status = "not_tested"
        azure_client_message = "Health check completed without external tests"
        
        # You can add more specific health checks here
        # For example, checking Azure OpenAI connectivity:
        
        try:
            # Check environment variables for Azure OpenAI
            azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
            azure_api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
            azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
            
            if azure_endpoint and azure_api_key and azure_deployment:
                azure_client_status = "configured"
                azure_client_message = "Azure OpenAI configuration found"
            else:
                azure_client_status = "not_configured"
                azure_client_message = "Azure OpenAI credentials not found in environment"
                
        except (KeyError, ValueError, OSError) as azure_e:
            azure_client_status = "error"
            azure_client_message = f"Azure OpenAI test failed: {str(azure_e)}"
            logger.warning(f"Health check - Azure test failed: {azure_e}")
        
        response_time = time.time() - start_time
        
        return {
            "status": "ok" if is_available else "error",
            "message": "Agent service is available" if is_available else "Agent service not initialized",
            "timestamp": str(datetime.datetime.now()),
            "response_time_ms": round(response_time * 1000, 2),
            "azure_client_status": azure_client_status,
            "azure_client_message": azure_client_message
        }
        
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception(f"Health check error: {e}")
        return {
            "status": "error",
            "message": f"Health check failed: {str(e)}",
            "timestamp": str(datetime.datetime.now()),
            "azure_client_status": "error",
            "azure_client_message": f"Error during health check: {str(e)}"
        }
