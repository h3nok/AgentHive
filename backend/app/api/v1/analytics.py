"""
Analytics API router for usage, performance, and business metrics.

This module provides endpoints for comprehensive analytics and reporting.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import logging
import json
import random

from app.core.observability import get_logger
from .deps import DevFriendlyUser

logger = get_logger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

class UsageReport(BaseModel):
    """Detailed usage analytics report"""
    period_start: datetime
    period_end: datetime
    total_sessions: int = Field(..., ge=0)
    total_queries: int = Field(..., ge=0)
    unique_users: int = Field(..., ge=0)
    avg_session_duration: float = Field(..., ge=0.0)
    most_active_hours: List[int] = Field(default_factory=list)
    top_agents: List[Dict[str, Any]] = Field(default_factory=list)
    top_queries: List[Dict[str, Any]] = Field(default_factory=list)

class PerformanceReport(BaseModel):
    """System performance analytics"""
    period_start: datetime
    period_end: datetime
    avg_response_time: float = Field(..., ge=0.0)
    success_rate: float = Field(..., ge=0.0, le=100.0)
    error_rate: float = Field(..., ge=0.0, le=100.0)
    peak_concurrent_users: int = Field(..., ge=0)
    slowest_endpoints: List[Dict[str, Any]] = Field(default_factory=list)
    error_breakdown: Dict[str, int] = Field(default_factory=dict)

class BusinessReport(BaseModel):
    """Business impact analytics"""
    period_start: datetime
    period_end: datetime
    time_saved_hours: float = Field(..., ge=0.0)
    cost_savings_estimate: float = Field(..., ge=0.0)
    automation_rate: float = Field(..., ge=0.0, le=100.0)
    user_satisfaction: float = Field(..., ge=0.0, le=5.0)
    roi_estimate: float = Field(..., ge=0.0)
    productivity_improvement: float = Field(..., ge=0.0, le=100.0)

class AgentAnalytics(BaseModel):
    """Individual agent performance analytics"""
    agent_id: str
    agent_name: str
    total_queries: int = Field(..., ge=0)
    success_rate: float = Field(..., ge=0.0, le=100.0)
    avg_response_time: float = Field(..., ge=0.0)
    user_satisfaction: float = Field(..., ge=0.0, le=5.0)
    top_prompts: List[Dict[str, Any]] = Field(default_factory=list)
    error_types: Dict[str, int] = Field(default_factory=dict)
    usage_trends: List[Dict[str, Any]] = Field(default_factory=list)

def generate_mock_usage_report(days: int = 7) -> UsageReport:
    """Generate realistic usage analytics"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Generate realistic metrics
    total_sessions = random.randint(500, 2500) * days
    total_queries = int(total_sessions * random.uniform(2.5, 8.5))
    unique_users = int(total_sessions * random.uniform(0.3, 0.7))
    
    return UsageReport(
        period_start=start_date,
        period_end=end_date,
        total_sessions=total_sessions,
        total_queries=total_queries,
        unique_users=unique_users,
        avg_session_duration=random.uniform(8.5, 25.0),  # minutes
        most_active_hours=[9, 10, 11, 14, 15, 16],  # Business hours
        top_agents=[
            {"agent_id": "lease", "name": "TSC Lease Document Agent", "usage_count": random.randint(800, 1500), "percentage": random.uniform(35, 45)},
            {"agent_id": "support", "name": "TSC Customer Support", "usage_count": random.randint(600, 1200), "percentage": random.uniform(25, 35)},
            {"agent_id": "sales", "name": "TSC Sales Expert", "usage_count": random.randint(400, 800), "percentage": random.uniform(15, 25)},
            {"agent_id": "technical", "name": "TSC Technical Expert", "usage_count": random.randint(200, 600), "percentage": random.uniform(10, 20)},
            {"agent_id": "analytics", "name": "TSC Data Analyst", "usage_count": random.randint(100, 400), "percentage": random.uniform(5, 15)},
        ],
        top_queries=[
            {"query": "What is the lease expiration date for each property?", "count": random.randint(150, 300), "agent": "lease"},
            {"query": "I need help tracking my recent order", "count": random.randint(120, 250), "agent": "support"},
            {"query": "Show me all recurring expense schedules", "count": random.randint(100, 200), "agent": "lease"},
            {"query": "What are the best-selling products in the farm equipment category?", "count": random.randint(80, 180), "agent": "sales"},
            {"query": "Generate a sales performance report for the last quarter", "count": random.randint(60, 150), "agent": "analytics"},
        ]
    )

