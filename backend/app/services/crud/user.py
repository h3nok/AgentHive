"""
User CRUD operations.

This module provides CRUD operations for users.
"""

from typing import Any, Dict, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.security import get_password_hash, verify_password
from app.domain.schemas import User, UserCreate, UserUpdate


async def get(db: AsyncSession, id: Union[UUID, str]) -> Optional[User]:
    """
    Get user by ID.

    Args:
        db: Database session
        id: User ID

    Returns:
        Optional[User]: User if found
    """
    result = await db.execute(select(User).filter(User.id == id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """
    Get user by email.

    Args:
        db: Database session
        email: User email

    Returns:
        Optional[User]: User if found
    """
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, *, obj_in: UserCreate) -> User:
    """
    Create new user.

    Args:
        db: Database session
        obj_in: User creation data

    Returns:
        User: Created user
    """
    db_obj = User(
        email=obj_in.email,
        hashed_password=get_password_hash(obj_in.password),
        full_name=obj_in.full_name,
        is_superuser=obj_in.is_superuser,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update(
    db: AsyncSession,
    *,
    db_obj: User,
    obj_in: Union[UserUpdate, Dict[str, Any]],
) -> User:
    """
    Update user.

    Args:
        db: Database session
        db_obj: User to update
        obj_in: User update data

    Returns:
        User: Updated user
    """
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    if update_data.get("password"):
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def authenticate(
    db: AsyncSession, *, email: str, password: str
) -> Optional[User]:
    """
    Authenticate user.

    Args:
        db: Database session
        email: User email
        password: User password

    Returns:
        Optional[User]: User if authenticated
    """
    user = await get_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def is_active(user: User) -> bool:
    """
    Check if user is active.

    Args:
        user: User to check

    Returns:
        bool: True if user is active
    """
    return user.is_active


async def is_superuser(user: User) -> bool:
    """
    Check if user is superuser.

    Args:
        user: User to check

    Returns:
        bool: True if user is superuser
    """
    return user.is_superuser 