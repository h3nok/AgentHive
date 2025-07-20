"""
Main FastAPI application with lifespan management.

This module creates and configures the FastAPI application instance.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
from datetime import datetime
from pathlib import Path

from app.core.settings import settings
from app.core.observability import (
    setup_structured_logging,
    setup_tracing,
    setup_metrics,
    get_logger,
    request_id_var
)
from app.core.errors import register_exception_handlers
from app.api.v1.router import router as v1_router
from app.adapters.queue_redis import redis_adapter
from app.domain.mediator import event_bus
from app.domain.agent_factory import agent_registry, initialize_builtin_agents
from app.domain.commands import initialize_command_handlers


logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown.
    
    Handles:
    - Service initialization
    - Plugin loading
    - Graceful shutdown
    """
    logger.info("Starting Intelligent Router API")
    
    # Setup observability
    setup_structured_logging()
    tracer_provider = setup_tracing()
    meter_provider = setup_metrics()
    
    # Initialize Redis
    try:
        await redis_adapter.connect()
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        # Continue without Redis in development
        if settings.ENVIRONMENT != "development":
            raise
    
    # Start event bus
    if redis_adapter._connected:
        event_bus.redis_adapter = redis_adapter
    await event_bus.start()
    
    # Initialize built-in agents
    await initialize_builtin_agents()
    
    # Initialize command handlers
    initialize_command_handlers()
    
    # Load plugins
    plugins_loaded = 0
    plugins_dir = Path(settings.plugins_dir)
    if plugins_dir.exists():
        for plugin_dir in plugins_dir.iterdir():
            if plugin_dir.is_dir() and (plugin_dir / "manifest.json").exists():
                if plugin_dir.name in settings.plugins_enabled:
                    agent_id = await agent_registry.load_plugin(plugin_dir)
                    if agent_id:
                        plugins_loaded += 1
                        logger.info(f"Loaded plugin: {plugin_dir.name}")
    
    logger.info(f"Loaded {plugins_loaded} plugins")
    
    # Set app state
    app.state.ready = True
    
    logger.info("Intelligent Router API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Intelligent Router API")
    
    # Stop event bus
    await event_bus.stop()
    
    # Disconnect from Redis
    await redis_adapter.disconnect()
    
    # Cleanup agents
    for agent_id in list(agent_registry._agents.keys()):
        await agent_registry.unload_agent(agent_id)
    
    # Shutdown tracing
    if tracer_provider:
        tracer_provider.shutdown()
    
    # Shutdown metrics
    if meter_provider:
        meter_provider.shutdown()
    
    logger.info("Intelligent Router API shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured application instance
    """
    # Create app with lifespan
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
    )
    
    # Add middleware
    
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # GZip compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Trusted host
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["*.yourdomain.com", "yourdomain.com"]
        )
    
    # Request ID middleware
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", "")
        if not request_id:
            import uuid
            request_id = str(uuid.uuid4())
        
        request_id_var.set(request_id)
        
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    # Register exception handlers
    register_exception_handlers(app)
    
    # Include routers
    # Mount API v1 router under /api to expose endpoints at /api/v1/*
    app.include_router(v1_router, prefix="/api")
    
    # Include debug routers for development/testing
    if settings.ENVIRONMENT in ["development", "test"]:
        try:
            # Include the simple debug router for basic chat testing
            from app.api.v1.debug_simple import debug_simple_router
            app.include_router(debug_simple_router, prefix="/api")
            logger.info("Included simple debug router")
        except Exception as e:
            logger.warning(f"Failed to include simple debug router: {e}")
        
        try:
            # Include the WebSocket debug router for router trace functionality
            from app.api.v1.debug_websocket import debug_websocket_router
            app.include_router(debug_websocket_router, prefix="/api")
            logger.info("Included WebSocket debug router")
        except Exception as e:
            logger.warning(f"Failed to include WebSocket debug router: {e}")
            
        try:
            # Include the test router for direct router chain testing
            from app.api.v1.test_router import test_router
            app.include_router(test_router, prefix="/api")
            logger.info("Included test router for router chain testing")
        except Exception as e:
            logger.warning(f"Failed to include test router: {e}")
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "ready" if hasattr(app.state, "ready") and app.state.ready else "starting"
        }
    
    # Health check
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
    
    # Simple debug health endpoint for testing
    @app.get("/debug/health")
    async def debug_health():
        return {"status": "debug_ok", "environment": settings.ENVIRONMENT}
    
    # Simple debug chat endpoint for testing  
    @app.post("/debug/chat")
    async def debug_chat(data: dict):
        return {
            "response": f"Debug response for: {data.get('prompt', 'no prompt')}",
            "debug": True,
            "timestamp": datetime.now().isoformat()
        }
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
        access_log=settings.DEBUG,
    ) 