def generate_mock_performance_report(days: int = 7) -> PerformanceReport:
    """Generate realistic performance metrics"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return PerformanceReport(
        period_start=start_date,
        period_end=end_date,
        avg_response_time=random.uniform(0.8, 2.5),
        success_rate=random.uniform(92.0, 98.5),
        error_rate=random.uniform(1.5, 8.0),
        peak_concurrent_users=random.randint(75, 150),
        slowest_endpoints=[
            {"endpoint": "/agent/query", "avg_time": random.uniform(1.5, 3.0), "calls": random.randint(1000, 5000)},
            {"endpoint": "/models/", "avg_time": random.uniform(0.8, 1.5), "calls": random.randint(500, 1500)},
            {"endpoint": "/support/query", "avg_time": random.uniform(0.5, 1.2), "calls": random.randint(300, 800)},
        ],
        error_breakdown={
            "timeout": random.randint(5, 25),
            "model_unavailable": random.randint(3, 15),
            "invalid_query": random.randint(8, 30),
            "rate_limit": random.randint(2, 10),
            "server_error": random.randint(1, 8),
        }
    )

def generate_mock_business_report(days: int = 7) -> BusinessReport:
    """Generate realistic business impact metrics"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Calculate realistic business metrics
    base_time_saved = random.uniform(2000, 8000) * days  # hours saved
    hourly_rate = 35.0  # Average TSC hourly rate
    cost_savings = base_time_saved * hourly_rate
    
    return BusinessReport(
        period_start=start_date,
        period_end=end_date,
        time_saved_hours=base_time_saved,
        cost_savings_estimate=cost_savings,
        automation_rate=random.uniform(65.0, 85.0),
        user_satisfaction=random.uniform(4.2, 4.8),
        roi_estimate=random.uniform(250.0, 450.0),  # Percentage
        productivity_improvement=random.uniform(25.0, 45.0)
    )

@router.get("/usage", response_model=UsageReport)
async def get_usage_analytics(
    user: DevFriendlyUser,
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    include_trends: bool = Query(True, description="Include trend analysis")
) -> UsageReport:
    """
    Get comprehensive usage analytics for the specified period.
    
    Returns detailed metrics about user engagement, popular agents,
    and query patterns to help optimize the platform.
    """
    try:
        logger.info(f"Generating usage analytics for {days} days")
        return generate_mock_usage_report(days)
    except Exception as e:
        logger.error(f"Error generating usage analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate usage analytics: {str(e)}"
        )

@router.get("/performance", response_model=PerformanceReport)
async def get_performance_analytics(
    user: DevFriendlyUser,
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze")
) -> PerformanceReport:
    """
    Get system performance analytics including response times,
    success rates, and error analysis.
    """
    try:
        logger.info(f"Generating performance analytics for {days} days")
        return generate_mock_performance_report(days)
    except Exception as e:
        logger.error(f"Error generating performance analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate performance analytics: {str(e)}"
        )

@router.get("/business-impact", response_model=BusinessReport)
async def get_business_impact_analytics(
    user: DevFriendlyUser,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze")
) -> BusinessReport:
    """
    Get business impact analytics including cost savings,
    productivity improvements, and ROI estimates.
    """
    try:
        logger.info(f"Generating business impact analytics for {days} days")
        return generate_mock_business_report(days)
    except Exception as e:
        logger.error(f"Error generating business impact analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate business impact analytics: {str(e)}"
        )

