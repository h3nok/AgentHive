"""
Enhanced Observability System for LLM Router Platform
Provides distributed tracing, metrics collection, real-time monitoring, and alerting

This module sets up comprehensive observability including:
- Distributed tracing with OpenTelemetry and Jaeger
- Prometheus metrics and custom dashboards
- Real-time alerting and notification system
- Performance monitoring and bottleneck detection
- Structured logging with correlation IDs
"""

import logging
import sys
import time
import asyncio
import threading
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, List, Callable
from contextvars import ContextVar
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from functools import wraps
import json
import traceback
import psutil
import gc

import structlog
from opentelemetry import trace, metrics, baggage
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
# from opentelemetry.exporter.jaeger.thrift import JaegerExporter  # Deprecated - using OTLP instead
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
# Removed requests instrumentation as it's not essential
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from prometheus_client import Counter, Histogram, Gauge, generate_latest, Info
from starlette.middleware.base import BaseHTTPMiddleware
import redis

from .settings import settings

# Context variables for request tracking
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar("user_id", default=None)
trace_id_var: ContextVar[Optional[str]] = ContextVar("trace_id", default=None)


class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class MetricType(Enum):
    """Types of metrics"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


@dataclass
class Alert:
    """Alert definition and state"""
    id: str
    name: str
    severity: AlertSeverity
    condition: str
    threshold: float
    message: str
    is_active: bool = False
    triggered_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class PerformanceMetrics:
    """System performance metrics"""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_used_mb: float = 0.0
    disk_usage_percent: float = 0.0
    network_io_bytes: int = 0
    active_connections: int = 0
    request_rate: float = 0.0
    error_rate: float = 0.0
    avg_response_time: float = 0.0
    p95_response_time: float = 0.0
    p99_response_time: float = 0.0


# Enhanced Prometheus Metrics
request_counter = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status", "service"]
)

request_duration = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration",
    ["method", "endpoint", "service"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0]
)

active_requests = Gauge(
    "http_requests_active",
    "Active HTTP requests",
    ["service"]
)

error_counter = Counter(
    "http_errors_total",
    "Total HTTP errors",
    ["method", "endpoint", "status", "error_type", "service"]
)

# System metrics - observability specific (renamed to avoid conflicts)
observability_cpu_usage = Gauge(
    "observability_cpu_usage_percent",
    "System CPU usage percentage from observability module"
)

observability_memory_usage = Gauge(
    "observability_memory_usage_percent", 
    "System memory usage percentage from observability module"
)

observability_memory_used = Gauge(
    "observability_memory_used_bytes",
    "System memory used in bytes from observability module"
)

# Business metrics - observability specific (renamed to avoid conflicts)
observability_agent_requests = Counter(
    "observability_agent_requests_total",
    "Total agent requests from observability module",
    ["agent_type", "status", "service"]
)

observability_agent_response_time = Histogram(
    "observability_agent_response_time_seconds",
    "Agent response time from observability module",
    ["agent_type", "service"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

redis_operations = Counter(
    "redis_operations_total",
    "Total Redis operations",
    ["operation", "status", "service"]
)

database_operations = Counter(
    "database_operations_total",
    "Total database operations",
    ["operation", "collection", "status", "service"]
)

websocket_connections = Gauge(
    "websocket_connections_active",
    "Active WebSocket connections",
    ["service"]
)

token_usage_counter = Counter(
    "llm_token_usage_total",
    "Total LLM token usage",
    ["model", "operation"]
)

llm_request_duration = Histogram(
    "llm_request_duration_seconds",
    "LLM request duration",
    ["model", "operation"]
)

agent_selection_counter = Counter(
    "agent_selection_total",
    "Agent selection count",
    ["agent_type", "selection_method"]
)


def setup_structured_logging() -> None:
    """Configure structured JSON logging with contextual information."""
    
    def add_context(logger: logging.Logger, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add contextual information to log entries."""
        # Add request context
        if request_id := request_id_var.get():
            event_dict["request_id"] = request_id
        
        if user_id := user_id_var.get():
            event_dict["user_id"] = user_id
        
        # Add service metadata
        event_dict["service"] = settings.otel_service_name
        event_dict["environment"] = settings.ENVIRONMENT
        
        return event_dict
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            add_context,
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Set up standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
    )


