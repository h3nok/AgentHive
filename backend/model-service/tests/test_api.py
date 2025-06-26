"""Test API endpoints."""
import json
import pytest
from fastapi import status

# Test data
TEST_PROMPT = "This is a test prompt"
TEST_MODEL = "test-model"
TEST_TEMPERATURE = 0.7
TEST_MAX_TOKENS = 100

# Test the completion endpoint
def test_create_completion(test_client, mock_provider, monkeypatch):
    """Test the completion endpoint."""
    # Mock the provider
    monkeypatch.setattr("app.api.dependencies.get_model_provider", lambda: mock_provider)
    
    # Test request
    response = test_client.post(
        "/api/v1/completions",
        json={
            "prompt": TEST_PROMPT,
            "model": TEST_MODEL,
            "temperature": TEST_TEMPERATURE,
            "max_tokens": TEST_MAX_TOKENS,
            "stream": False
        },
        headers={"Authorization": "Bearer test-token"}
    )
    
    # Assertions
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "content" in data
    assert data["model"] == "test-model"
    assert "usage" in data
    assert "metadata" in data
    
    # Verify the provider was called with the correct arguments
    mock_provider.generate.assert_awaited_once_with(
        prompt=TEST_PROMPT,
        model=TEST_MODEL,
        temperature=TEST_TEMPERATURE,
        max_tokens=TEST_MAX_TOKENS
    )

# Test the streaming endpoint
def test_stream_completion(test_client, mock_provider, monkeypatch):
    """Test the streaming completion endpoint."""
    # Mock the provider
    monkeypatch.setattr("app.api.dependencies.get_model_provider", lambda: mock_provider)
    
    # Test request
    with test_client.stream(
        "POST",
        "/api/v1/completions",
        json={
            "prompt": TEST_PROMPT,
            "model": TEST_MODEL,
            "temperature": TEST_TEMPERATURE,
            "max_tokens": TEST_MAX_TOKENS,
            "stream": True
        },
        headers={"Authorization": "Bearer test-token"}
    ) as response:
        # Assertions
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "text/event-stream"
        
        # Collect chunks
        chunks = []
        for line in response.iter_lines():
            if line:
                chunks.append(line)
        
        # Verify we received the expected chunks
        assert len(chunks) > 0
        for chunk in chunks:
            assert chunk.startswith("data: ")
            data = json.loads(chunk[6:])  # Remove 'data: ' prefix
            assert "choices" in data or data == "[DONE]"
    
    # Verify the provider was called with the correct arguments
    mock_provider.generate_stream.assert_awaited_once_with(
        prompt=TEST_PROMPT,
        model=TEST_MODEL,
        temperature=TEST_TEMPERATURE,
        max_tokens=TEST_MAX_TOKENS
    )

# Test the models endpoint
def test_list_models(test_client, mock_provider, monkeypatch):
    """Test the models endpoint."""
    # Mock the provider
    monkeypatch.setattr("app.api.dependencies.get_model_provider", lambda: mock_provider)
    
    # Test request
    response = test_client.get(
        "/api/v1/models",
        headers={"Authorization": "Bearer test-token"}
    )
    
    # Assertions
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "object" in data
    assert data["object"] == "list"
    assert "data" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0

# Test authentication
def test_authentication(test_client):
    """Test that authentication is required."""
    # Test without authorization header
    response = test_client.post(
        "/api/v1/completions",
        json={"prompt": "test", "model": "test"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    
    # Test with invalid token
    response = test_client.post(
        "/api/v1/completions",
        json={"prompt": "test", "model": "test"},
        headers={"Authorization": "InvalidToken"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
