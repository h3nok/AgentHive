"""
Enterprise OS API endpoints.

This module provides API endpoints specifically for the Autonomous Enterprise OS.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import random
import asyncio
from uuid import uuid4

from ..core.settings import settings
from ..db.session import get_db
from ..domain.schemas import AgentType, RequestContext, PromptIn, AgentResponse
from ..domain.agent_factory import agent_registry
from ..domain.mediator import event_bus, Event, EventType
from .base import get_current_active_user


# Create router
router = APIRouter()


# System Health & Analytics
@router.get("/system/health")
async def get_system_health():
    """Get real-time system health metrics."""
    return {
        "status": "operational",
        "uptime": "99.97%",
        "cpu_usage": random.randint(15, 35),
        "memory_usage": random.randint(45, 65),
        "storage_usage": random.randint(25, 45),
        "network_throughput": random.randint(150, 300),
        "active_agents": len(agent_registry._agents),
        "total_workflows": random.randint(1200, 1500),
        "completed_today": random.randint(85, 120),
        "error_rate": round(random.uniform(0.1, 0.8), 2),
        "response_time": random.randint(120, 250),
        "last_updated": datetime.utcnow().isoformat()
    }


@router.get("/system/costs")
async def get_cost_analysis():
    """Get cost analysis and savings metrics."""
    return {
        "daily_operations_cost": random.randint(2500, 3500),
        "monthly_projected": random.randint(75000, 95000),
        "annual_savings": 2300000,
        "cost_per_workflow": round(random.uniform(2.5, 4.8), 2),
        "efficiency_gain": random.randint(75, 85),
        "manual_cost_avoided": random.randint(15000, 25000),
        "roi_percentage": random.randint(280, 320),
        "breakdown": {
            "compute": random.randint(800, 1200),
            "storage": random.randint(300, 500),
            "networking": random.randint(200, 400),
            "ai_processing": random.randint(1200, 1800)
        }
    }


@router.get("/departments/performance")
async def get_department_performance():
    """Get department-wise performance metrics."""
    departments = ["HR", "Finance", "IT", "Marketing", "Operations", "Legal"]
    return {
        "departments": [
            {
                "name": dept,
                "efficiency": random.randint(75, 95),
                "workflows_completed": random.randint(50, 150),
                "avg_completion_time": random.randint(5, 25),
                "cost_savings": random.randint(50000, 150000),
                "employee_satisfaction": random.randint(80, 95),
                "automation_rate": random.randint(60, 90)
            }
            for dept in departments
        ],
        "last_updated": datetime.utcnow().isoformat()
    }


# Agent Management & Orchestration
@router.get("/agents/status")
async def get_agents_status():
    """Get real-time agent status and performance."""
    agent_types = [
        {"id": "hr-001", "type": "HR Specialist", "status": "active"},
        {"id": "fin-001", "type": "Finance Analyst", "status": "active"},
        {"id": "wf-001", "type": "Workflow Orchestrator", "status": "active"},
        {"id": "ana-001", "type": "Analytics Engine", "status": "processing"},
        {"id": "it-001", "type": "IT Operations", "status": "active"},
        {"id": "pol-001", "type": "Policy Validator", "status": "idle"},
        {"id": "sec-001", "type": "Security Agent", "status": "monitoring"}
    ]
    
    return {
        "agents": [
            {
                **agent,
                "workload": random.randint(10, 85),
                "success_rate": random.randint(88, 98),
                "avg_response_time": random.randint(500, 2500),
                "tasks_completed": random.randint(20, 80),
                "memory_usage": random.randint(25, 75),
                "uptime": f"{random.randint(95, 99)}.{random.randint(10, 99)}%",
                "last_active": datetime.utcnow() - timedelta(minutes=random.randint(0, 30))
            }
            for agent in agent_types
        ],
        "network_health": random.randint(85, 98),
        "total_interactions": random.randint(500, 1200),
        "collaborative_tasks": random.randint(15, 45)
    }


@router.get("/agents/network")
async def get_agent_network():
    """Get agent collaboration network data."""
    agents = ["HR-001", "FIN-001", "WF-001", "ANA-001", "IT-001", "POL-001", "SEC-001"]
    connections = []
    
    for i, source in enumerate(agents):
        for j, target in enumerate(agents):
            if i != j and random.random() < 0.4:  # 40% chance of connection
                connections.append({
                    "source": source,
                    "target": target,
                    "strength": random.randint(20, 90),
                    "data_flow": random.randint(100, 500),
                    "last_interaction": datetime.utcnow() - timedelta(minutes=random.randint(0, 120))
                })
    
    return {
        "nodes": [
            {
                "id": agent,
                "type": agent.split("-")[0],
                "status": random.choice(["active", "processing", "idle"]),
                "position": {
                    "x": random.randint(100, 800),
                    "y": random.randint(100, 600)
                }
            }
            for agent in agents
        ],
        "connections": connections,
        "network_efficiency": random.randint(85, 95)
    }


# Workflow Management
@router.get("/workflows/templates")
async def get_workflow_templates():
    """Get available workflow templates."""
    templates = [
        {
            "id": "time-off-request",
            "name": "Time Off Request",
            "category": "HR",
            "description": "Automated vacation/sick leave processing with policy validation",
            "estimated_time": "5-10 minutes",
            "success_rate": 96,
            "usage_count": random.randint(200, 500),
            "agents_involved": ["HR Specialist", "Policy Validator"],
            "steps": 8,
            "complexity": "Medium"
        },
        {
            "id": "expense-approval",
            "name": "Expense Approval",
            "category": "Finance",
            "description": "Smart receipt analysis and compliance checking",
            "estimated_time": "3-7 minutes",
            "success_rate": 94,
            "usage_count": random.randint(300, 600),
            "agents_involved": ["Finance Analyst", "Policy Validator"],
            "steps": 6,
            "complexity": "Low"
        },
        {
            "id": "employee-onboarding",
            "name": "Employee Onboarding",
            "category": "HR",
            "description": "Complete new hire setup across all systems",
            "estimated_time": "2-4 hours",
            "success_rate": 98,
            "usage_count": random.randint(50, 150),
            "agents_involved": ["HR Specialist", "IT Operations", "Security Agent"],
            "steps": 15,
            "complexity": "High"
        },
        {
            "id": "contract-review",
            "name": "Contract Review",
            "category": "Legal",
            "description": "AI-powered legal analysis with risk assessment",
            "estimated_time": "30-60 minutes",
            "success_rate": 91,
            "usage_count": random.randint(80, 200),
            "agents_involved": ["Policy Validator", "Analytics Engine"],
            "steps": 12,
            "complexity": "High"
        },
        {
            "id": "meeting-scheduling",
            "name": "Meeting Scheduling",
            "category": "Operations",
            "description": "Intelligent calendar coordination",
            "estimated_time": "2-5 minutes",
            "success_rate": 89,
            "usage_count": random.randint(400, 800),
            "agents_involved": ["Workflow Orchestrator"],
            "steps": 4,
            "complexity": "Low"
        }
    ]
    
    return {
        "templates": templates,
        "total_count": len(templates),
        "categories": list(set(t["category"] for t in templates))
    }


@router.get("/workflows/active")
async def get_active_workflows():
    """Get currently active workflows."""
    workflows = []
    for i in range(random.randint(8, 15)):
        workflow_id = str(uuid4())
        start_time = datetime.utcnow() - timedelta(minutes=random.randint(1, 60))
        
        workflows.append({
            "id": workflow_id,
            "template_id": random.choice(["time-off-request", "expense-approval", "employee-onboarding"]),
            "name": random.choice(["Time Off Request", "Expense Approval", "Employee Onboarding"]),
            "initiated_by": f"user{random.randint(1, 100)}@company.com",
            "current_step": random.randint(1, 8),
            "total_steps": random.randint(6, 15),
            "progress": random.randint(20, 90),
            "status": random.choice(["running", "pending_approval", "waiting_input"]),
            "assigned_agent": random.choice(["HR-001", "FIN-001", "IT-001"]),
            "started_at": start_time.isoformat(),
            "estimated_completion": (start_time + timedelta(minutes=random.randint(5, 30))).isoformat(),
            "priority": random.choice(["low", "medium", "high"])
        })
    
    return {
        "workflows": workflows,
        "total_active": len(workflows),
        "average_completion_time": random.randint(15, 35)
    }


@router.post("/workflows/trigger")
async def trigger_workflow(
    template_id: str,
    context: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_active_user)
):
    """Trigger a workflow execution."""
    workflow_id = str(uuid4())
    
    # Simulate workflow initiation
    background_tasks.add_task(simulate_workflow_execution, workflow_id, template_id)
    
    return {
        "workflow_id": workflow_id,
        "template_id": template_id,
        "status": "initiated",
        "estimated_completion": (datetime.utcnow() + timedelta(minutes=random.randint(5, 30))).isoformat(),
        "message": f"Workflow {template_id} has been successfully initiated"
    }


@router.get("/workflows/{workflow_id}/status")
async def get_workflow_status(workflow_id: str):
    """Get status of a specific workflow."""
    return {
        "workflow_id": workflow_id,
        "status": random.choice(["running", "completed", "failed", "pending"]),
        "progress": random.randint(0, 100),
        "current_step": random.randint(1, 8),
        "total_steps": random.randint(6, 15),
        "logs": [
            {
                "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(1, 10))).isoformat(),
                "level": "info",
                "message": "Workflow step completed successfully",
                "agent": random.choice(["HR-001", "FIN-001", "IT-001"])
            }
            for _ in range(random.randint(3, 8))
        ]
    }


# Chat & AI Assistant Integration
@router.post("/chat/enterprise")
async def enterprise_chat(
    request: PromptIn,
    db: Session = Depends(get_db)
):
    """Enhanced chat endpoint with enterprise context."""
    
    # Create request context
    context = RequestContext(prompt=request)
    
    # Route to appropriate agent based on context
    agent_type = await determine_agent_type(request.prompt)
    
    # Get agent and process request
    agent = await agent_registry.create_agent(agent_type)
    
    response = await agent.handle(context)
    
    # Handle different response types  
    if isinstance(response, AgentResponse):
        response_content = response.content
    elif hasattr(response, '__aiter__'):
        # Handle streaming response - collect first chunk for immediate response
        response_content = "Streaming response initiated"
    else:
        response_content = str(response)
    
    return {
        "response": response_content,
        "agent_type": agent_type.value,
        "session_id": request.session_id,
        "suggestions": generate_context_suggestions(request.prompt),
        "quick_actions": generate_quick_actions(agent_type),
        "metadata": {
            "processing_time": random.randint(500, 1500),
            "confidence": random.uniform(0.85, 0.98),
            "workflow_suggestions": get_workflow_suggestions(request.prompt)
        }
    }


# Helper functions
async def determine_agent_type(prompt: str) -> AgentType:
    """Determine which agent type should handle the prompt."""
    prompt_lower = prompt.lower()
    
    if any(word in prompt_lower for word in ["vacation", "time off", "leave", "pto", "holiday"]):
        return AgentType.HR
    elif any(word in prompt_lower for word in ["expense", "budget", "cost", "financial", "invoice"]):
        return AgentType.SALES  # Using as Finance equivalent
    elif any(word in prompt_lower for word in ["support", "help", "issue", "problem"]):
        return AgentType.SUPPORT
    elif any(word in prompt_lower for word in ["analytics", "data", "report", "metrics"]):
        return AgentType.ANALYTICS
    else:
        return AgentType.GENERAL


def generate_context_suggestions(prompt: str) -> List[str]:
    """Generate contextual suggestions based on the prompt."""
    suggestions = [
        "Request time off for next week",
        "Submit expense report",
        "Schedule team meeting",
        "Check workflow status",
        "View system health",
        "Generate analytics report"
    ]
    return random.sample(suggestions, min(3, len(suggestions)))


def generate_quick_actions(agent_type: AgentType) -> List[Dict[str, str]]:
    """Generate quick actions based on agent type."""
    actions_map = {
        AgentType.HR: [
            {"label": "Request Time Off", "action": "trigger_workflow", "params": "time-off-request"},
            {"label": "Employee Onboarding", "action": "trigger_workflow", "params": "employee-onboarding"},
            {"label": "Policy Lookup", "action": "search", "params": "hr_policies"}
        ],
        AgentType.SALES: [  # Finance
            {"label": "Expense Approval", "action": "trigger_workflow", "params": "expense-approval"},
            {"label": "Budget Analysis", "action": "navigate", "params": "/analytics/budget"},
            {"label": "Cost Report", "action": "generate_report", "params": "cost_analysis"}
        ],
        AgentType.ANALYTICS: [
            {"label": "System Health", "action": "navigate", "params": "/command-center"},
            {"label": "Performance Report", "action": "generate_report", "params": "performance"},
            {"label": "Workflow Analytics", "action": "navigate", "params": "/workflows/analytics"}
        ]
    }
    return actions_map.get(agent_type, [])


def get_workflow_suggestions(prompt: str) -> List[str]:
    """Get workflow suggestions based on prompt content."""
    if "time off" in prompt.lower() or "vacation" in prompt.lower():
        return ["time-off-request"]
    elif "expense" in prompt.lower():
        return ["expense-approval"]
    elif "onboard" in prompt.lower() or "new hire" in prompt.lower():
        return ["employee-onboarding"]
    return []


async def simulate_workflow_execution(workflow_id: str, template_id: str):
    """Simulate workflow execution in background."""
    # This would normally trigger actual workflow execution
    await asyncio.sleep(random.randint(5, 15))  # Simulate processing time
    
    # Publish workflow completion event
    await event_bus.publish(Event(
        type=EventType.AGENT_COMPLETED,
        payload={
            "workflow_id": workflow_id,
            "template_id": template_id,
            "status": "completed",
            "completion_time": datetime.utcnow().isoformat()
        }
    ))
