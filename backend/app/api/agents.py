"""
Agent API endpoints.

This module provides agent-related API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from ..core.settings import settings
from ..db.session import get_db
from ..db.crud import (
    get_agent,
    get_agents,
    create_agent,
    update_agent,
    delete_agent
)
from ..domain.schemas import (
    Agent as AgentSchema,
    AgentCreate,
    AgentUpdate,
    AgentType
)
from .base import get_current_active_user


# Create router
router = APIRouter()


@router.get("/agents", response_model=List[AgentSchema])
async def get_agent_list(
    agent_type: Optional[AgentType] = None,
    enabled: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> List[AgentSchema]:
    """Get agent list.
    
    Args:
        agent_type: Filter by agent type
        enabled: Filter by enabled status
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Current user
        
    Returns:
        List[AgentSchema]: List of agents
    """
    agents = get_agents(db, agent_type, enabled, skip, limit)
    return agents


@router.post("/agents", response_model=AgentSchema)
async def create_new_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> AgentSchema:
    """Create new agent.
    
    Args:
        agent_in: Agent creation data
        db: Database session
        current_user: Current user
        
    Returns:
        AgentSchema: Created agent
        
    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    agent = create_agent(
        db=db,
        agent_type=agent_in.agent_type,
        name=agent_in.name,
        version=agent_in.version,
        description=agent_in.description,
        enabled=agent_in.enabled,
        load_order=agent_in.load_order,
        capabilities=agent_in.capabilities,
        config=agent_in.config
    )
    return agent


@router.get("/agents/{agent_id}", response_model=AgentSchema)
async def get_agent_by_id(
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> AgentSchema:
    """Get agent by ID.
    
    Args:
        agent_id: Agent ID
        db: Database session
        current_user: Current user
        
    Returns:
        AgentSchema: Agent
        
    Raises:
        HTTPException: If agent not found
    """
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    return agent


@router.put("/agents/{agent_id}", response_model=AgentSchema)
async def update_agent_by_id(
    agent_id: UUID,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> AgentSchema:
    """Update agent by ID.
    
    Args:
        agent_id: Agent ID
        agent_in: Agent update data
        db: Database session
        current_user: Current user
        
    Returns:
        AgentSchema: Updated agent
        
    Raises:
        HTTPException: If agent not found or user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    agent = update_agent(db, agent_id, agent_in.dict(exclude_unset=True))
    return agent


@router.delete("/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_by_id(
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> None:
    """Delete agent by ID.
    
    Args:
        agent_id: Agent ID
        db: Database session
        current_user: Current user
        
    Raises:
        HTTPException: If agent not found or user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    delete_agent(db, agent_id) 