import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_not_found_returns_json():
    """Calling an undefined route should return JSON error payload with request_id"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/non-existent")
    assert response.status_code == 404
    data = response.json()
    assert data["error_code"] == 404
    assert "detail" in data
    assert "request_id" in data 