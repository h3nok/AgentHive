"""FastAPI middleware to wrap unhandled exceptions in a uniform JSON envelope.

Any unhandled exception is transformed into a JSON response:
    { "code": "INTERNAL_ERROR", "message": "...", "traceId": "uuid" }

This makes frontend error-handling predictable and log aggregation simpler.
"""
from __future__ import annotations

import logging
import uuid
from typing import Callable, Awaitable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)


class ErrorWrapperMiddleware(BaseHTTPMiddleware):
    """Wrap exceptions and return JSON structure."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:  # noqa: D401
        trace_id = request.headers.get("x-trace-id", str(uuid.uuid4()))
        try:
            response = await call_next(request)
            return response
        except Exception as exc:  # pylint: disable=broad-except
            logger.exception("Unhandled error (traceId=%s): %s", trace_id, exc)
            return JSONResponse(
                status_code=500,
                content={
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred. Please try again later.",
                    "traceId": trace_id,
                },
            )
