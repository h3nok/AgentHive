"""
Context-Aware Router implementation for intelligent routing with conversation memory.

This module implements context-aware routing capabilities that consider
conversation history, user preferences, and contextual information to make
more informed routing decisions.
"""

from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, deque
import asyncio
import json
import hashlib
from enum import Enum

from ..core.observability import get_logger, with_tracing
from ..core.router_cache import cache_routing_decision, cache_performance_metrics
from .schemas import RequestContext, IntentResult, RoutingMethod, AgentType, Message, MessageRole
from .router_chain import RouterNode
from .learning_router import LearningRouterNode, RoutingDecision


logger = get_logger(__name__)


class ContextType(str, Enum):
    """Types of context for routing decisions."""
    CONVERSATION_HISTORY = "conversation_history"
    USER_PREFERENCE = "user_preference"
    TEMPORAL_PATTERN = "temporal_pattern"
    DOMAIN_CONTEXT = "domain_context"
    SESSION_CONTEXT = "session_context"


@dataclass
class UserProfile:
    """User profile for personalized routing."""
    user_id: str
    preferred_agents: Dict[AgentType, float] = field(default_factory=dict)  # Agent preference scores
    interaction_patterns: Dict[str, Any] = field(default_factory=dict)
    domain_expertise: Dict[str, float] = field(default_factory=dict)  # Domain knowledge scores
    communication_style: Optional[str] = None  # formal, casual, technical, etc.
    satisfaction_history: List[float] = field(default_factory=list)
    total_interactions: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    def update_preference(self, agent_type: AgentType, satisfaction_score: float):
        """Update agent preference based on satisfaction score."""
        current_score = self.preferred_agents.get(agent_type, 3.0)  # Default neutral
        # Weighted average with recent bias
        new_score = (current_score * 0.7) + (satisfaction_score * 0.3)
        self.preferred_agents[agent_type] = max(1.0, min(5.0, new_score))
        self.last_updated = datetime.utcnow()


@dataclass
class ConversationContext:
    """Context information for a conversation session."""
    session_id: str
    user_id: Optional[str]
    messages: List[Message] = field(default_factory=list)
    current_domain: Optional[str] = None
    active_agents: Set[AgentType] = field(default_factory=set)
    escalation_history: List[str] = field(default_factory=list)
    sentiment_trend: List[float] = field(default_factory=list)  # -1 to 1 scale
    complexity_level: float = 1.0  # 1-5 scale
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    
    def add_message(self, message: Message):
        """Add a message to conversation context."""
        self.messages.append(message)
        self.last_activity = datetime.utcnow()
        
        # Keep only recent messages to manage memory
        if len(self.messages) > 50:
            self.messages = self.messages[-50:]
    
    def get_recent_messages(self, count: int = 5) -> List[Message]:
        """Get recent messages from conversation."""
        return self.messages[-count:] if count > 0 else []


