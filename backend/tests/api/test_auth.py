"""
Authentication API tests.

This module provides tests for the authentication endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.db.models import User


@pytest.mark.asyncio
async def test_login(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test login endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Test login
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test login with wrong password."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Test login with wrong password
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test login with inactive user."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()

    # Test login with inactive user
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test register endpoint."""
    # Test register
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "new@example.com",
            "password": "newpassword",
            "full_name": "New User",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_existing_email(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test register with existing email."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Test register with existing email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "newpassword",
            "full_name": "New User",
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test get current user endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test get current user
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


@pytest.mark.asyncio
async def test_update_current_user(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test update current user endpoint."""
    # Create test user
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpassword"},
    )
    token = login_response.json()["access_token"]

    # Test update current user
    response = await client.put(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Updated User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Updated User" 