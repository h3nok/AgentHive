import pytest
from httpx import AsyncClient

from app.main import app

@pytest.mark.asyncio
async def test_commits_endpoint_mock_mode():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        payload = {
            "token": "dummy",
            "owner": "demo-org",
            "repo": "demo-repo",
            "mock_mode": True
        }
        resp = await ac.post("/api/v1/connectors/github/commits", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["total"] == 2
        assert len(data["commits"]) == 2
        assert data["commits"][0]["message"] == "Initial commit"
