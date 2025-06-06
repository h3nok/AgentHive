"""
Prometheus metrics integration for ChatTSC router system.

This module provides comprehensive metrics collection for monitoring
router performance, cache efficiency, and system health.
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime
from prometheus_client import (
    Counter, Histogram, Gauge, Info, CollectorRegistry,
    multiprocess, generate_latest, CONTENT_TYPE_LATEST
)
from fastapi import Response
import asyncio
import psutil
import os

from app.core.observability import get_logger
from app.core.settings import settings

logger = get_logger(__name__)

# Create custom registry for multiprocess mode
if os.environ.get('PROMETHEUS_METRICS_ENABLED', 'false').lower() == 'true':
    registry = CollectorRegistry()
    multiprocess.MultiProcessCollector(registry)
else:
    registry = None

# Router Performance Metrics
router_requests_total = Counter(
    'router_requests_total',
    'Total number of router requests',
    ['method', 'agent_type', 'status'],
    registry=registry
)

router_request_duration_seconds = Histogram(
    'router_request_duration_seconds',
    'Time spent processing router requests',
    ['method', 'agent_type'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    registry=registry
)

router_confidence_score = Histogram(
    'router_confidence_score',
    'Router confidence scores distribution',
    ['agent_type', 'routing_method'],
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    registry=registry
)

# Learning Router Metrics
learning_decisions_total = Counter(
    'learning_decisions_total',
    'Total learning router decisions',
    ['optimization_applied', 'agent_type'],
    registry=registry
)

learning_feedback_total = Counter(
    'learning_feedback_total',
    'Total feedback received for learning',
    ['feedback_type', 'agent_type'],
    registry=registry
)

user_satisfaction_score = Histogram(
    'user_satisfaction_score',
    'User satisfaction scores',
    ['agent_type'],
    buckets=[1.0, 2.0, 3.0, 4.0, 5.0],
    registry=registry
)

# Context-Aware Router Metrics
context_analysis_duration_seconds = Histogram(
    'context_analysis_duration_seconds',
    'Time spent on context analysis',
    ['analysis_type'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
    registry=registry
)

conversation_continuity_score = Histogram(
    'conversation_continuity_score',
    'Conversation continuity scores',
    ['agent_type'],
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    registry=registry
)

agent_escalations_total = Counter(
    'agent_escalations_total',
    'Total agent escalations',
    ['from_agent', 'to_agent', 'reason'],
    registry=registry
)

# Cache Performance Metrics
cache_operations_total = Counter(
    'cache_operations_total',
    'Total cache operations',
    ['operation', 'cache_level', 'namespace'],
    registry=registry
)

cache_hit_ratio = Gauge(
    'cache_hit_ratio',
    'Cache hit ratio by level',
    ['cache_level', 'namespace'],
    registry=registry
)

cache_memory_usage_bytes = Gauge(
    'cache_memory_usage_bytes',
    'Cache memory usage in bytes',
    ['namespace'],
    registry=registry
)

cache_entries_total = Gauge(
    'cache_entries_total',
    'Total number of cache entries',
    ['cache_level', 'namespace'],
    registry=registry
)

# System Resource Metrics
system_memory_usage_bytes = Gauge(
    'system_memory_usage_bytes',
    'System memory usage in bytes',
    registry=registry
)

system_cpu_usage_percent = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage',
    registry=registry
)

active_sessions_total = Gauge(
    'active_sessions_total',
    'Number of active user sessions',
    registry=registry
)

# Agent Performance Metrics
agent_response_time_seconds = Histogram(
    'agent_response_time_seconds',
    'Agent response times',
    ['agent_type'],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
    registry=registry
)

agent_success_rate = Gauge(
    'agent_success_rate',
    'Agent success rate',
    ['agent_type'],
    registry=registry
)

agent_requests_total = Counter(
    'agent_requests_total',
    'Total agent requests',
    ['agent_type', 'status'],
    registry=registry
)

# API Performance Metrics
api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'API request durations',
    ['method', 'endpoint', 'status_code'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    registry=registry
)

api_requests_total = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status_code'],
    registry=registry
)

# Load Balancer Metrics
load_balancer_requests_total = Counter(
    'load_balancer_requests_total',
    'Total number of load balancer requests',
    ['endpoint_id', 'success'],
    registry=registry
)

load_balancer_request_duration_seconds = Histogram(
    'load_balancer_request_duration_seconds',
    'Load balancer request durations',
    ['endpoint_id'],
    registry=registry
)


class MetricsCollector:
    """Centralized metrics collection for the router system."""
    
    def __init__(self):
        self.enabled = os.environ.get('PROMETHEUS_METRICS_ENABLED', 'false').lower() == 'true'
        self.last_system_update = 0
        self.system_update_interval = 10  # Update system metrics every 10 seconds
        
        if self.enabled:
            logger.info("Prometheus metrics collection enabled")
            # Start background task for system metrics
            asyncio.create_task(self._update_system_metrics_periodically())
        else:
            logger.info("Prometheus metrics collection disabled")
    
    def record_router_request(
        self, 
        method: str, 
        agent_type: str, 
        duration: float, 
        confidence: float,
        routing_method: str,
        status: str = "success"
    ):
        """Record router request metrics."""
        if not self.enabled:
            return
        
        try:
            router_requests_total.labels(
                method=method, 
                agent_type=agent_type, 
                status=status
            ).inc()
            
            router_request_duration_seconds.labels(
                method=method, 
                agent_type=agent_type
            ).observe(duration)
            
            router_confidence_score.labels(
                agent_type=agent_type,
                routing_method=routing_method
            ).observe(confidence)
            
        except Exception as e:
            logger.error(f"Error recording router metrics: {e}")
    
    def record_learning_decision(
        self, 
        agent_type: str, 
        optimization_applied: bool = False
    ):
        """Record learning router decision."""
        if not self.enabled:
            return
        
        try:
            learning_decisions_total.labels(
                optimization_applied=str(optimization_applied),
                agent_type=agent_type
            ).inc()
        except Exception as e:
            logger.error(f"Error recording learning metrics: {e}")
    
    def record_feedback(
        self, 
        feedback_type: str, 
        agent_type: str,
        satisfaction_score: Optional[float] = None
    ):
        """Record user feedback metrics."""
        if not self.enabled:
            return
        
        try:
            learning_feedback_total.labels(
                feedback_type=feedback_type,
                agent_type=agent_type
            ).inc()
            
            if satisfaction_score is not None:
                user_satisfaction_score.labels(
                    agent_type=agent_type
                ).observe(satisfaction_score)
                
        except Exception as e:
            logger.error(f"Error recording feedback metrics: {e}")
    
    def record_context_analysis(
        self, 
        analysis_type: str, 
        duration: float,
        continuity_score: Optional[float] = None,
        agent_type: Optional[str] = None
    ):
        """Record context analysis metrics."""
        if not self.enabled:
            return
        
        try:
            context_analysis_duration_seconds.labels(
                analysis_type=analysis_type
            ).observe(duration)
            
            if continuity_score is not None and agent_type:
                conversation_continuity_score.labels(
                    agent_type=agent_type
                ).observe(continuity_score)
                
        except Exception as e:
            logger.error(f"Error recording context metrics: {e}")
    
    def record_escalation(
        self, 
        from_agent: str, 
        to_agent: str, 
        reason: str
    ):
        """Record agent escalation."""
        if not self.enabled:
            return
        
        try:
            agent_escalations_total.labels(
                from_agent=from_agent,
                to_agent=to_agent,
                reason=reason
            ).inc()
        except Exception as e:
            logger.error(f"Error recording escalation metrics: {e}")
    
    def record_cache_operation(
        self, 
        operation: str, 
        cache_level: str,
        namespace: str,
        hit: Optional[bool] = None
    ):
        """Record cache operation metrics."""
        if not self.enabled:
            return
        
        try:
            cache_operations_total.labels(
                operation=operation,
                cache_level=cache_level,
                namespace=namespace
            ).inc()
            
        except Exception as e:
            logger.error(f"Error recording cache metrics: {e}")
    
    def update_cache_stats(
        self, 
        cache_level: str, 
        namespace: str,
        hit_ratio: float,
        memory_usage: int,
        entry_count: int
    ):
        """Update cache statistics."""
        if not self.enabled:
            return
        
        try:
            cache_hit_ratio.labels(
                cache_level=cache_level,
                namespace=namespace
            ).set(hit_ratio)
            
            if cache_level == "memory":
                cache_memory_usage_bytes.labels(
                    namespace=namespace
                ).set(memory_usage)
            
            cache_entries_total.labels(
                cache_level=cache_level,
                namespace=namespace
            ).set(entry_count)
            
        except Exception as e:
            logger.error(f"Error updating cache stats: {e}")
    
    def record_agent_performance(
        self, 
        agent_type: str, 
        response_time: float,
        success: bool
    ):
        """Record agent performance metrics."""
        if not self.enabled:
            return
        
        try:
            agent_response_time_seconds.labels(
                agent_type=agent_type
            ).observe(response_time)
            
            agent_requests_total.labels(
                agent_type=agent_type,
                status="success" if success else "failure"
            ).inc()
            
        except Exception as e:
            logger.error(f"Error recording agent metrics: {e}")
    
    def update_agent_success_rate(self, agent_type: str, success_rate: float):
        """Update agent success rate."""
        if not self.enabled:
            return
        
        try:
            agent_success_rate.labels(agent_type=agent_type).set(success_rate)
        except Exception as e:
            logger.error(f"Error updating agent success rate: {e}")
    
    def record_api_request(
        self, 
        method: str, 
        endpoint: str,
        status_code: int, 
        duration: float
    ):
        """Record API request metrics."""
        if not self.enabled:
            return
        
        try:
            api_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=str(status_code)
            ).inc()
            
            api_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint,
                status_code=str(status_code)
            ).observe(duration)
            
        except Exception as e:
            logger.error(f"Error recording API metrics: {e}")
    
    def record_load_balancer_request(
        self,
        endpoint_id: str,
        success: bool,
        response_time: float
    ):
        """Record load balancer metrics: count and duration."""
        if not self.enabled:
            return
        try:
            # Count requests with success label
            load_balancer_requests_total.labels(
                endpoint_id=endpoint_id,
                success=str(success)
            ).inc()
            # Observe duration
            load_balancer_request_duration_seconds.labels(
                endpoint_id=endpoint_id
            ).observe(response_time)
        except Exception as e:
            logger.error(f"Error recording load balancer metrics: {e}")
    
    def update_active_sessions(self, count: int):
        """Update active sessions count."""
        if not self.enabled:
            return
        
        try:
            active_sessions_total.set(count)
        except Exception as e:
            logger.error(f"Error updating active sessions: {e}")
    
    async def _update_system_metrics_periodically(self):
        """Background task to update system metrics."""
        while True:
            try:
                await asyncio.sleep(self.system_update_interval)
                await self._update_system_metrics()
            except Exception as e:
                logger.error(f"Error in system metrics update: {e}")
    
    async def _update_system_metrics(self):
        """Update system resource metrics."""
        if not self.enabled:
            return
        
        try:
            # Memory usage
            memory = psutil.virtual_memory()
            system_memory_usage_bytes.set(memory.used)
            
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=None)
            system_cpu_usage_percent.set(cpu_percent)
            
        except Exception as e:
            logger.error(f"Error updating system metrics: {e}")
    
    def get_metrics_response(self) -> Response:
        """Get Prometheus metrics response."""
        if not self.enabled or not registry:
            return Response(
                content="Metrics collection disabled",
                media_type="text/plain"
            )
        
        try:
            metrics_data = generate_latest(registry)
            return Response(
                content=metrics_data,
                media_type=CONTENT_TYPE_LATEST
            )
        except Exception as e:
            logger.error(f"Error generating metrics: {e}")
            return Response(
                content=f"Error generating metrics: {e}",
                media_type="text/plain"
            )


# Global metrics collector instance
metrics_collector = MetricsCollector()


def get_metrics_summary() -> Dict[str, Any]:
    """Get a summary of current metrics for internal monitoring."""
    try:
        return {
            "metrics_enabled": metrics_collector.enabled,
            "system_info": {
                "memory_usage_bytes": psutil.virtual_memory().used,
                "cpu_usage_percent": psutil.cpu_percent(interval=None),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Error getting metrics summary: {e}")
        return {"error": str(e)}