class ContextAwareRouter(RouterNode):
    """
    Context-aware router that considers conversation history, user preferences,
    and contextual information for enhanced routing decisions.
    
    This router builds on the learning router by adding:
    - Conversation memory and continuity
    - User preference tracking
    - Domain context awareness
    - Temporal pattern recognition
    """
    
    def __init__(self, learning_router: LearningRouterNode, trace_emitter=None):
        super().__init__(trace_emitter)
        self.learning_router = learning_router
        
        # Context storage
        self.user_profiles: Dict[str, UserProfile] = {}
        self.conversation_contexts: Dict[str, ConversationContext] = {}
        
        # Context analysis parameters
        self.context_weight = 0.3  # Weight of context in routing decision
        self.preference_weight = 0.2  # Weight of user preference
        self.history_weight = 0.2  # Weight of conversation history
        self.continuity_threshold = 0.7  # Threshold for maintaining agent continuity
        
        # Domain keywords for context detection
        self.domain_keywords = {
            'lease': ['lease', 'rent', 'apartment', 'tenant', 'landlord', 'deposit', 'rental'],
            'sales': ['buy', 'purchase', 'sell', 'property', 'real estate', 'investment'],
            'support': ['help', 'problem', 'issue', 'error', 'bug', 'technical', 'fix'],
            'general': ['hello', 'hi', 'thanks', 'thank you', 'information', 'about']
        }
        
        logger.info("ContextAwareRouter initialized")
    
    @with_tracing("context_aware_router_can_handle")
    async def can_handle(self, context: RequestContext) -> bool:
        """Context-aware router can handle any request."""
        return True
    
    @with_tracing("context_aware_router_handle")
    @cache_routing_decision(ttl=180)  # Cache context-aware decisions for 3 minutes
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        """
        Handle routing with context awareness.
        
        1. Update conversation context
        2. Analyze contextual factors
        3. Get base routing decision from learning router
        4. Apply context-aware adjustments
        5. Update user profile and context
        """
        try:
            # Step 1: Update conversation context
            conversation_context = await self._update_conversation_context(context)
            
            # Step 2: Analyze contextual factors
            context_analysis = await self._analyze_context(context, conversation_context)
            
            # Step 3: Get base routing decision
            base_result = await self.learning_router.handle(context)
            if not base_result:
                return None
            
            # Step 4: Apply context-aware adjustments
            enhanced_result = await self._apply_context_enhancement(
                context, base_result, context_analysis, conversation_context
            )
            
            # Step 5: Update user profile
            await self._update_user_profile(context, enhanced_result)
            
            # Add context metadata
            enhanced_result.metadata.update({
                'context_aware': True,
                'context_analysis': context_analysis,
                'conversation_length': len(conversation_context.messages),
                'current_domain': conversation_context.current_domain,
                'context_weight_applied': self.context_weight
            })
            
            return enhanced_result
            
        except Exception as e:
            logger.error("Context-aware routing failed", error=str(e), session_id=context.prompt.session_id)
            # Fallback to learning router
            return await self.learning_router.handle(context)
    
    async def _update_conversation_context(self, context: RequestContext) -> ConversationContext:
        """Update or create conversation context."""
        session_id = context.prompt.session_id
        
        # Get or create conversation context
        if session_id not in self.conversation_contexts:
            self.conversation_contexts[session_id] = ConversationContext(
                session_id=session_id,
                user_id=context.user_id
            )
        
        conv_context = self.conversation_contexts[session_id]
        
        # Add current user message
        user_message = Message(
            role=MessageRole.USER,
            content=context.prompt.prompt,
            timestamp=context.timestamp
        )
        conv_context.add_message(user_message)
        
        # Add conversation history from prompt if available
        if context.prompt.history:
            for msg in context.prompt.history:
                if msg not in conv_context.messages:
                    conv_context.add_message(msg)
        
        # Update domain context
        conv_context.current_domain = self._detect_domain(context.prompt.prompt)
        
        return conv_context
    
    async def _analyze_context(
        self, 
        context: RequestContext, 
        conversation_context: ConversationContext
    ) -> Dict[str, Any]:
        """Analyze various contextual factors for routing decision."""
        analysis = {
            'continuity_score': 0.0,
            'domain_consistency': 0.0,
            'user_preference_score': 0.0,
            'conversation_complexity': 1.0,
            'temporal_factor': 1.0,
            'escalation_risk': 0.0
        }
        
        try:
            # Analyze conversation continuity
            analysis['continuity_score'] = self._analyze_conversation_continuity(conversation_context)
            
            # Analyze domain consistency
            analysis['domain_consistency'] = self._analyze_domain_consistency(conversation_context)
            
            # Get user preference score
            if context.user_id:
                analysis['user_preference_score'] = self._get_user_preference_score(context.user_id)
            
            # Analyze conversation complexity
            analysis['conversation_complexity'] = self._analyze_conversation_complexity(conversation_context)
            
            # Analyze temporal patterns
            analysis['temporal_factor'] = self._analyze_temporal_patterns(conversation_context)
            
            # Assess escalation risk
            analysis['escalation_risk'] = self._assess_escalation_risk(conversation_context)
            
        except Exception as e:
            logger.error("Context analysis failed", error=str(e))
        
        return analysis
    
    def _analyze_conversation_continuity(self, conversation_context: ConversationContext) -> float:
        """Analyze if conversation should continue with same agent type."""
        if len(conversation_context.active_agents) == 0:
            return 0.0
        
        # If only one agent type has been active, strong continuity
        if len(conversation_context.active_agents) == 1:
            return 0.9
        
        # Multiple agents indicate complex conversation
        if len(conversation_context.active_agents) > 2:
            return 0.3
        
        # Two agents might indicate handoff or clarification
        return 0.6
    
    def _analyze_domain_consistency(self, conversation_context: ConversationContext) -> float:
        """Analyze consistency of domain throughout conversation."""
        if len(conversation_context.messages) < 2:
            return 0.5
        
        # Count domain keywords in recent messages
        domain_counts = defaultdict(int)
        recent_messages = conversation_context.get_recent_messages(5)
        
        for message in recent_messages:
            if message.role == MessageRole.USER:
                content_lower = message.content.lower()
                for domain, keywords in self.domain_keywords.items():
                    for keyword in keywords:
                        if keyword in content_lower:
                            domain_counts[domain] += 1
        
        if not domain_counts:
            return 0.5
        
        # High consistency if one domain dominates
        total_matches = sum(domain_counts.values())
        max_matches = max(domain_counts.values())
        
        return max_matches / total_matches if total_matches > 0 else 0.5
    
    def _get_user_preference_score(self, user_id: str) -> float:
        """Get user preference score for routing decisions."""
        if user_id not in self.user_profiles:
            return 0.5  # Neutral for new users
        
        profile = self.user_profiles[user_id]
        if not profile.preferred_agents:
            return 0.5
        
        # Return average preference score
        avg_preference = sum(profile.preferred_agents.values()) / len(profile.preferred_agents)
        return min(1.0, avg_preference / 5.0)  # Normalize to 0-1
    
    def _analyze_conversation_complexity(self, conversation_context: ConversationContext) -> float:
        """Analyze complexity level of conversation."""
        if len(conversation_context.messages) < 2:
            return 1.0
        
        complexity_indicators = 0
        recent_messages = conversation_context.get_recent_messages(10)
        
        for message in recent_messages:
            if message.role == MessageRole.USER:
                content = message.content.lower()
                
                # Long messages indicate complexity
                if len(content.split()) > 30:
                    complexity_indicators += 1
                
                # Multiple questions indicate complexity
                if content.count('?') > 1:
                    complexity_indicators += 1
                
                # Technical terms or legal terms
                technical_terms = ['contract', 'agreement', 'legal', 'document', 'policy', 'procedure']
                if any(term in content for term in technical_terms):
                    complexity_indicators += 1
                
                # Negative sentiment words
                negative_terms = ['problem', 'issue', 'wrong', 'error', 'bad', 'terrible', 'frustrated']
                if any(term in content for term in negative_terms):
                    complexity_indicators += 1
        
        # Normalize complexity score (1-5 scale)
        max_possible = len(recent_messages) * 4  # 4 indicators per message
        if max_possible == 0:
            return 1.0
        
        complexity = 1.0 + (complexity_indicators / max_possible) * 4.0
        return min(5.0, complexity)
    
    def _analyze_temporal_patterns(self, conversation_context: ConversationContext) -> float:
        """Analyze temporal patterns in conversation."""
        if len(conversation_context.messages) < 2:
            return 1.0
        
        # Check if conversation is happening during business hours
        current_hour = datetime.utcnow().hour
        is_business_hours = 9 <= current_hour <= 17
        
        # Check conversation duration
        duration = conversation_context.last_activity - conversation_context.created_at
        duration_minutes = duration.total_seconds() / 60
        
        # Longer conversations might need more specialized handling
        if duration_minutes > 30:
            return 1.2  # Slight boost for complex issues
        elif duration_minutes > 60:
            return 1.5  # Escalation consideration
        
        return 1.1 if is_business_hours else 1.0
    
    def _assess_escalation_risk(self, conversation_context: ConversationContext) -> float:
        """Assess risk of needing escalation."""
        risk_score = 0.0
        
        # Check escalation history
        if conversation_context.escalation_history:
            risk_score += 0.3
        
        # Check for frustrated language in recent messages
        frustrated_terms = ['frustrated', 'angry', 'unacceptable', 'manager', 'supervisor', 'complaint']
        recent_messages = conversation_context.get_recent_messages(3)
        
        for message in recent_messages:
            if message.role == MessageRole.USER:
                content_lower = message.content.lower()
                if any(term in content_lower for term in frustrated_terms):
                    risk_score += 0.2
        
        # Long conversation without resolution
        if len(conversation_context.messages) > 20:
            risk_score += 0.2
        
        # Multiple agent handoffs
        if len(conversation_context.active_agents) > 2:
            risk_score += 0.3
        
        return min(1.0, risk_score)
    
    def _detect_domain(self, prompt: str) -> Optional[str]:
        """Detect domain from user prompt."""
        prompt_lower = prompt.lower()
        domain_scores = defaultdict(int)
        
        for domain, keywords in self.domain_keywords.items():
            for keyword in keywords:
                if keyword in prompt_lower:
                    domain_scores[domain] += 1
        
        if not domain_scores:
            return None
        
        # Return domain with highest score
        return max(domain_scores.items(), key=lambda x: x[1])[0]
    
    async def _apply_context_enhancement(
        self,
        context: RequestContext,
        base_result: IntentResult,
        context_analysis: Dict[str, Any],
        conversation_context: ConversationContext
    ) -> IntentResult:
        """Apply context-aware enhancements to base routing result."""
        try:
            current_agent = AgentType(base_result.metadata.get('selected_agent', 'general'))
            
            # Check for agent continuity preference
            if context_analysis['continuity_score'] > self.continuity_threshold:
                # Prefer to continue with same agent if conversation is going well
                if conversation_context.active_agents:
                    preferred_agent = list(conversation_context.active_agents)[0]
                    if preferred_agent != current_agent:
                        logger.info(
                            "Applying agent continuity",
                            original_agent=current_agent.value,
                            continued_agent=preferred_agent.value,
                            continuity_score=context_analysis['continuity_score']
                        )
                        
                        # Create enhanced result with continuity
                        enhanced_result = IntentResult(
                            intent=f"continuity_{base_result.intent}",
                            confidence=base_result.confidence * 0.9,  # Slight confidence reduction
                            entities=base_result.entities,
                            routing_method=base_result.routing_method,
                            metadata={
                                **base_result.metadata,
                                'selected_agent': preferred_agent.value,
                                'context_enhancement': 'agent_continuity',
                                'original_agent': current_agent.value,
                                'continuity_score': context_analysis['continuity_score']
                            }
                        )
                        
                        # Update active agents
                        conversation_context.active_agents.add(preferred_agent)
                        return enhanced_result
            
            # Check for escalation need
            if context_analysis['escalation_risk'] > 0.7:
                # Consider escalating to support or more senior agent
                if current_agent != AgentType.SUPPORT:
                    logger.info(
                        "Escalation recommended",
                        current_agent=current_agent.value,
                        escalation_risk=context_analysis['escalation_risk']
                    )
                    
                    enhanced_result = IntentResult(
                        intent=f"escalated_{base_result.intent}",
                        confidence=base_result.confidence,
                        entities=base_result.entities,
                        routing_method=base_result.routing_method,
                        metadata={
                            **base_result.metadata,
                            'selected_agent': AgentType.SUPPORT.value,
                            'context_enhancement': 'escalation',
                            'original_agent': current_agent.value,
                            'escalation_risk': context_analysis['escalation_risk']
                        }
                    )
                    
                    conversation_context.escalation_history.append(f"{current_agent.value}_to_support")
                    conversation_context.active_agents.add(AgentType.SUPPORT)
                    return enhanced_result
            
            # Apply user preference adjustment
            if context.user_id and context_analysis['user_preference_score'] > 0.8:
                profile = self.user_profiles.get(context.user_id)
                if profile and profile.preferred_agents:
                    # Get highest rated agent from user preferences
                    preferred_agent = max(profile.preferred_agents.items(), key=lambda x: x[1])[0]
                    if preferred_agent != current_agent and profile.preferred_agents[preferred_agent] > 4.0:
                        logger.info(
                            "Applying user preference",
                            original_agent=current_agent.value,
                            preferred_agent=preferred_agent.value,
                            preference_score=profile.preferred_agents[preferred_agent]
                        )
                        
                        enhanced_result = IntentResult(
                            intent=f"preferred_{base_result.intent}",
                            confidence=base_result.confidence * 0.95,
                            entities=base_result.entities,
                            routing_method=base_result.routing_method,
                            metadata={
                                **base_result.metadata,
                                'selected_agent': preferred_agent.value,
                                'context_enhancement': 'user_preference',
                                'original_agent': current_agent.value,
                                'preference_score': profile.preferred_agents[preferred_agent]
                            }
                        )
                        
                        conversation_context.active_agents.add(preferred_agent)
                        return enhanced_result
            
            # No context enhancement needed, update active agents and return original
            conversation_context.active_agents.add(current_agent)
            return base_result
            
        except Exception as e:
            logger.error("Context enhancement failed", error=str(e))
            return base_result
    
    async def _update_user_profile(self, context: RequestContext, result: IntentResult):
        """Update user profile based on routing decision."""
        try:
            if not context.user_id:
                return
            
            # Get or create user profile
            if context.user_id not in self.user_profiles:
                self.user_profiles[context.user_id] = UserProfile(user_id=context.user_id)
            
            profile = self.user_profiles[context.user_id]
            profile.total_interactions += 1
            
            # Update interaction patterns
            agent_type = AgentType(result.metadata.get('selected_agent', 'general'))
            if 'agent_interactions' not in profile.interaction_patterns:
                profile.interaction_patterns['agent_interactions'] = defaultdict(int)
            
            profile.interaction_patterns['agent_interactions'][agent_type.value] += 1
            
            # Update domain expertise based on query complexity and domain
            domain = self._detect_domain(context.prompt.prompt)
            if domain:
                if domain not in profile.domain_expertise:
                    profile.domain_expertise[domain] = 1.0
                else:
                    # Slightly increase domain expertise with each interaction
                    profile.domain_expertise[domain] = min(5.0, profile.domain_expertise[domain] + 0.1)
            
            profile.last_updated = datetime.utcnow()
            
        except Exception as e:
            logger.error("Failed to update user profile", error=str(e))
    
    async def record_satisfaction_feedback(
        self,
        user_id: str,
        agent_type: AgentType,
        satisfaction_score: float
    ):
        """Record user satisfaction feedback for learning."""
        try:
            if user_id not in self.user_profiles:
                self.user_profiles[user_id] = UserProfile(user_id=user_id)
            
            profile = self.user_profiles[user_id]
            profile.update_preference(agent_type, satisfaction_score)
            profile.satisfaction_history.append(satisfaction_score)
            
            # Keep only recent satisfaction scores
            if len(profile.satisfaction_history) > 20:
                profile.satisfaction_history = profile.satisfaction_history[-20:]
            
            logger.info(
                "Satisfaction feedback recorded",
                user_id=user_id,
                agent_type=agent_type.value,
                satisfaction_score=satisfaction_score
            )
            
        except Exception as e:
            logger.error("Failed to record satisfaction feedback", error=str(e))
    
    @cache_performance_metrics(ttl=90)  # Cache context metrics for 1.5 minutes
    def get_context_metrics(self) -> Dict[str, Any]:
        """Get context-aware routing metrics."""
        try:
            active_sessions = len(self.conversation_contexts)
            active_users = len(self.user_profiles)
            
            # Calculate average conversation length
            conversation_lengths = [len(ctx.messages) for ctx in self.conversation_contexts.values()]
            avg_conversation_length = sum(conversation_lengths) / len(conversation_lengths) if conversation_lengths else 0
            
            # Calculate user satisfaction metrics
            all_satisfaction_scores = []
            for profile in self.user_profiles.values():
                all_satisfaction_scores.extend(profile.satisfaction_history)
            
            avg_satisfaction = sum(all_satisfaction_scores) / len(all_satisfaction_scores) if all_satisfaction_scores else 0
            
            # Agent preference distribution
            agent_preferences = defaultdict(list)
            for profile in self.user_profiles.values():
                for agent, score in profile.preferred_agents.items():
                    agent_preferences[agent.value].append(score)
            
            avg_agent_preferences = {
                agent: sum(scores) / len(scores) if scores else 0
                for agent, scores in agent_preferences.items()
            }
            
            return {
                'active_sessions': active_sessions,
                'active_users': active_users,
                'avg_conversation_length': avg_conversation_length,
                'avg_user_satisfaction': avg_satisfaction,
                'total_satisfaction_scores': len(all_satisfaction_scores),
                'agent_preferences': avg_agent_preferences,
                'context_weight': self.context_weight,
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to get context metrics", error=str(e))
            return {'error': str(e)}