def setup_tracing() -> Optional[TracerProvider]:
    """Configure OpenTelemetry tracing."""
    if not settings.otel_enabled:
        return None
    
    # Create resource
    resource = Resource.create({
        "service.name": settings.otel_service_name,
        "service.version": settings.APP_VERSION,
        "deployment.environment": settings.ENVIRONMENT,
    })
    
    # Create tracer provider
    provider = TracerProvider(resource=resource)
    
    # Configure OTLP exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint=settings.otel_exporter_endpoint,
        insecure=True,  # TODO: Configure TLS for production
    )
    
    # Add batch processor
    provider.add_span_processor(
        BatchSpanProcessor(otlp_exporter)
    )
    
    # Set as global provider
    trace.set_tracer_provider(provider)
    
    # Instrument libraries
    FastAPIInstrumentor().instrument()
    RedisInstrumentor().instrument()
    AsyncPGInstrumentor().instrument()
    
    return provider


def setup_metrics() -> Optional[MeterProvider]:
    """Configure OpenTelemetry metrics."""
    if not settings.metrics_enabled:
        return None
    
    # Create resource
    resource = Resource.create({
        "service.name": settings.otel_service_name,
        "service.version": settings.APP_VERSION,
    })
    
    # Configure metric reader
    reader = PeriodicExportingMetricReader(
        exporter=OTLPMetricExporter(
            endpoint=settings.otel_exporter_endpoint,
            insecure=True,  # TODO: Configure TLS for production
        ),
        export_interval_millis=10000,  # Export every 10 seconds
    )
    
    # Create meter provider
    provider = MeterProvider(resource=resource, metric_readers=[reader])
    
    # Set as global provider
    metrics.set_meter_provider(provider)
    
    return provider


def get_tracer(name: str) -> trace.Tracer:
    """Get a tracer instance."""
    return trace.get_tracer(name, settings.APP_VERSION)


def get_meter(name: str) -> metrics.Meter:
    """Get a meter instance."""
    return metrics.get_meter(name, settings.APP_VERSION)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


# Decorators for instrumentation
def measure_tokens(func):
    """Decorator to measure token usage for LLM operations."""
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        try:
            model = kwargs.get("model", "unknown")
            operation = func.__name__
            
            result = await func(*args, **kwargs)
            
            # Extract token usage from result
            if hasattr(result, "usage") and result.usage:
                if hasattr(result.usage, "total_tokens"):
                    tokens = result.usage.total_tokens
                elif isinstance(result.usage, dict) and "total_tokens" in result.usage:
                    tokens = result.usage["total_tokens"]
                else:
                    tokens = 0
                token_usage_counter.labels(model=model, operation=operation).inc(tokens)
            
            return result
        except Exception as e:
            # Log error but don't fail the function
            logger = get_logger(__name__)
            logger.warning(f"Error in measure_tokens decorator: {e}")
            # Still call the original function
            return await func(*args, **kwargs)
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        try:
            model = kwargs.get("model", "unknown")
            operation = func.__name__
            
            result = func(*args, **kwargs)
            
            # Extract token usage from result
            if hasattr(result, "usage") and result.usage:
                if hasattr(result.usage, "total_tokens"):
                    tokens = result.usage.total_tokens
                elif isinstance(result.usage, dict) and "total_tokens" in result.usage:
                    tokens = result.usage["total_tokens"]
                else:
                    tokens = 0
                token_usage_counter.labels(model=model, operation=operation).inc(tokens)
            
            return result
        except Exception as e:
            # Log error but don't fail the function
            logger = get_logger(__name__)
            logger.warning(f"Error in measure_tokens decorator: {e}")
            # Still call the original function
            return func(*args, **kwargs)
    
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper


