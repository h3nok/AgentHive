"""
Global error handling and custom exceptions.

This module defines custom exception types and error handlers for the application.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional, Type
import traceback
from pydantic import BaseModel

from .observability import get_logger

logger = get_logger(__name__)


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None


# Custom Exception Classes
class BaseRouterException(Exception):
    """Base exception for all router-specific errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class AgentNotFoundException(BaseRouterException):
    """Raised when a requested agent is not found."""
    pass


class RoutingException(BaseRouterException):
    """Raised when routing decision fails."""
    pass


class AgentExecutionException(BaseRouterException):
    """Raised when agent execution fails."""
    pass


class RateLimitException(BaseRouterException):
    """Raised when rate limit is exceeded."""
    pass


class AuthenticationException(BaseRouterException):
    """Raised when authentication fails."""
    pass


class ValidationException(BaseRouterException):
    """Raised when input validation fails."""
    pass


class CircuitBreakerOpenException(BaseRouterException):
    """Raised when circuit breaker is open."""
    pass


class PluginNotFoundException(BaseRouterException):
    """Raised when a requested plugin is not found."""
    pass


class PluginInstallationError(BaseRouterException):
    """Raised when plugin installation fails."""
    pass


class PluginValidationError(BaseRouterException):
    """Raised when plugin validation fails."""
    pass


# Error Handlers
async def handle_router_exception(request: Request, exc: BaseRouterException) -> JSONResponse:
    """Handle router-specific exceptions."""
    logger.error(
        "Router exception occurred",
        exception=exc.__class__.__name__,
        message=exc.message,
        details=exc.details,
        path=request.url.path
    )
    
    # Map exceptions to HTTP status codes
    status_map = {
        AgentNotFoundException: status.HTTP_404_NOT_FOUND,
        RoutingException: status.HTTP_500_INTERNAL_SERVER_ERROR,
        AgentExecutionException: status.HTTP_500_INTERNAL_SERVER_ERROR,
        RateLimitException: status.HTTP_429_TOO_MANY_REQUESTS,
        AuthenticationException: status.HTTP_401_UNAUTHORIZED,
        ValidationException: status.HTTP_422_UNPROCESSABLE_ENTITY,
        CircuitBreakerOpenException: status.HTTP_503_SERVICE_UNAVAILABLE,
        PluginNotFoundException: status.HTTP_404_NOT_FOUND,
        PluginInstallationError: status.HTTP_500_INTERNAL_SERVER_ERROR,
        PluginValidationError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    }
    
    status_code = status_map.get(type(exc), status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(
            error=exc.__class__.__name__,
            message=exc.message,
            details=exc.details,
            request_id=getattr(request.state, "request_id", None)
        ).dict()
    )


async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    logger.error(
        "HTTP exception occurred",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTPException",
            message=str(exc.detail),
            request_id=getattr(request.state, "request_id", None)
        ).dict()
    )


async def handle_value_error(request: Request, exc: ValueError) -> JSONResponse:
    """Handle value errors."""
    logger.error(
        "Value error occurred",
        error=str(exc),
        path=request.url.path,
        traceback=traceback.format_exc()
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="ValueError",
            message=str(exc),
            request_id=getattr(request.state, "request_id", None)
        ).dict()
    )


async def handle_generic_exception(request: Request, exc: Exception) -> JSONResponse:
    """Handle all unhandled exceptions."""
    logger.error(
        "Unhandled exception occurred",
        exception=exc.__class__.__name__,
        error=str(exc),
        path=request.url.path,
        traceback=traceback.format_exc()
    )
    
    # Don't expose internal errors in production
    message = "An internal error occurred" if not hasattr(request.app.state, "debug") else str(exc)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="InternalServerError",
            message=message,
            request_id=getattr(request.state, "request_id", None)
        ).dict()
    )


def register_exception_handlers(app: Any) -> None:
    """Register all exception handlers with the FastAPI app."""
    # Router-specific exceptions
    app.add_exception_handler(BaseRouterException, handle_router_exception)
    app.add_exception_handler(AgentNotFoundException, handle_router_exception)
    app.add_exception_handler(RoutingException, handle_router_exception)
    app.add_exception_handler(AgentExecutionException, handle_router_exception)
    app.add_exception_handler(RateLimitException, handle_router_exception)
    app.add_exception_handler(AuthenticationException, handle_router_exception)
    app.add_exception_handler(ValidationException, handle_router_exception)
    app.add_exception_handler(CircuitBreakerOpenException, handle_router_exception)
    app.add_exception_handler(PluginNotFoundException, handle_router_exception)
    app.add_exception_handler(PluginInstallationError, handle_router_exception)
    app.add_exception_handler(PluginValidationError, handle_router_exception)
    
    # Standard exceptions
    app.add_exception_handler(HTTPException, handle_http_exception)
    app.add_exception_handler(ValueError, handle_value_error)
    
    # Catch-all handler
    app.add_exception_handler(Exception, handle_generic_exception)


# Utility functions for error handling
def create_error_response(
    error: str,
    message: str,
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> JSONResponse:
    """Create a standardized error response."""
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(
            error=error,
            message=message,
            details=details,
            request_id=request_id
        ).dict()
    )


def raise_for_status(response: Any, custom_message: Optional[str] = None) -> None:
    """Check response status and raise appropriate exception."""
    if hasattr(response, "status_code") and response.status_code >= 400:
        message = custom_message or f"Request failed with status {response.status_code}"
        
        if response.status_code == 404:
            raise AgentNotFoundException(message)
        elif response.status_code == 429:
            raise RateLimitException(message)
        elif response.status_code == 401:
            raise AuthenticationException(message)
        elif response.status_code == 422:
            raise ValidationException(message)
        else:
            raise BaseRouterException(message) 