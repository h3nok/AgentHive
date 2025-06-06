"""
Metrics API endpoints.

This module provides metrics-related API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from ..core.settings import settings
from ..db.session import get_db
from ..db.crud import (
    get_metrics,
    get_metrics_by_request_id,
    create_metrics,
    update_metrics,
    delete_metrics
)
from ..domain.schemas import (
    RequestMetrics as MetricsSchema,
    RequestMetricsCreate,
    RequestMetricsUpdate
)
from .base import get_current_active_user


# Create router
router = APIRouter()


@router.get("/metrics", response_model=List[MetricsSchema])
async def get_metrics_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> List[MetricsSchema]:
    """Get metrics list.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Current user
        
    Returns:
        List[MetricsSchema]: List of metrics
        
    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    metrics = get_metrics(db, skip, limit)
    return metrics


@router.post("/metrics", response_model=MetricsSchema)
async def create_new_metrics(
    metrics_in: RequestMetricsCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> MetricsSchema:
    """Create new metrics.
    
    Args:
        metrics_in: Metrics creation data
        db: Database session
        current_user: Current user
        
    Returns:
        MetricsSchema: Created metrics
    """
    metrics = create_metrics(
        db=db,
        request_id=metrics_in.request_id,
        session_id=metrics_in.session_id,
        user_id=current_user.id,
        agent_id=metrics_in.agent_id,
        success=metrics_in.success,
        error=metrics_in.error,
        token_usage=metrics_in.token_usage,
        latency=metrics_in.latency
    )
    return metrics


@router.get("/metrics/{metrics_id}", response_model=MetricsSchema)
async def get_metrics_by_id(
    metrics_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> MetricsSchema:
    """Get metrics by ID.
    
    Args:
        metrics_id: Metrics ID
        db: Database session
        current_user: Current user
        
    Returns:
        MetricsSchema: Metrics
        
    Raises:
        HTTPException: If metrics not found or user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    metrics = get_metrics(db, metrics_id)
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metrics not found"
        )
    return metrics


@router.get("/metrics/request/{request_id}", response_model=MetricsSchema)
async def get_metrics_by_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> MetricsSchema:
    """Get metrics by request ID.
    
    Args:
        request_id: Request ID
        db: Database session
        current_user: Current user
        
    Returns:
        MetricsSchema: Metrics
        
    Raises:
        HTTPException: If metrics not found or user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    metrics = get_metrics_by_request_id(db, request_id)
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metrics not found"
        )
    return metrics


@router.put("/metrics/{metrics_id}", response_model=MetricsSchema)
async def update_metrics_by_id(
    metrics_id: UUID,
    metrics_in: RequestMetricsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> MetricsSchema:
    """Update metrics by ID.
    
    Args:
        metrics_id: Metrics ID
        metrics_in: Metrics update data
        db: Database session
        current_user: Current user
        
    Returns:
        MetricsSchema: Updated metrics
        
    Raises:
        HTTPException: If metrics not found or user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    metrics = get_metrics(db, metrics_id)
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metrics not found"
        )
    metrics = update_metrics(db, metrics_id, metrics_in.dict(exclude_unset=True))
    return metrics


@router.delete("/metrics/{metrics_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_metrics_by_id(
    metrics_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> None:
    """Delete metrics by ID.
    
    Args:
        metrics_id: Metrics ID
        db: Database session
        current_user: Current user
        
    Raises:
        HTTPException: If metrics not found or user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    metrics = get_metrics(db, metrics_id)
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metrics not found"
        )
    delete_metrics(db, metrics_id) 