def with_tracing(span_name: Optional[str] = None):
    """Decorator to add tracing to a function."""
    def decorator(func):
        name = span_name or f"{func.__module__}.{func.__name__}"
        tracer = get_tracer(func.__module__)
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(name) as span:
                # Add function arguments as span attributes
                span.set_attribute("function.name", func.__name__)
                span.set_attribute("function.module", func.__module__)
                
                try:
                    result = await func(*args, **kwargs)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(
                        trace.Status(trace.StatusCode.ERROR, str(e))
                    )
                    span.record_exception(e)
                    raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            with tracer.start_as_current_span(name) as span:
                # Add function arguments as span attributes
                span.set_attribute("function.name", func.__name__)
                span.set_attribute("function.module", func.__module__)
                
                try:
                    result = func(*args, **kwargs)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(
                        trace.Status(trace.StatusCode.ERROR, str(e))
                    )
                    span.record_exception(e)
                    raise
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


def measure_duration(metric_name: str):
    """Decorator to measure function execution duration."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                # You would typically record this to a histogram metric
                logger = get_logger(__name__)
                logger.info(
                    f"{metric_name}_duration",
                    duration=duration,
                    function=func.__name__
                )
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                # You would typically record this to a histogram metric
                logger = get_logger(__name__)
                logger.info(
                    f"{metric_name}_duration",
                    duration=duration,
                    function=func.__name__
                )
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


# Circuit breaker decorator
class CircuitBreaker:
    """Simple circuit breaker implementation."""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    def __call__(self, func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            if self.state == "open":
                if (
                    self.last_failure_time and
                    time.time() - self.last_failure_time > self.recovery_timeout
                ):
                    self.state = "half-open"
                else:
                    raise Exception(f"Circuit breaker is open for {func.__name__}")
            
            try:
                result = await func(*args, **kwargs)
                if self.state == "half-open":
                    self.state = "closed"
                    self.failure_count = 0
                return result
            except self.expected_exception as e:
                self.failure_count += 1
                self.last_failure_time = time.time()
                
                if self.failure_count >= self.failure_threshold:
                    self.state = "open"
                    logger = get_logger(__name__)
                    logger.error(
                        "Circuit breaker opened",
                        function=func.__name__,
                        failure_count=self.failure_count
                    )
                
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            if self.state == "open":
                if (
                    self.last_failure_time and
                    time.time() - self.last_failure_time > self.recovery_timeout
                ):
                    self.state = "half-open"
                else:
                    raise Exception(f"Circuit breaker is open for {func.__name__}")
            
            try:
                result = func(*args, **kwargs)
                if self.state == "half-open":
                    self.state = "closed"
                    self.failure_count = 0
                return result
            except self.expected_exception as e:
                self.failure_count += 1
                self.last_failure_time = time.time()
                
                if self.failure_count >= self.failure_threshold:
                    self.state = "open"
                    logger = get_logger(__name__)
                    logger.error(
                        "Circuit breaker opened",
                        function=func.__name__,
                        failure_count=self.failure_count
                    )
                
                raise
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper


# Create reusable circuit breaker instances
circuit_breaker = CircuitBreaker(
    failure_threshold=settings.circuit_breaker_failure_threshold,
    recovery_timeout=settings.circuit_breaker_recovery_timeout,
    expected_exception=settings.circuit_breaker_expected_exception
)


def get_prometheus_metrics() -> bytes:
    """Generate Prometheus metrics."""
    return generate_latest()


class EnhancedMonitoringSystem:
    """Enhanced monitoring system with real-time alerting and performance tracking"""
    
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.alert_handlers: List[Callable[[Alert], None]] = []
        self.performance_data: deque = deque(maxlen=1000)
        self.system_metrics: PerformanceMetrics = PerformanceMetrics()
        self.monitoring_thread: Optional[threading.Thread] = None
        self.shutdown_event = threading.Event()
        self.logger = get_logger(__name__)
        
        # Performance thresholds
        self.thresholds = {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'response_time_p95': 2.0,  # 2 seconds
            'error_rate': 5.0,  # 5%
            'disk_usage': 90.0
        }
        
        # Start monitoring thread
        self._start_monitoring()
    
    def _start_monitoring(self):
        """Start the background monitoring thread"""
        if not self.monitoring_thread or not self.monitoring_thread.is_alive():
            self.monitoring_thread = threading.Thread(
                target=self._monitoring_loop,
                daemon=True,
                name="monitoring-thread"
            )
            self.monitoring_thread.start()
            self.logger.info("Enhanced monitoring system started")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while not self.shutdown_event.is_set():
            try:
                # Collect system metrics
                self._collect_system_metrics()
                
                # Update Prometheus metrics
                self._update_prometheus_metrics()
                
                # Evaluate alerts
                self._evaluate_alerts()
                
                # Cleanup old data
                self._cleanup_old_data()
                
                # Sleep for monitoring interval
                self.shutdown_event.wait(10)  # Monitor every 10 seconds
                
            except Exception as e:
                self.logger.error("Error in monitoring loop", error=str(e))
                self.shutdown_event.wait(5)  # Wait before retrying
    
    def _collect_system_metrics(self):
        """Collect system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_mb = memory.used / (1024 * 1024)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage_percent = disk.percent
            
            # Network I/O
            network = psutil.net_io_counters()
            network_io_bytes = network.bytes_sent + network.bytes_recv
            
            # Active connections count
            connections = len(psutil.net_connections())
            
            # Update system metrics
            self.system_metrics = PerformanceMetrics(
                cpu_percent=cpu_percent,
                memory_percent=memory_percent,
                memory_used_mb=memory_used_mb,
                disk_usage_percent=disk_usage_percent,
                network_io_bytes=network_io_bytes,
                active_connections=connections
            )
            
            # Store in performance data
            self.performance_data.append({
                'timestamp': datetime.utcnow(),
                'metrics': self.system_metrics
            })
            
        except Exception as e:
            self.logger.error("Error collecting system metrics", error=str(e))
    
    def _update_prometheus_metrics(self):
        """Update Prometheus metrics with current values"""
        try:
            # Update system metrics
            observability_cpu_usage.set(self.system_metrics.cpu_percent)
            observability_memory_usage.set(self.system_metrics.memory_percent)
            observability_memory_used.set(self.system_metrics.memory_used_mb * 1024 * 1024)  # Convert to bytes
            
        except Exception as e:
            self.logger.error("Error updating Prometheus metrics", error=str(e))
    
    def _evaluate_alerts(self):
        """Evaluate all registered alerts"""
        try:
            current_time = datetime.utcnow()
            
            for alert in self.alerts.values():
                should_trigger = self._should_trigger_alert(alert)
                
                if should_trigger and not alert.is_active:
                    # Trigger alert
                    alert.is_active = True
                    alert.triggered_at = current_time
                    self._trigger_alert(alert)
                
                elif not should_trigger and alert.is_active:
                    # Resolve alert
                    alert.is_active = False
                    alert.resolved_at = current_time
                    self._resolve_alert(alert)
                    
        except Exception as e:
            self.logger.error("Error evaluating alerts", error=str(e))
    
    def _should_trigger_alert(self, alert: Alert) -> bool:
        """Check if an alert should be triggered"""
        try:
            condition = alert.condition.lower()
            
            if "cpu" in condition:
                return self.system_metrics.cpu_percent > alert.threshold
            
            elif "memory" in condition:
                return self.system_metrics.memory_percent > alert.threshold
            
            elif "disk" in condition:
                return self.system_metrics.disk_usage_percent > alert.threshold
            
            elif "response_time" in condition:
                return self.system_metrics.avg_response_time > alert.threshold
            
            elif "error_rate" in condition:
                return self.system_metrics.error_rate > alert.threshold
            
            elif "connections" in condition:
                return self.system_metrics.active_connections > alert.threshold
            
            return False
            
        except Exception as e:
            self.logger.error("Error evaluating alert condition", alert_id=alert.id, error=str(e))
            return False
    
    def _trigger_alert(self, alert: Alert):
        """Trigger an alert and notify handlers"""
        self.logger.warning(
            "Alert triggered",
            alert_id=alert.id,
            alert_name=alert.name,
            severity=alert.severity.value,
            message=alert.message,
            threshold=alert.threshold
        )
        
        # Call all registered alert handlers
        for handler in self.alert_handlers:
            try:
                handler(alert)
            except Exception as e:
                self.logger.error(
                    "Error in alert handler",
                    alert_id=alert.id,
                    handler=handler.__name__,
                    error=str(e)
                )
    
    def _resolve_alert(self, alert: Alert):
        """Resolve an alert"""
        duration_seconds = None
        if alert.resolved_at and alert.triggered_at:
            duration_seconds = (alert.resolved_at - alert.triggered_at).total_seconds()
        
        self.logger.info(
            "Alert resolved",
            alert_id=alert.id,
            alert_name=alert.name,
            duration_seconds=duration_seconds
        )
    
    def _cleanup_old_data(self):
        """Cleanup old performance data"""
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        # Remove old performance data
        while (self.performance_data and 
               self.performance_data[0]['timestamp'] < cutoff_time):
            self.performance_data.popleft()
    
    def add_alert(self, alert: Alert):
        """Add a new alert to monitor"""
        self.alerts[alert.id] = alert
        self.logger.info(
            "Alert added",
            alert_id=alert.id,
            alert_name=alert.name,
            condition=alert.condition,
            threshold=alert.threshold
        )
    
    def remove_alert(self, alert_id: str):
        """Remove an alert"""
        if alert_id in self.alerts:
            del self.alerts[alert_id]
            self.logger.info("Alert removed", alert_id=alert_id)
    
    def add_alert_handler(self, handler: Callable[[Alert], None]):
        """Add an alert handler function"""
        self.alert_handlers.append(handler)
        self.logger.info("Alert handler added", handler=handler.__name__)
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get data for monitoring dashboard"""
        return {
            'system_metrics': {
                'cpu_percent': self.system_metrics.cpu_percent,
                'memory_percent': self.system_metrics.memory_percent,
                'memory_used_mb': self.system_metrics.memory_used_mb,
                'disk_usage_percent': self.system_metrics.disk_usage_percent,
                'active_connections': self.system_metrics.active_connections,
                'request_rate': self.system_metrics.request_rate,
                'error_rate': self.system_metrics.error_rate,
                'avg_response_time': self.system_metrics.avg_response_time,
                'p95_response_time': self.system_metrics.p95_response_time,
                'p99_response_time': self.system_metrics.p99_response_time
            },
            'active_alerts': [
                {
                    'id': alert.id,
                    'name': alert.name,
                    'severity': alert.severity.value,
                    'message': alert.message,
                    'triggered_at': alert.triggered_at.isoformat() if alert.triggered_at else None,
                    'tags': alert.tags
                }
                for alert in self.alerts.values() if alert.is_active
            ],
            'performance_history': [
                {
                    'timestamp': data['timestamp'].isoformat(),
                    'cpu_percent': data['metrics'].cpu_percent,
                    'memory_percent': data['metrics'].memory_percent,
                    'response_time': data['metrics'].avg_response_time
                }
                for data in list(self.performance_data)[-100:]  # Last 100 data points
            ],
            'alert_count': len(self.alerts),
            'active_alert_count': sum(1 for alert in self.alerts.values() if alert.is_active)
        }
    
    def shutdown(self):
        """Shutdown the monitoring system"""
        self.shutdown_event.set()
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            self.monitoring_thread.join(timeout=10)
        self.logger.info("Enhanced monitoring system shutdown")


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics and traces"""
    
    def __init__(self, app, monitoring_system: EnhancedMonitoringSystem):
        super().__init__(app)
        self.monitoring_system = monitoring_system
        self.logger = get_logger(__name__)
    
    async def dispatch(self, request, call_next):
        """Process request and collect metrics"""
        start_time = time.time()
        
        # Generate request ID
        request_id = f"req_{int(time.time() * 1000000)}"
        request_id_var.set(request_id)
        
        # Get request details
        method = request.method
        path = request.url.path
        service = settings.otel_service_name
        
        # Increment active requests
        active_requests.labels(service=service).inc()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate metrics
            duration = time.time() - start_time
            status_code = response.status_code
            
            # Record metrics
            request_counter.labels(
                method=method,
                endpoint=path,
                status=status_code,
                service=service
            ).inc()
            
            request_duration.labels(
                method=method,
                endpoint=path,
                service=service
            ).observe(duration)
            
            # Log request
            self.logger.info(
                "Request completed",
                request_id=request_id,
                method=method,
                path=path,
                status_code=status_code,
                duration_seconds=duration
            )
            
            return response
            
        except Exception as e:
            # Record error
            error_counter.labels(
                method=method,
                endpoint=path,
                status=500,
                error_type=type(e).__name__,
                service=service
            ).inc()
            
            self.logger.error(
                "Request failed",
                request_id=request_id,
                method=method,
                path=path,
                error=str(e),
                error_type=type(e).__name__
            )
            
            raise
            
        finally:
            # Decrement active requests
            active_requests.labels(service=service).dec()
            request_id_var.set(None)


