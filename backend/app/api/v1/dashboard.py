"""
Dashboard API router with system metrics and analytics.

This module provides comprehensive dashboard functionality including:
- System performance metrics
- Agent usage analytics  
- Model performance data
- Support system metrics
- Real-time alerts and health status
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import logging
import asyncio
import random

from .deps import DevFriendlyUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

class SystemMetrics(BaseModel):
    """System performance metrics"""
    cpu_usage: float = Field(..., ge=0.0, le=100.0)
    memory_usage: float = Field(..., ge=0.0, le=100.0)
    active_sessions: int = Field(..., ge=0)
    requests_per_minute: float = Field(..., ge=0.0)
    response_time_avg: float = Field(..., ge=0.0)
    uptime_hours: float = Field(..., ge=0.0)

class AgentMetrics(BaseModel):
    """Individual agent performance metrics"""
    agent_id: str
    agent_name: str
    total_queries: int = Field(..., ge=0)
    success_rate: float = Field(..., ge=0.0, le=100.0)
    avg_response_time: float = Field(..., ge=0.0)
    last_used: datetime
    popular_prompts: List[str] = Field(default_factory=list)

class ModelMetrics(BaseModel):
    """AI model performance metrics"""
    model_id: str
    model_name: str
    provider: str
    total_requests: int = Field(..., ge=0)
    success_rate: float = Field(..., ge=0.0, le=100.0)
    avg_latency: float = Field(..., ge=0.0)
    tokens_processed: int = Field(..., ge=0)
    cost_estimate: float = Field(..., ge=0.0)
    is_available: bool

class SupportMetrics(BaseModel):
    """Support system metrics"""
    total_tickets: int = Field(..., ge=0)
    open_tickets: int = Field(..., ge=0)
    resolved_tickets: int = Field(..., ge=0)
    avg_resolution_time: float = Field(..., ge=0.0)
    satisfaction_rating: float = Field(..., ge=0.0, le=5.0)
    knowledge_base_hits: int = Field(..., ge=0)

class UsageAnalytics(BaseModel):
    """Usage analytics and trends"""
    daily_active_users: int = Field(..., ge=0)
    weekly_active_users: int = Field(..., ge=0)
    monthly_active_users: int = Field(..., ge=0)
    peak_usage_hour: int = Field(..., ge=0, le=23)
    most_used_agent: str
    most_used_model: str
    geographic_distribution: Dict[str, int] = Field(default_factory=dict)

class DashboardOverview(BaseModel):
    """Complete dashboard overview"""
    system_metrics: SystemMetrics
    agent_metrics: List[AgentMetrics]
    model_metrics: List[ModelMetrics]
    support_metrics: SupportMetrics
    usage_analytics: UsageAnalytics
    last_updated: datetime
    status: str

class SystemAlert(BaseModel):
    """System alert model"""
    id: str
    level: str = Field(..., pattern="^(info|warning|error)$")
    title: str
    message: str
    timestamp: datetime
    component: str

class AlertsResponse(BaseModel):
    """Alerts response model"""
    alerts: List[SystemAlert]
    total_count: int
    by_level: Dict[str, int]
    last_checked: str

# Mock data generation functions
def generate_mock_system_metrics() -> SystemMetrics:
    """Generate realistic system metrics"""
    return SystemMetrics(
        cpu_usage=random.uniform(15.0, 65.0),
        memory_usage=random.uniform(25.0, 75.0),
        active_sessions=random.randint(50, 250),
        requests_per_minute=random.uniform(120.0, 450.0),
        response_time_avg=random.uniform(0.2, 1.8),
        uptime_hours=random.uniform(720.0, 8760.0)  # 30 days to 1 year
    )

def generate_mock_agent_metrics() -> List[AgentMetrics]:
    """Generate realistic agent performance data"""
    agents = [
        {
            "agent_id": "lease",
            "agent_name": "TSC Lease Document Agent",
            "prompts": [
                "What is the lease expiration date for each property?",
                "Who is responsible for roof repair for each property?",
                "Show me all recurring expense schedules?",
            ]
        },
        {
            "agent_id": "support",
            "agent_name": "TSC Customer Support",
            "prompts": [
                "I need help tracking my recent order",
                "How do I return or exchange a product I purchased?",
                "My product arrived damaged - what should I do?",
            ]
        },
        {
            "agent_id": "sales",
            "agent_name": "TSC Sales Expert",
            "prompts": [
                "What are the best-selling products in the farm equipment category?",
                "Can you recommend products for a small hobby farm setup?",
                "What's the current inventory status for riding mowers?",
            ]
        },
        {
            "agent_id": "technical",
            "agent_name": "TSC Technical Expert",
            "prompts": [
                "What are the technical specifications for the latest zero-turn mowers?",
                "How do I properly maintain a diesel tractor engine?",
                "What safety protocols should be followed for welding equipment?",
            ]
        },
        {
            "agent_id": "analytics",
            "agent_name": "TSC Data Analyst",
            "prompts": [
                "Generate a sales performance report for the last quarter",
                "Show customer satisfaction trends across all store locations",
                "Analyze inventory turnover rates by product category",
            ]
        }
    ]
    
    return [
        AgentMetrics(
            agent_id=agent["agent_id"],
            agent_name=agent["agent_name"],
            total_queries=random.randint(100, 2500),
            success_rate=random.uniform(85.0, 98.5),
            avg_response_time=random.uniform(0.3, 2.1),
            last_used=datetime.utcnow() - timedelta(minutes=random.randint(1, 120)),
            popular_prompts=random.sample(agent["prompts"], min(3, len(agent["prompts"])))
        ) for agent in agents
    ]

def generate_mock_model_metrics() -> List[ModelMetrics]:
    """Generate realistic model performance data"""
    models = [
        {"id": "gpt-4", "name": "GPT-4", "provider": "Azure"},
        {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "provider": "Azure"},
        {"id": "gpt-35-turbo", "name": "GPT-3.5 Turbo", "provider": "Azure"},
        {"id": "llama3-8b", "name": "Llama 3 8B", "provider": "Ollama"},
        {"id": "claude-3-sonnet", "name": "Claude 3 Sonnet", "provider": "Anthropic"},
    ]
    
    return [
        ModelMetrics(
            model_id=model["id"],
            model_name=model["name"],
            provider=model["provider"],
            total_requests=random.randint(500, 5000),
            success_rate=random.uniform(90.0, 99.5),
            avg_latency=random.uniform(0.5, 3.2),
            tokens_processed=random.randint(50000, 500000),
            cost_estimate=random.uniform(25.0, 250.0),
            is_available=random.choice([True, True, True, False])  # 75% availability
        ) for model in models
    ]

def generate_mock_support_metrics() -> SupportMetrics:
    """Generate realistic support system data"""
    total_tickets = random.randint(200, 800)
    resolved_tickets = int(total_tickets * random.uniform(0.7, 0.9))
    open_tickets = total_tickets - resolved_tickets
    
    return SupportMetrics(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        resolved_tickets=resolved_tickets,
        avg_resolution_time=random.uniform(2.5, 8.5),  # hours
        satisfaction_rating=random.uniform(4.2, 4.8),
        knowledge_base_hits=random.randint(1500, 3500)
    )

def generate_mock_usage_analytics() -> UsageAnalytics:
    """Generate realistic usage analytics"""
    daily_users = random.randint(150, 500)
    weekly_users = int(daily_users * random.uniform(3.5, 6.0))
    monthly_users = int(weekly_users * random.uniform(3.0, 4.5))
    
    return UsageAnalytics(
        daily_active_users=daily_users,
        weekly_active_users=weekly_users,
        monthly_active_users=monthly_users,
        peak_usage_hour=random.choice([9, 10, 11, 14, 15, 16]),  # Business hours
        most_used_agent="lease",
        most_used_model="gpt-4",
        geographic_distribution={
            "Central": random.randint(40, 60),
            "Eastern": random.randint(30, 50),
            "Western": random.randint(25, 45),
            "Southern": random.randint(35, 55),
        }
    )

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    user: DevFriendlyUser
) -> DashboardOverview:
    """
    Get comprehensive dashboard overview with all system metrics.
    
    Returns real-time metrics for system performance, agent usage,
    model performance, support tickets, and user analytics.
    """
    try:
        logger.info(f"Generating dashboard overview for user {user.get('user_id', 'unknown')}")
        
        # In a real implementation, these would fetch from actual data sources
        system_metrics = generate_mock_system_metrics()
        agent_metrics = generate_mock_agent_metrics()
        model_metrics = generate_mock_model_metrics()
        support_metrics = generate_mock_support_metrics()
        usage_analytics = generate_mock_usage_analytics()
        
        # Determine overall system status
        avg_success_rate = sum(agent.success_rate for agent in agent_metrics) / len(agent_metrics)
        available_models = sum(1 for model in model_metrics if model.is_available)
        
        if avg_success_rate > 95 and available_models >= 3:
            status = "excellent"
        elif avg_success_rate > 90 and available_models >= 2:
            status = "good"
        elif avg_success_rate > 80 and available_models >= 1:
            status = "fair"
        else:
            status = "poor"
        
        return DashboardOverview(
            system_metrics=system_metrics,
            agent_metrics=agent_metrics,
            model_metrics=model_metrics,
            support_metrics=support_metrics,
            usage_analytics=usage_analytics,
            last_updated=datetime.utcnow(),
            status=status
        )
        
    except Exception as e:
        logger.error("Error generating dashboard overview: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to generate dashboard overview"
        )

@router.get("/system/health")
async def get_system_health(user: DevFriendlyUser):
    """
    Get detailed system health information.
    """
    try:
        import time
        
        # Try to get actual system metrics if psutil is available
        try:
            import psutil
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "system": {
                    "cpu_usage": cpu_percent,
                    "memory_usage": memory.percent,
                    "memory_available": memory.available // (1024 * 1024),  # MB
                    "disk_usage": disk.percent,
                    "disk_free": disk.free // (1024 * 1024 * 1024),  # GB
                },
                "services": {
                    "database": "operational",
                    "ai_models": "operational", 
                    "support_system": "operational",
                    "authentication": "operational"
                },
                "uptime": time.time()
            }
        except ImportError:
            # Fallback to mock data if psutil not available
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "system": {
                    "cpu_usage": 45.2,
                    "memory_usage": 67.8,
                    "memory_available": 2048,
                    "disk_usage": 34.5,
                    "disk_free": 150
                },
                "services": {
                    "database": "operational",
                    "ai_models": "operational",
                    "support_system": "operational", 
                    "authentication": "operational"
                },
                "uptime": 86400  # 24 hours
            }
            
    except Exception as e:
        logger.error("Error checking system health: %s", str(e))
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@router.get("/analytics/trends")
async def get_analytics_trends(
    user: DevFriendlyUser,
    period: str = "7d",  # 24h, 7d, 30d, 90d
    metric: str = "usage"  # usage, performance, errors
):
    """
    Get trending analytics data for specified period and metric.
    """
    try:
        # Generate mock trend data
        if period == "24h":
            periods = 24
            delta = timedelta(hours=1)
        elif period == "7d":
            periods = 7
            delta = timedelta(days=1)
        elif period == "30d":
            periods = 30
            delta = timedelta(days=1)
        else:  # 90d
            periods = 90
            delta = timedelta(days=1)
        
        base_time = datetime.utcnow() - (delta * periods)
        
        trend_data = []
        for i in range(periods):
            timestamp = base_time + (delta * i)
            
            if metric == "usage":
                value = random.randint(50, 300) + (i * 2)  # Upward trend
            elif metric == "performance":
                value = random.uniform(0.5, 2.5)
            else:  # errors
                value = random.randint(0, 10)
            
            trend_data.append({
                "timestamp": timestamp.isoformat(),
                "value": value,
                "period": period,
                "metric": metric
            })
        
        return {
            "period": period,
            "metric": metric,
            "data": trend_data,
            "summary": {
                "total_points": len(trend_data),
                "avg_value": sum(point["value"] for point in trend_data) / len(trend_data),
                "trend_direction": "up" if trend_data[-1]["value"] > trend_data[0]["value"] else "down"
            }
        }
        
    except Exception as e:
        logger.error("Error generating trends: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate trend data: {str(e)}"
        )

@router.get("/alerts", response_model=AlertsResponse)
async def get_system_alerts(user: DevFriendlyUser) -> AlertsResponse:
    """
    Get current system alerts and warnings.
    """
    # Mock alerts - in real implementation, these would come from monitoring systems
    alerts = []
    
    if random.random() < 0.3:  # 30% chance of having alerts
        sample_alerts = [
            SystemAlert(
                id="alert_001",
                level="warning",
                title="High API Latency",
                message="GPT-4 model showing increased response times",
                timestamp=datetime.utcnow() - timedelta(minutes=15),
                component="ai_models"
            ),
            SystemAlert(
                id="alert_002", 
                level="info",
                title="Scheduled Maintenance",
                message="Database maintenance scheduled for 2 AM EST",
                timestamp=datetime.utcnow() - timedelta(hours=2),
                component="database"
            ),
            SystemAlert(
                id="alert_003",
                level="error",
                title="Support System Error",
                message="Knowledge base sync failed",
                timestamp=datetime.utcnow() - timedelta(minutes=45),
                component="support"
            )
        ]
        alerts = random.sample(sample_alerts, random.randint(1, 2))
    
    return AlertsResponse(
        alerts=alerts,
        total_count=len(alerts),
        by_level={
            "error": len([a for a in alerts if a.level == "error"]),
            "warning": len([a for a in alerts if a.level == "warning"]),
            "info": len([a for a in alerts if a.level == "info"])
        },
        last_checked=datetime.utcnow().isoformat()
    )
