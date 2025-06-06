"""
Agents API tests.

This module provides tests for the agents endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.db.models import User, Agent


@pytest.mark.asyncio
async def test_get_agent_list(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test get agent list endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Create test agent
    agent = Agent(
        name="Test Agent",
        description="Test Description",
        agent_type="test",
        config={"key": "value"},
        is_enabled=True,
    )
    db_session.add(agent)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test get agent list
    response = await client.get(
        "/api/v1/agents/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test Agent"
    assert data[0]["description"] == "Test Description"


@pytest.mark.asyncio
async def test_create_agent(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test create agent endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test create agent
    response = await client.post(
        "/api/v1/agents/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "New Agent",
            "description": "New Description",
            "agent_type": "test",
            "config": {"key": "value"},
            "is_enabled": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Agent"
    assert data["description"] == "New Description"
    assert data["agent_type"] == "test"
    assert data["config"] == {"key": "value"}
    assert data["is_enabled"] is True


@pytest.mark.asyncio
async def test_get_agent_by_id(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test get agent by ID endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Create test agent
    agent = Agent(
        name="Test Agent",
        description="Test Description",
        agent_type="test",
        config={"key": "value"},
        is_enabled=True,
    )
    db_session.add(agent)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test get agent by ID
    response = await client.get(
        f"/api/v1/agents/{agent.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Agent"
    assert data["description"] == "Test Description"
    assert data["agent_type"] == "test"
    assert data["config"] == {"key": "value"}
    assert data["is_enabled"] is True


@pytest.mark.asyncio
async def test_update_agent(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test update agent endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Create test agent
    agent = Agent(
        name="Test Agent",
        description="Test Description",
        agent_type="test",
        config={"key": "value"},
        is_enabled=True,
    )
    db_session.add(agent)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test update agent
    response = await client.put(
        f"/api/v1/agents/{agent.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Updated Agent",
            "description": "Updated Description",
            "agent_type": "test",
            "config": {"key": "new_value"},
            "is_enabled": False,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Agent"
    assert data["description"] == "Updated Description"
    assert data["agent_type"] == "test"
    assert data["config"] == {"key": "new_value"}
    assert data["is_enabled"] is False


@pytest.mark.asyncio
async def test_delete_agent(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test delete agent endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Create test agent
    agent = Agent(
        name="Test Agent",
        description="Test Description",
        agent_type="test",
        config={"key": "value"},
        is_enabled=True,
    )
    db_session.add(agent)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test delete agent
    response = await client.delete(
        f"/api/v1/agents/{agent.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    # Verify agent is deleted
    response = await client.get(
        f"/api/v1/agents/{agent.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404 