# Global monitoring system instance
_monitoring_system: Optional[EnhancedMonitoringSystem] = None


def get_monitoring_system() -> EnhancedMonitoringSystem:
    """Get the global monitoring system instance"""
    global _monitoring_system
    if _monitoring_system is None:
        _monitoring_system = EnhancedMonitoringSystem()
        
        # Add default alerts
        _monitoring_system.add_alert(Alert(
            id="high_cpu_usage",
            name="High CPU Usage",
            severity=AlertSeverity.WARNING,
            condition="cpu > threshold",
            threshold=80.0,
            message="CPU usage is above 80%"
        ))
        
        _monitoring_system.add_alert(Alert(
            id="high_memory_usage",
            name="High Memory Usage",
            severity=AlertSeverity.WARNING,
            condition="memory > threshold",
            threshold=85.0,
            message="Memory usage is above 85%"
        ))
        
        _monitoring_system.add_alert(Alert(
            id="high_error_rate",
            name="High Error Rate",
            severity=AlertSeverity.ERROR,
            condition="error_rate > threshold",
            threshold=5.0,
            message="Error rate is above 5%"
        ))
        
    return _monitoring_system


def setup_enhanced_observability():
    """Setup the complete enhanced observability system"""
    # Setup basic observability
    setup_structured_logging()
    setup_tracing()
    setup_metrics()
    
    # Get monitoring system (creates if doesn't exist)
    monitoring_system = get_monitoring_system()
    
    # Add alert handlers
    def slack_alert_handler(alert: Alert):
        """Send alert to Slack (placeholder)"""
        # Implementation would send to Slack webhook
        pass
    
    def email_alert_handler(alert: Alert):
        """Send alert via email (placeholder)"""
        # Implementation would send email
        pass
    
    monitoring_system.add_alert_handler(slack_alert_handler)
    monitoring_system.add_alert_handler(email_alert_handler)
    
    return monitoring_system


# Export enhanced functions
def record_agent_request(agent_type: str, status: str):
    """Record agent request metric"""
    observability_agent_requests.labels(
        agent_type=agent_type,
        status=status,
        service=settings.otel_service_name
    ).inc()


def record_agent_response_time(agent_type: str, duration: float):
    """Record agent response time"""
    observability_agent_response_time.labels(
        agent_type=agent_type,
        service=settings.otel_service_name
    ).observe(duration)


def record_redis_operation(operation: str, status: str):
    """Record Redis operation metric"""
    redis_operations.labels(
        operation=operation,
        status=status,
        service=settings.otel_service_name
    ).inc()


def record_database_operation(operation: str, collection: str, status: str):
    """Record database operation metric"""
    database_operations.labels(
        operation=operation,
        collection=collection,
        status=status,
        service=settings.otel_service_name
    ).inc()


def update_websocket_connections(count: int):
    """Update WebSocket connections count"""
    websocket_connections.labels(service=settings.otel_service_name).set(count)