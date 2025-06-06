"""
Adaptive Learning Router implementation for intelligent routing optimization.

This module implements the learning capabilities for the router chain,
tracking routing decisions and optimizing based on performance metrics.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, deque
import asyncio
import statistics
from enum import Enum

from app.core.observability import get_logger, with_tracing
from app.core.router_cache import cache_routing_decision, cache_performance_metrics
from app.core.metrics import metrics_collector
from app.domain.schemas import RequestContext, IntentResult, RoutingMethod, AgentType
from app.domain.router_chain import RouterNode, RouterChain


logger = get_logger(__name__)


class FeedbackType(str, Enum):
    """Types of feedback for routing decisions."""
    USER_SATISFACTION = "user_satisfaction"
    AGENT_SUCCESS = "agent_success"
    RESOLUTION_TIME = "resolution_time"
    ESCALATION = "escalation"
    ROUTING_ACCURACY = "routing_accuracy"


@dataclass
class RoutingDecision:
    """Record of a routing decision for learning purposes."""
    decision_id: str
    session_id: str
    request_id: str
    user_query: str
    selected_agent: AgentType
    routing_method: RoutingMethod
    confidence: float
    latency_ms: float
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Performance metrics
    success: Optional[bool] = None
    user_satisfaction: Optional[float] = None  # 1-5 scale
    resolution_time: Optional[float] = None  # in seconds
    escalated: bool = False
    feedback: Dict[FeedbackType, Any] = field(default_factory=dict)


@dataclass
class NodePerformanceMetrics:
    """Performance metrics for each router node."""
    node_type: str
    total_requests: int = 0
    successful_routes: int = 0
    total_confidence: float = 0.0
    total_latency_ms: float = 0.0
    user_satisfaction_scores: List[float] = field(default_factory=list)
    recent_decisions: deque = field(default_factory=lambda: deque(maxlen=100))
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        return self.successful_routes / self.total_requests if self.total_requests > 0 else 0.0
    
    @property
    def avg_confidence(self) -> float:
        """Calculate average confidence."""
        return self.total_confidence / self.total_requests if self.total_requests > 0 else 0.0
    
    @property
    def avg_latency_ms(self) -> float:
        """Calculate average latency."""
        return self.total_latency_ms / self.total_requests if self.total_requests > 0 else 0.0
    
    @property
    def avg_satisfaction(self) -> float:
        """Calculate average user satisfaction."""
        return statistics.mean(self.user_satisfaction_scores) if self.user_satisfaction_scores else 0.0


class LearningRouterNode(RouterNode):
    """
    Adaptive learning router that optimizes routing decisions based on performance metrics.
    
    This node tracks routing decisions, collects feedback, and learns to optimize
    future routing decisions based on historical performance data.
    """
    
    def __init__(self, base_router_chain: RouterChain, trace_emitter=None, learning_enabled: bool = True):
        super().__init__(trace_emitter)
        self.base_router_chain = base_router_chain
        self.learning_enabled = learning_enabled
        
        # Learning data structures
        self.decision_history: List[RoutingDecision] = []
        self.node_metrics: Dict[str, NodePerformanceMetrics] = {}
        self.agent_performance: Dict[AgentType, Dict[str, Any]] = defaultdict(lambda: {
            'total_requests': 0,
            'successful_requests': 0,
            'avg_satisfaction': 0.0,
            'avg_resolution_time': 0.0,
            'escalation_rate': 0.0
        })
        
        # Learning parameters
        self.min_decisions_for_learning = 10  # Minimum decisions before applying learning
        self.confidence_threshold = 0.7  # Minimum confidence to override base routing
        self.learning_window_hours = 24  # Hours to consider for recent performance
        self.max_history_size = 1000  # Maximum decisions to keep in memory
        
        logger.info("LearningRouterNode initialized with learning_enabled=%s", learning_enabled)
    
    @with_tracing("learning_router_can_handle")
    async def can_handle(self, context: RequestContext) -> bool:
        """Learning router can handle any request as it wraps the base chain."""
        # Silence unused parameter warning - we need context in the interface
        _ = context
        return True
    
    @with_tracing("learning_router_handle")
    @cache_routing_decision(ttl=300)  # Cache routing decisions for 5 minutes
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        """
        Handle routing with adaptive learning.
        
        1. Analyze historical performance for similar queries
        2. Get recommendation from base router chain
        3. Apply learning-based optimization if applicable
        4. Record decision for future learning
        """
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Step 1: Get base routing decision
            base_result = await self.base_router_chain.route(context)
            
            if not base_result:
                logger.warning("Base router chain returned no result")
                return None
            
            # Step 2: Apply learning optimization if enabled
            if self.learning_enabled and len(self.decision_history) >= self.min_decisions_for_learning:
                optimized_result = await self._apply_learning_optimization(context, base_result)
                if optimized_result:
                    base_result = optimized_result
            
            # Step 3: Record decision for learning
            await self._record_routing_decision(context, base_result, start_time)
            
            # Record metrics
            metrics_collector.record_router_request(
                method=base_result.routing_method.value,
                agent_type=base_result.metadata.get('selected_agent', 'unknown'),
                confidence=base_result.confidence,
                duration=(asyncio.get_event_loop().time() - start_time) * 1000,
                routing_method=base_result.routing_method.value
            )
            
            # Step 4: Add learning metadata
            base_result.metadata.update({
                'learning_enabled': self.learning_enabled,
                'total_decisions': len(self.decision_history),
                'learning_applied': self.learning_enabled and len(self.decision_history) >= self.min_decisions_for_learning
            })
            
            return base_result
            
        except (ValueError, RuntimeError, asyncio.TimeoutError) as e:
            logger.error("Learning router failed", error=str(e), session_id=context.prompt.session_id)
            # Fallback to base router without learning
            return await self.base_router_chain.route(context)
    
    async def _apply_learning_optimization(
        self, 
        context: RequestContext, 
        base_result: IntentResult
    ) -> Optional[IntentResult]:
        """
        Apply learning-based optimization to the base routing result.
        
        Analyzes historical performance and may suggest a different agent
        if learning indicates better performance.
        """
        try:
            # Find similar historical queries
            similar_decisions = self._find_similar_decisions(context.prompt.prompt)
            
            if len(similar_decisions) < 3:  # Need minimum sample size
                return None
            
            # Analyze performance by agent type for similar queries
            agent_performance = self._analyze_agent_performance_for_similar_queries(similar_decisions)
            
            # Get best performing agent
            best_agent = self._get_best_performing_agent(agent_performance)
            
            if best_agent and best_agent != AgentType(base_result.metadata.get('selected_agent', 'general')):
                # Check if confidence in override is high enough
                best_performance = agent_performance[best_agent]
                if best_performance['confidence'] >= self.confidence_threshold:
                    logger.info(
                        "Learning override applied",
                        original_agent=base_result.metadata.get('selected_agent'),
                        optimized_agent=best_agent.value,
                        confidence=best_performance['confidence'],
                        sample_size=best_performance['sample_size']
                    )
                    
                    # Create optimized result
                    optimized_result = IntentResult(
                        intent=f"learning_optimized_{base_result.intent}",
                        confidence=best_performance['confidence'],
                        entities=base_result.entities,
                        routing_method=RoutingMethod.LLM_ROUTER,  # Mark as learning-optimized
                        metadata={
                            **base_result.metadata,
                            'selected_agent': best_agent.value,
                            'learning_override': True,
                            'original_agent': base_result.metadata.get('selected_agent'),
                            'learning_confidence': best_performance['confidence'],
                            'learning_sample_size': best_performance['sample_size']
                        }
                    )
                    
                    return optimized_result
            
            return None
            
        except (ValueError, RuntimeError) as e:
            logger.error("Learning optimization failed", error=str(e))
            return None
    
    def _find_similar_decisions(self, query: str, similarity_threshold: float = 0.7) -> List[RoutingDecision]:
        """
        Find historically similar routing decisions.
        
        Uses simple keyword-based similarity for now.
        Could be enhanced with semantic similarity using embeddings.
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        similar_decisions = []
        cutoff_time = datetime.utcnow() - timedelta(hours=self.learning_window_hours)
        
        for decision in self.decision_history:
            # Only consider recent decisions
            if decision.timestamp < cutoff_time:
                continue
            
            # Simple word overlap similarity
            decision_words = set(decision.user_query.lower().split())
            if not decision_words:
                continue
            
            overlap = len(query_words.intersection(decision_words))
            similarity = overlap / len(query_words.union(decision_words))
            
            if similarity >= similarity_threshold:
                similar_decisions.append(decision)
        
        return similar_decisions
    
    def _analyze_agent_performance_for_similar_queries(
        self, 
        similar_decisions: List[RoutingDecision]
    ) -> Dict[AgentType, Dict[str, Any]]:
        """Analyze performance of different agents for similar queries."""
        # Initialize agent stats with proper typing
        agent_stats: Dict[AgentType, Dict[str, Any]] = {}
        
        # Collect statistics by agent type
        for decision in similar_decisions:
            agent = decision.selected_agent
            if agent not in agent_stats:
                agent_stats[agent] = {
                    'total': 0,
                    'successful': 0,
                    'satisfaction_scores': [],
                    'resolution_times': [],
                    'confidence_scores': []
                }
            
            stats = agent_stats[agent]
            stats['total'] += 1
            stats['confidence_scores'].append(decision.confidence)
            
            if decision.success is True:
                stats['successful'] += 1
            
            if decision.user_satisfaction is not None:
                stats['satisfaction_scores'].append(decision.user_satisfaction)
            
            if decision.resolution_time is not None:
                stats['resolution_times'].append(decision.resolution_time)
        
        # Calculate performance metrics
        agent_performance = {}
        for agent, stats in agent_stats.items():
            if stats['total'] < 2:  # Need minimum sample
                continue
            
            success_rate = stats['successful'] / stats['total']
            avg_confidence = statistics.mean(stats['confidence_scores'])
            avg_satisfaction = statistics.mean(stats['satisfaction_scores']) if stats['satisfaction_scores'] else 3.0
            avg_resolution_time = statistics.mean(stats['resolution_times']) if stats['resolution_times'] else 300.0
            
            # Calculate composite performance score
            # Higher satisfaction and success rate = better
            # Lower resolution time = better
            performance_score = (
                success_rate * 0.4 +
                (avg_satisfaction / 5.0) * 0.3 +
                avg_confidence * 0.2 +
                max(0, (600 - avg_resolution_time) / 600) * 0.1  # Normalize resolution time
            )
            
            agent_performance[agent] = {
                'confidence': min(0.95, performance_score),  # Cap at 95%
                'success_rate': success_rate,
                'avg_satisfaction': avg_satisfaction,
                'avg_resolution_time': avg_resolution_time,
                'sample_size': stats['total']
            }
        
        return agent_performance
    
    def _get_best_performing_agent(
        self, 
        agent_performance: Dict[AgentType, Dict[str, Any]]
    ) -> Optional[AgentType]:
        """Get the best performing agent based on composite metrics."""
        if not agent_performance:
            return None
        
        best_agent = None
        best_score = 0.0
        
        for agent, metrics in agent_performance.items():
            score = metrics['confidence']
            if score > best_score:
                best_score = score
                best_agent = agent
        
        return best_agent
    
    async def _record_routing_decision(
        self, 
        context: RequestContext, 
        result: IntentResult, 
        start_time: float
    ):
        """Record routing decision for learning purposes."""
        try:
            latency_ms = (asyncio.get_event_loop().time() - start_time) * 1000
            
            decision = RoutingDecision(
                decision_id=f"{context.request_id}_{context.prompt.session_id or 'unknown'}",
                session_id=context.prompt.session_id or "unknown",
                request_id=context.request_id,
                user_query=context.prompt.prompt,
                selected_agent=AgentType(result.metadata.get('selected_agent', 'general')),
                routing_method=result.routing_method,
                confidence=result.confidence,
                latency_ms=latency_ms,
                timestamp=datetime.utcnow(),
                metadata=result.metadata
            )
            
            # Add to history
            self.decision_history.append(decision)
            
            # Maintain maximum history size
            if len(self.decision_history) > self.max_history_size:
                self.decision_history = self.decision_history[-self.max_history_size:]
            
            # Update node metrics
            node_type = result.routing_method.value
            if node_type not in self.node_metrics:
                self.node_metrics[node_type] = NodePerformanceMetrics(node_type)
            
            metrics = self.node_metrics[node_type]
            metrics.total_requests += 1
            metrics.total_confidence += result.confidence
            metrics.total_latency_ms += latency_ms
            metrics.recent_decisions.append(decision)
            
            logger.debug(
                "Routing decision recorded",
                decision_id=decision.decision_id,
                agent=decision.selected_agent.value,
                method=decision.routing_method.value,
                confidence=decision.confidence
            )
            
        except (ValueError, KeyError) as e:
            logger.error("Failed to record routing decision", error=str(e))
    
    async def record_feedback(
        self, 
        decision_id: str, 
        feedback_type: FeedbackType, 
        feedback_value: Any
    ):
        """
        Record feedback for a routing decision.
        
        This method allows external systems to provide feedback about
        routing decisions to improve learning.
        """
        try:
            # Find the decision
            decision = None
            for d in self.decision_history:
                if d.decision_id == decision_id:
                    decision = d
                    break
            
            if not decision:
                logger.warning("Decision not found for feedback", decision_id=decision_id)
                return
            
            # Record feedback
            decision.feedback[feedback_type] = feedback_value
            
            # Update specific metrics based on feedback type
            if feedback_type == FeedbackType.USER_SATISFACTION:
                decision.user_satisfaction = float(feedback_value)
            elif feedback_type == FeedbackType.AGENT_SUCCESS:
                decision.success = bool(feedback_value)
            elif feedback_type == FeedbackType.RESOLUTION_TIME:
                decision.resolution_time = float(feedback_value)
            elif feedback_type == FeedbackType.ESCALATION:
                decision.escalated = bool(feedback_value)
            
            # Update node metrics
            node_type = decision.routing_method.value
            if node_type in self.node_metrics:
                metrics = self.node_metrics[node_type]
                
                if feedback_type == FeedbackType.AGENT_SUCCESS and feedback_value:
                    metrics.successful_routes += 1
                elif feedback_type == FeedbackType.USER_SATISFACTION:
                    metrics.user_satisfaction_scores.append(float(feedback_value))
            
            logger.info(
                "Feedback recorded",
                decision_id=decision_id,
                feedback_type=feedback_type.value,
                feedback_value=feedback_value
            )
            
        except (ValueError, KeyError) as e:
            logger.error("Failed to record feedback", error=str(e), decision_id=decision_id)
    
    @cache_performance_metrics(ttl=60)  # Cache metrics for 1 minute
    def get_learning_metrics(self) -> Dict[str, Any]:
        """Get current learning metrics for monitoring and analysis."""
        try:
            total_decisions = len(self.decision_history)
            recent_cutoff = datetime.utcnow() - timedelta(hours=self.learning_window_hours)
            recent_decisions = [d for d in self.decision_history if d.timestamp >= recent_cutoff]
            
            # Calculate overall metrics
            successful_decisions = [d for d in recent_decisions if d.success is True]
            satisfaction_scores = [d.user_satisfaction for d in recent_decisions if d.user_satisfaction is not None]
            
            # Agent distribution
            agent_distribution = defaultdict(int)
            for decision in recent_decisions:
                agent_distribution[decision.selected_agent.value] += 1
            
            # Node performance summary
            node_performance = {}
            for node_type, metrics in self.node_metrics.items():
                node_performance[node_type] = {
                    'success_rate': metrics.success_rate,
                    'avg_confidence': metrics.avg_confidence,
                    'avg_latency_ms': metrics.avg_latency_ms,
                    'avg_satisfaction': metrics.avg_satisfaction,
                    'total_requests': metrics.total_requests
                }
            
            return {
                'total_decisions': total_decisions,
                'recent_decisions': len(recent_decisions),
                'success_rate': len(successful_decisions) / len(recent_decisions) if recent_decisions else 0.0,
                'avg_satisfaction': statistics.mean(satisfaction_scores) if satisfaction_scores else 0.0,
                'learning_enabled': self.learning_enabled,
                'agent_distribution': dict(agent_distribution),
                'node_performance': node_performance,
                'learning_window_hours': self.learning_window_hours,
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to get learning metrics", error=str(e))
            return {'error': str(e)}
    
    def export_learning_data(self) -> Dict[str, Any]:
        """Export learning data for analysis or backup."""
        try:
            return {
                'decision_history': [
                    {
                        'decision_id': d.decision_id,
                        'session_id': d.session_id,
                        'user_query': d.user_query,
                        'selected_agent': d.selected_agent.value,
                        'routing_method': d.routing_method.value,
                        'confidence': d.confidence,
                        'latency_ms': d.latency_ms,
                        'timestamp': d.timestamp.isoformat(),
                        'success': d.success,
                        'user_satisfaction': d.user_satisfaction,
                        'resolution_time': d.resolution_time,
                        'escalated': d.escalated,
                        'feedback': {k.value: v for k, v in d.feedback.items()}
                    }
                    for d in self.decision_history
                ],
                'node_metrics': {
                    node_type: {
                        'total_requests': metrics.total_requests,
                        'successful_routes': metrics.successful_routes,
                        'success_rate': metrics.success_rate,
                        'avg_confidence': metrics.avg_confidence,
                        'avg_latency_ms': metrics.avg_latency_ms,
                        'avg_satisfaction': metrics.avg_satisfaction
                    }
                    for node_type, metrics in self.node_metrics.items()
                },
                'exported_at': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error("Failed to export learning data", error=str(e))
            return {'error': str(e)}
