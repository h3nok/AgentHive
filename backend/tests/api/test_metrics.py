"""
Metrics API tests.

This module provides tests for the metrics endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.core.security import get_password_hash
from app.db.models import User, Agent, RequestMetrics


@pytest.mark.asyncio
async def test_get_metrics_list(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test get metrics list endpoint."""
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

    # Create test metrics
    metrics = RequestMetrics(
        request_id=uuid4(),
        agent_id=agent.id,
        processing_time=1.0,
        token_count=100,
        cost=0.1,
        success=True,
    )
    db_session.add(metrics)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test get metrics list
    response = await client.get(
        "/api/v1/metrics/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["processing_time"] == 1.0
    assert data[0]["token_count"] == 100
    assert data[0]["cost"] == 0.1
    assert data[0]["success"] is True


@pytest.mark.asyncio
async def test_create_metrics(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test create metrics endpoint."""
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

    # Test create metrics
    request_id = uuid4()
    response = await client.post(
        "/api/v1/metrics/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "request_id": str(request_id),
            "agent_id": str(agent.id),
            "processing_time": 1.0,
            "token_count": 100,
            "cost": 0.1,
            "success": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == str(request_id)
    assert data["agent_id"] == str(agent.id)
    assert data["processing_time"] == 1.0
    assert data["token_count"] == 100
    assert data["cost"] == 0.1
    assert data["success"] is True


@pytest.mark.asyncio
async def test_get_metrics_by_id(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test get metrics by ID endpoint."""
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

    # Create test metrics
    metrics = RequestMetrics(
        request_id=uuid4(),
        agent_id=agent.id,
        processing_time=1.0,
        token_count=100,
        cost=0.1,
        success=True,
    )
    db_session.add(metrics)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test get metrics by ID
    response = await client.get(
        f"/api/v1/metrics/{metrics.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == str(metrics.request_id)
    assert data["agent_id"] == str(agent.id)
    assert data["processing_time"] == 1.0
    assert data["token_count"] == 100
    assert data["cost"] == 0.1
    assert data["success"] is True


@pytest.mark.asyncio
async def test_get_metrics_by_request(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test get metrics by request ID endpoint."""
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

    # Create test metrics
    request_id = uuid4()
    metrics = RequestMetrics(
        request_id=request_id,
        agent_id=agent.id,
        processing_time=1.0,
        token_count=100,
        cost=0.1,
        success=True,
    )
    db_session.add(metrics)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test get metrics by request ID
    response = await client.get(
        f"/api/v1/metrics/request/{request_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == str(request_id)
    assert data["agent_id"] == str(agent.id)
    assert data["processing_time"] == 1.0
    assert data["token_count"] == 100
    assert data["cost"] == 0.1
    assert data["success"] is True


@pytest.mark.asyncio
async def test_update_metrics(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test update metrics endpoint."""
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

    # Create test metrics
    metrics = RequestMetrics(
        request_id=uuid4(),
        agent_id=agent.id,
        processing_time=1.0,
        token_count=100,
        cost=0.1,
        success=True,
    )
    db_session.add(metrics)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test update metrics
    response = await client.put(
        f"/api/v1/metrics/{metrics.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "processing_time": 2.0,
            "token_count": 200,
            "cost": 0.2,
            "success": False,
            "error_message": "Test error",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["processing_time"] == 2.0
    assert data["token_count"] == 200
    assert data["cost"] == 0.2
    assert data["success"] is False
    assert data["error_message"] == "Test error"


@pytest.mark.asyncio
async def test_delete_metrics(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test delete metrics endpoint."""
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

    # Create test metrics
    metrics = RequestMetrics(
        request_id=uuid4(),
        agent_id=agent.id,
        processing_time=1.0,
        token_count=100,
        cost=0.1,
        success=True,
    )
    db_session.add(metrics)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test delete metrics
    response = await client.delete(
        f"/api/v1/metrics/{metrics.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    # Verify metrics is deleted
    response = await client.get(
        f"/api/v1/metrics/{metrics.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404 