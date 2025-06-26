"""Test configuration and fixtures."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock

from app.main import create_application
from app.providers import BaseModelProvider, ModelResponse

@pytest.fixture
def test_app():
    """Create a test FastAPI application."""
    app = create_application()
    return app

@pytest.fixture
def test_client(test_app):
    """Create a test client for the FastAPI application."""
    with TestClient(test_app) as client:
        yield client

@pytest.fixture
def mock_provider():
    """Create a mock model provider."""
    mock = AsyncMock(spec=BaseModelProvider)
    
    # Mock the generate method
    mock.generate.return_value = ModelResponse(
        content="This is a test response",
        model="test-model",
        usage={"prompt_tokens": 5, "completion_tokens": 10, "total_tokens": 15},
        metadata={"test": "metadata"}
    )
    
    # Mock the stream generator
    async def mock_stream():
        yield {"content": "This "}
        yield {"content": "is "}
        yield {"content": "a "}
        yield {"content": "streamed "}
        yield {"content": "response"}
    
    mock.generate_stream.return_value = mock_stream()
    
    return mock