@router.get("/agents/{agent_id}", response_model=AgentAnalytics)
async def get_agent_analytics(
    agent_id: str,
    user: DevFriendlyUser,
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze")
) -> AgentAnalytics:
    """
    Get detailed analytics for a specific agent including
    usage patterns, performance metrics, and user feedback.
    """
    try:
        # Agent names mapping
        agent_names = {
            "lease": "TSC Lease Document Agent",
            "support": "TSC Customer Support", 
            "sales": "TSC Sales Expert",
            "technical": "TSC Technical Expert",
            "analytics": "TSC Data Analyst",
            "general": "TSC General Assistant"
        }
        
        if agent_id not in agent_names:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
        
        logger.info(f"Generating analytics for agent {agent_id} over {days} days")
        
        # Generate realistic agent-specific metrics
        base_queries = random.randint(200, 1500) * max(1, days // 7)
        
        # Agent-specific top prompts
        agent_prompts = {
            "lease": [
                {"prompt": "What is the lease expiration date for each property?", "count": random.randint(50, 150)},
                {"prompt": "Who is responsible for roof repair for each property?", "count": random.randint(40, 120)},
                {"prompt": "Show me all recurring expense schedules", "count": random.randint(30, 100)},
            ],
            "support": [
                {"prompt": "I need help tracking my recent order", "count": random.randint(60, 180)},
                {"prompt": "How do I return or exchange a product I purchased?", "count": random.randint(45, 130)},
                {"prompt": "My product arrived damaged - what should I do?", "count": random.randint(35, 110)},
            ],
            "sales": [
                {"prompt": "What are the best-selling products in the farm equipment category?", "count": random.randint(40, 120)},
                {"prompt": "Can you recommend products for a small hobby farm setup?", "count": random.randint(35, 100)},
                {"prompt": "What's the current inventory status for riding mowers?", "count": random.randint(30, 90)},
            ]
        }
        
        # Generate usage trends (daily data points)
        usage_trends = []
        for i in range(min(days, 30)):  # Cap at 30 days for trends
            date = datetime.utcnow() - timedelta(days=i)
            usage_trends.append({
                "date": date.isoformat(),
                "queries": random.randint(10, 100),
                "success_rate": random.uniform(85.0, 98.0),
                "avg_response_time": random.uniform(0.5, 2.5)
            })
        
        return AgentAnalytics(
            agent_id=agent_id,
            agent_name=agent_names[agent_id],
            total_queries=base_queries,
            success_rate=random.uniform(88.0, 97.5),
            avg_response_time=random.uniform(0.6, 2.8),
            user_satisfaction=random.uniform(4.0, 4.8),
            top_prompts=agent_prompts.get(agent_id, []),
            error_types={
                "timeout": random.randint(2, 15),
                "invalid_input": random.randint(5, 25),
                "model_error": random.randint(1, 8),
                "rate_limit": random.randint(0, 5),
            },
            usage_trends=usage_trends
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating agent analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate agent analytics: {str(e)}"
        )

@router.get("/export")
async def export_analytics(
    user: DevFriendlyUser,
    format: str = Query("json", regex="^(json|csv|excel)$"),
    report_type: str = Query("usage", regex="^(usage|performance|business|agents)$"),
    days: int = Query(30, ge=1, le=365)
):
    """
    Export analytics data in various formats for external analysis.
    
    Supports JSON, CSV, and Excel formats for different report types.
    """
    try:
        logger.info(f"Exporting {report_type} analytics in {format} format for {days} days")
        
        # Generate the requested report data
        if report_type == "usage":
            data = generate_mock_usage_report(days)
        elif report_type == "performance":
            data = generate_mock_performance_report(days)
        elif report_type == "business":
            data = generate_mock_business_report(days)
        else:  # agents
            # For demo, return data for all agents
            data = {
                "agents": [
                    generate_mock_usage_report(days).dict(),
                    generate_mock_performance_report(days).dict(),
                ]
            }
        
        # In a real implementation, this would convert to the requested format
        return {
            "export_format": format,
            "report_type": report_type,
            "period_days": days,
            "generated_at": datetime.utcnow().isoformat(),
            "data": data.dict() if hasattr(data, 'dict') else data,
            "download_url": f"/analytics/download/{report_type}_{days}d.{format}",
            "file_size_estimate": "2.5 MB",
            "note": "This is a mock export. In production, this would generate actual files."
        }
        
    except Exception as e:
        logger.error(f"Error exporting analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export analytics: {str(e)}"
        )

@router.get("/summary")
async def get_analytics_summary(user: DevFriendlyUser):
    """
    Get a high-level summary of all analytics for executive dashboards.
    
    Returns key metrics and insights for leadership reporting.
    """
    try:
        # Generate executive summary data
        summary = {
            "overview": {
                "total_users": random.randint(1200, 2500),
                "daily_active_users": random.randint(400, 800),
                "total_queries_this_month": random.randint(15000, 35000),
                "system_uptime": random.uniform(99.2, 99.9),
                "user_satisfaction": random.uniform(4.3, 4.8)
            },
            "key_metrics": {
                "productivity_increase": random.uniform(35, 55),  # percentage
                "cost_savings_monthly": random.uniform(150000, 300000),  # dollars
                "time_saved_monthly": random.uniform(8000, 15000),  # hours
                "automation_success_rate": random.uniform(88, 95),  # percentage
                "roi": random.uniform(275, 425)  # percentage
            },
            "trends": {
                "usage_growth": random.uniform(15, 35),  # percentage month-over-month
                "new_user_adoption": random.uniform(8, 18),  # percentage
                "feature_utilization": random.uniform(65, 85),  # percentage
                "support_ticket_reduction": random.uniform(40, 60)  # percentage
            },
            "top_performers": {
                "most_used_agent": "TSC Lease Document Agent",
                "highest_satisfaction_agent": "TSC Customer Support",
                "fastest_response_agent": "TSC Technical Expert",
                "most_valuable_use_case": "Lease document analysis"
            },
            "alerts": {
                "performance_issues": random.randint(0, 3),
                "capacity_warnings": random.randint(0, 2),
                "security_incidents": 0,
                "maintenance_required": random.randint(0, 1)
            },
            "generated_at": datetime.utcnow().isoformat(),
            "period": "Last 30 days"
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"Error generating analytics summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate analytics summary: {str(e)}"
        )
