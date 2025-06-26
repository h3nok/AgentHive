"""Tests for the Ollama provider."""
import json
import pytest
import httpx
from unittest.mock import AsyncMock, patch

from app.providers.ollama import OllamaProvider

# Test data
TEST_PROMPT = "This is a test prompt"
TEST_MODEL = "llama3"
TEST_TEMPERATURE = 0.7
TEST_MAX_TOKENS = 100

# Mock response data
MOCK_RESPONSE = {
    "model": "llama3",
    "created_at": "2023-08-04T19:22:45.499127Z",
    "response": "This is a test response",
    "done": True,
    "context": [1, 2, 3],
    "total_duration": 500000000,
    "load_duration": 100000000,
    "prompt_eval_count": 5,
    "eval_count": 10,
    "eval_duration": 300000000
}

@pytest.fixture
def ollama_provider():
    """Create an Ollama provider instance for testing."""
    return OllamaProvider(base_url="http://test-ollama:11434")

@pytest.mark.asyncio
async def test_generate(ollama_provider):
    """Test the generate method."""
    # Mock the HTTP client
    mock_client = AsyncMock()
    mock_response = AsyncMock()
    mock_response.json.return_value = MOCK_RESPONSE
    mock_client.post.return_value = mock_response
    
    # Patch the client
    with patch.object(ollama_provider, 'client', mock_client):
        # Call the method
        response = await ollama_provider.generate(
            prompt=TEST_PROMPT,
            model=TEST_MODEL,
            temperature=TEST_TEMPERATURE,
            max_tokens=TEST_MAX_TOKENS
        )
        
        # Assertions
        assert response.content == MOCK_RESPONSE["response"]
        assert response.model == TEST_MODEL
        assert response.usage["prompt_tokens"] == MOCK_RESPONSE["prompt_eval_count"]
        assert response.usage["completion_tokens"] == MOCK_RESPONSE["eval_count"]
        
        # Verify the client was called with the correct arguments
        mock_client.post.assert_awaited_once_with(
            "/api/generate",
            json={
                "model": TEST_MODEL,
                "prompt": TEST_PROMPT,
                "temperature": TEST_TEMPERATURE,
                "max_tokens": TEST_MAX_TOKENS,
                "stream": False
            }
        )

@pytest.mark.asyncio
async def test_generate_stream(ollama_provider):
    """Test the generate_stream method."""
    # Create a mock streaming response
    class MockStreamResponse:
        def __init__(self, chunks):
            self.chunks = chunks
            self.index = 0
        
        async def __aiter__(self):
            return self
            
        async def __anext__(self):
            if self.index < len(self.chunks):
                chunk = self.chunks[self.index]
                self.index += 1
                return chunk
            raise StopAsyncIteration
    
    # Create test chunks
    chunks = [
        {"response": "This", "done": False},
        {"response": " is", "done": False},
        {"response": " a", "done": False},
        {"response": " test", "done": False},
        {"response": " response", "done": True}
    ]
    
    # Create mock client
    mock_client = AsyncMock()
    mock_client.stream.return_value.__aenter__.return_value = MockStreamResponse(chunks)
    
    # Patch the client
    with patch.object(ollama_provider, 'client', mock_client):
        # Call the method and collect results
        results = []
        async for chunk in ollama_provider.generate_stream(
            prompt=TEST_PROMPT,
            model=TEST_MODEL,
            temperature=TEST_TEMPERATURE,
            max_tokens=TEST_MAX_TOKENS
        ):
            results.append(chunk)
        
        # Assertions
        assert len(results) == 5  # 5 chunks
        assert all(isinstance(chunk, dict) for chunk in results)
        
        # Verify the client was called with the correct arguments
        mock_client.stream.assert_called_once_with(
            "POST",
            "/api/generate",
            json={
                "model": TEST_MODEL,
                "prompt": TEST_PROMPT,
                "temperature": TEST_TEMPERATURE,
                "max_tokens": TEST_MAX_TOKENS,
                "stream": True
            }
        )

@pytest.mark.asyncio
async def test_close(ollama_provider):
    """Test the close method."""
    # Create a mock client with an aclose method
    mock_client = AsyncMock()
    
    # Patch the client
    with patch.object(ollama_provider, 'client', mock_client):
        # Call the method
        await ollama_provider.close()
        
        # Verify the client's aclose method was called
        mock_client.aclose.assert_awaited_once()

@pytest.mark.asyncio
async def test_http_error_handling(ollama_provider):
    """Test error handling for HTTP errors."""
    # Create a mock client that raises an HTTP error
    mock_client = AsyncMock()
    mock_response = AsyncMock()
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Test error",
        request=mock_client,
        response=mock_response
    )
    mock_client.post.return_value = mock_response
    
    # Patch the client
    with patch.object(ollama_provider, 'client', mock_client):
        # Verify the error is raised
        with pytest.raises(Exception) as exc_info:
            await ollama_provider.generate(
                prompt=TEST_PROMPT,
                model=TEST_MODEL
            )
        
        assert "Ollama API error" in str(exc_info.value)
