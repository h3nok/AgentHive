"""
Chain of Responsibility pattern implementation for routing.

This module implements the routing chain with multiple handlers for different routing strategies.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, TYPE_CHECKING
import re
import json
from dataclasses import dataclass
import asyncio
import uuid
import time
from datetime import datetime

from ..core.observability import get_logger, with_tracing, agent_selection_counter
from ..core.router_cache import cache_routing_decision
from .schemas import RequestContext, IntentResult, RoutingMethod, AgentType
from ..adapters.llm_openai import OpenAIAdapter

if TYPE_CHECKING:
    from .learning_router import LearningRouterNode
    from .context_aware_router import ContextAwareRouter

logger = get_logger(__name__)


@dataclass
class RoutingRule:
    """Routing rule configuration."""
    pattern: str
    agent_type: AgentType
    intent: str
    priority: int = 0


class RouterNode(ABC):
    """Abstract base class for router nodes in the chain."""
    
    def __init__(self, trace_emitter=None):
        self.next_handler: Optional[RouterNode] = None
        self.trace_emitter = trace_emitter
    
    def set_next(self, handler: 'RouterNode') -> 'RouterNode':
        """Set the next handler in the chain."""
        self.next_handler = handler
        return handler
    
    @abstractmethod
    async def can_handle(self, context: RequestContext) -> bool:
        """Check if this node can handle the request."""
        pass
    
    @abstractmethod
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        """Handle the routing decision."""
        pass
    
    async def process(self, context: RequestContext) -> Optional[IntentResult]:
        """Process the request through the chain."""
        if await self.can_handle(context):
            result = await self.handle(context)
            if result:
                return result
        
        if self.next_handler:
            return await self.next_handler.process(context)
        
        return None


class RegexNode(RouterNode):
    """Pattern matching router using regex rules."""
    
    def __init__(self, rules: List[RoutingRule], trace_emitter=None):
        super().__init__(trace_emitter)
        self.rules = sorted(rules, key=lambda r: r.priority, reverse=True)
        self.compiled_rules = [
            (re.compile(rule.pattern, re.IGNORECASE), rule) 
            for rule in self.rules
        ]
    
    @with_tracing("regex_routing")
    async def can_handle(self, context: RequestContext) -> bool:
        """Check if any regex pattern matches."""
        prompt_text = context.prompt.prompt.lower()
        return any(pattern.search(prompt_text) for pattern, _ in self.compiled_rules)
    
    @with_tracing("regex_routing_handle")
    @cache_routing_decision(ttl=600)  # Cache regex decisions for 10 minutes (very stable)
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        # Start detailed debug logging for regex routing
        step_id = str(uuid.uuid4())
        logger.info(
            "🔍 Regex Routing Starting",
            prompt=context.prompt.prompt,
            rules_count=len(self.compiled_rules),
            step_id=step_id
        )
        start_time = time.time()
        prompt_text = context.prompt.prompt
        step_id = step_id
        
        # Find all matching rules
        matches = []
        for pattern, rule in self.compiled_rules:
            if match := pattern.search(prompt_text):
                matches.append((match, rule))
        
        if not matches:
            # Emit trace step for failed regex matching
            if self.trace_emitter and context.prompt.session_id:
                latency_ms = (time.time() - start_time) * 1000
                await self.trace_emitter.emit_router_step(
                    session_id=context.prompt.session_id,
                    step_id=step_id,
                    step_name="regex_pattern_matching",
                    agent_type=AgentType.GENERAL,
                    confidence=0.0,
                    intent="no_match",
                    method="regex",
                    latency_ms=latency_ms,
                    metadata={"patterns_checked": len(self.compiled_rules)}
                )
            return None
        
        # Select the best match based on priority and context
        selected_match, selected_rule = self._select_best_match(matches, prompt_text)
        latency_ms = (time.time() - start_time) * 1000
        
        # Emit trace step for successful regex matching
        if self.trace_emitter and context.prompt.session_id:
            await self.trace_emitter.emit_router_step(
                session_id=context.prompt.session_id,
                step_id=step_id,
                step_name="regex_pattern_matching",
                agent_type=selected_rule.agent_type,
                confidence=1.0,
                intent=selected_rule.intent,
                method="regex",
                latency_ms=latency_ms,
                metadata={
                    "matched_pattern": selected_rule.pattern,
                    "patterns_checked": len(self.compiled_rules),
                    "total_matches": len(matches)
                }
            )
        
        logger.info(
            "Regex pattern matched",
            pattern=selected_rule.pattern,
            agent_type=selected_rule.agent_type.value,
            intent=selected_rule.intent
        )
        
        # Extract entities from named groups
        entities = selected_match.groupdict() if hasattr(selected_match, 'groupdict') else {}
        
        agent_selection_counter.labels(
            agent_type=selected_rule.agent_type.value,
            selection_method=RoutingMethod.REGEX.value
        ).inc()
        
        return IntentResult(
            intent=selected_rule.intent,
            confidence=1.0,  # Regex matches are deterministic
            entities=entities,
            routing_method=RoutingMethod.REGEX,
            metadata={
                "matched_pattern": selected_rule.pattern,
                "agent_type": selected_rule.agent_type.value
            }
        )
    
    def _select_best_match(self, matches, prompt_text: str) -> tuple:
        """Select the best match from multiple regex matches."""
        if len(matches) == 1:
            return matches[0]
        
        # Sort by priority first (highest priority wins)
        matches.sort(key=lambda x: x[1].priority, reverse=True)
        
        # If multiple matches have same priority, use contextual logic
        highest_priority = matches[0][1].priority
        top_matches = [m for m in matches if m[1].priority == highest_priority]
        
        if len(top_matches) == 1:
            return top_matches[0]
        
        # Apply contextual heuristics for tied priorities
        prompt_lower = prompt_text.lower()
        
        # Handle multi-keyword scenarios
        for match, rule in top_matches:
            # Prioritize sales for "buy property to lease" patterns
            if rule.agent_type == AgentType.SALES and "buy" in prompt_lower and "property" in prompt_lower:
                if "to lease" in prompt_lower or "to rent" in prompt_lower:
                    return match, rule
            
            # Prioritize support for technical issues even with lease/rent keywords
            if rule.agent_type == AgentType.SUPPORT:
                tech_indicators = ["system", "bug", "broken", "application system", "technical", "login", "platform"]
                if any(indicator in prompt_lower for indicator in tech_indicators):
                    return match, rule
        
        # Default to first (highest priority) match
        return top_matches[0]


class MLClassifierNode(RouterNode):
    """Machine learning based intent classifier."""
    
    def __init__(self, embeddings_adapter=None, classifier_model=None, trace_emitter=None):
        super().__init__(trace_emitter)
        self.embeddings_adapter = embeddings_adapter
        self.classifier_model = classifier_model
        # TODO: Load pre-trained classifier model
    
    @with_tracing("ml_classifier_routing")
    async def can_handle(self, context: RequestContext) -> bool:
        """ML classifier can potentially handle any request."""
        # Skip if no model is loaded
        return self.classifier_model is not None
    
    @with_tracing("ml_classifier_handle")
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        """Use ML model to classify intent."""
        if not self.classifier_model:
            return None
        
        try:
            # TODO: Implement actual ML classification
            # This is a placeholder implementation
            
            # Generate embeddings
            # embeddings = await self.embeddings_adapter.get_embeddings(context.prompt.prompt)
            
            # Classify intent
            # prediction = self.classifier_model.predict(embeddings)
            
            # For now, return None to pass to next handler
            return None
            
        except Exception as e:
            logger.error("ML classification failed", error=str(e))
            return None


class LLMIntentClassifierNode(RouterNode):
    """LLM-based intent classification using prompt templates and few-shot examples."""
    
    def __init__(self, llm_adapter: OpenAIAdapter, agent_descriptions: Dict[AgentType, str], trace_emitter=None):
        super().__init__(trace_emitter)
        self.llm_adapter = llm_adapter
        self.agent_descriptions = agent_descriptions
        self.classification_prompt = self._build_classification_prompt()
        self.min_confidence_threshold = 0.8  # Only use LLM routing for high-confidence decisions
    
    def _build_classification_prompt(self) -> str:
        """Build the classification prompt with few-shot examples."""
        return """You are an expert intent classifier for a business platform. Your task is to analyze user queries and classify them into one of the available agent types with high accuracy.

## Agent Types and Responsibilities:

**LEASE**: Rental properties, apartment hunting, lease agreements, tenant rights, landlord issues, security deposits, rent payments, subletting, rental applications, housing assistance, tenant-landlord disputes, rental market inquiries.

**SALES**: Property buying, selling, real estate transactions, market analysis, property valuation, investment properties, home financing, mortgage assistance, property listings, real estate agent services.

**SUPPORT**: Technical issues, system problems, platform bugs, login issues, account problems, application errors, website functionality, payment processing issues, user interface problems.

**HR**: Human resources inquiries including employee benefits, vacation time, PTO requests, payroll questions, UKG system help, performance reviews, employee handbook, policies, time tracking, benefits enrollment, healthcare plans, retirement plans, HR forms, compliance questions.

**GENERAL**: Greetings, general platform information, company information, unrelated topics, nonsensical queries, empty/unclear requests, small talk.

## Classification Examples:

Query: "I need help with my security deposit return"
Classification: LEASE
Reasoning: Security deposit issues are tenant-landlord matters handled by lease specialists

Query: "Looking to buy a house for investment purposes"  
Classification: SALES
Reasoning: Property purchase for investment is a sales transaction

Query: "The application keeps crashing when I try to login"
Classification: SUPPORT  
Reasoning: Technical issue with application functionality requires support

Query: "Hello, what services do you offer?"
Classification: GENERAL
Reasoning: General greeting and information request

Query: "I need to check my PTO balance"
Classification: HR
Reasoning: Employee vacation/PTO inquiry is handled by HR agent

Query: "Can you help me with benefits enrollment?"
Classification: HR
Reasoning: Employee benefits enrollment is an HR function

Query: "I want to buy property to lease out to tenants"
Classification: SALES
Reasoning: Primary action is property purchase (sales), even though end goal involves leasing

Query: "My landlord won't fix the heating"
Classification: LEASE  
Reasoning: Landlord-tenant issue falls under lease management

Query: "abcdefghijklmnop"
Classification: GENERAL
Reasoning: Nonsensical input should be handled by general agent

## Classification Guidelines:

1. **Primary Action Priority**: For mixed intents, classify based on the primary action the user wants to take
2. **Keyword Context**: Consider the full context, not just individual keywords  
3. **Business Focus**: HR queries about benefits, PTO, payroll, UKG system should go to HR
4. **Real Estate Focus**: Queries must be related to real estate to use LEASE or SALES
5. **Technical Issues**: Any system/platform problems go to SUPPORT regardless of other keywords
6. **Edge Cases**: Unclear, empty, or non-business queries go to GENERAL

## Output Format:

Respond with ONLY a JSON object:
{
    "agent_type": "LEASE|SALES|SUPPORT|HR|GENERAL",
    "intent": "brief description of user's intent", 
    "confidence": 0.0-1.0,
    "reasoning": "concise explanation for classification"
}"""

    @with_tracing("llm_intent_classifier_can_handle")
    async def can_handle(self, context: RequestContext) -> bool:
        """LLM classifier can handle any request."""
        return True
    
    @with_tracing("llm_intent_classifier_handle")
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        """Use LLM with prompt templates for intent classification."""
        start_time = time.time()
        step_id = str(uuid.uuid4())
        
        logger.info(
            "🔍 LLM Intent Classification Starting",
            query=context.prompt.prompt,
            query_length=len(context.prompt.prompt),
            session_id=context.prompt.session_id,
            step_id=step_id
        )
        
        try:
            # Build the full prompt with the user query
            full_prompt = f"""{self.classification_prompt}

## User Query to Classify:
"{context.prompt.prompt}"

Analyze this query and provide your classification:"""

            logger.debug(
                "📝 LLM Classification Prompt Built",
                prompt_length=len(full_prompt),
                temperature=0.1,
                step_id=step_id
            )

            response = await self.llm_adapter.complete(
                prompt=full_prompt,
                system_prompt="You are a precise intent classifier. Always respond with valid JSON in the specified format.",
                temperature=0.1,  # Very low temperature for consistent classification
                response_format="json"
            )
            
            logger.info(
                "🤖 LLM Response Received",
                response_content=response.content[:200] + "..." if len(response.content) > 200 else response.content,
                response_length=len(response.content),
                step_id=step_id
            )
            
            # Parse LLM response
            try:
                classification = json.loads(response.content)
                logger.info(
                    "✅ LLM Classification Parsed Successfully",
                    classification=classification,
                    step_id=step_id
                )
            except json.JSONDecodeError as parse_error:
                logger.error(
                    "❌ LLM Classification JSON Parse Failed", 
                    raw_response=response.content,
                    parse_error=str(parse_error),
                    step_id=step_id
                )
                raise parse_error
            
            # Validate and extract fields
            agent_type_str = classification.get("agent_type", "").upper()
            confidence = float(classification.get("confidence", 0.0))
            intent = classification.get("intent", "unknown")
            reasoning = classification.get("reasoning", "")
            
            logger.info(
                "🎯 LLM Classification Results Extracted",
                agent_type_str=agent_type_str,
                confidence=confidence,
                intent=intent,
                reasoning=reasoning,
                step_id=step_id
            )
            
            # Validate agent type
            try:
                agent_type = AgentType(agent_type_str.lower())
                logger.info(
                    "✅ Agent Type Validation Successful",
                    agent_type=agent_type.value,
                    step_id=step_id
                )
            except ValueError as validation_error:
                logger.warning(
                    "⚠️ Invalid Agent Type from LLM - Using Fallback", 
                    invalid_agent_type=agent_type_str,
                    validation_error=str(validation_error),
                    fallback_agent="general",
                    step_id=step_id
                )
                agent_type = AgentType.GENERAL
                confidence = 0.5
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Emit trace step for successful LLM classification
            if self.trace_emitter and context.prompt.session_id:
                await self.trace_emitter.emit_router_step(
                    session_id=context.prompt.session_id,
                    step_id=step_id,
                    step_name="llm_intent_classification",
                    agent_type=agent_type,
                    confidence=confidence,
                    intent=intent,
                    method="llm_classifier",
                    latency_ms=latency_ms,
                    metadata={
                        "reasoning": reasoning,
                        "raw_response": classification,
                        "prompt_tokens": len(full_prompt.split()),
                        "classification_confidence": confidence
                    }
                )
            
            # Apply confidence threshold
            if confidence < self.min_confidence_threshold:
                logger.warning(
                    "🚨 LLM Classification Confidence Below Threshold - Passing to Next Handler",
                    confidence=confidence,
                    threshold=self.min_confidence_threshold,
                    query=context.prompt.prompt[:100] + "..." if len(context.prompt.prompt) > 100 else context.prompt.prompt,
                    agent_type=agent_type.value,
                    step_id=step_id
                )
                return None  # Pass to next handler
            
            logger.info(
                "🎉 LLM Intent Classification Completed Successfully",
                final_agent=agent_type.value,
                final_confidence=confidence,
                final_intent=intent,
                routing_method="llm_classifier",
                query=context.prompt.prompt[:50] + "..." if len(context.prompt.prompt) > 50 else context.prompt.prompt,
                step_id=step_id
            )
            
            agent_selection_counter.labels(
                agent_type=agent_type.value,
                selection_method=RoutingMethod.LLM_ROUTER.value
            ).inc()
            
            return IntentResult(
                intent=intent,
                confidence=confidence,
                entities={},
                routing_method=RoutingMethod.LLM_ROUTER,
                metadata={
                    "reasoning": reasoning,
                    "agent_type": agent_type.value,
                    "classification_confidence": confidence
                }
            )
            
        except json.JSONDecodeError as e:
            latency_ms = (time.time() - start_time) * 1000
            logger.error("Failed to parse LLM classification response", error=str(e))
            
            # Emit trace step for failed parsing
            if self.trace_emitter and context.prompt.session_id:
                await self.trace_emitter.emit_router_step(
                    session_id=context.prompt.session_id,
                    step_id=step_id,
                    step_name="llm_intent_classification",
                    agent_type=AgentType.GENERAL,
                    confidence=0.0,
                    intent="parse_error",
                    method="llm_classifier",
                    latency_ms=latency_ms,
                    metadata={"error": str(e), "error_type": "json_decode"}
                )
            return None
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            logger.error("LLM intent classification failed", error=str(e))
            
            # Emit trace step for general failure
            if self.trace_emitter and context.prompt.session_id:
                await self.trace_emitter.emit_router_step(
                    session_id=context.prompt.session_id,
                    step_id=step_id,
                    step_name="llm_intent_classification",
                    agent_type=AgentType.GENERAL,
                    confidence=0.0,
                    intent="error",
                    method="llm_classifier",
                    latency_ms=latency_ms,
                    metadata={"error": str(e), "error_type": "general"}
                )
            return None


class LLMRouterNode(RouterNode):
    """Simplified LLM-based routing for fallback cases."""
    
    def __init__(self, llm_adapter: OpenAIAdapter, agent_descriptions: Dict[AgentType, str], trace_emitter=None):
        super().__init__(trace_emitter)
        self.llm_adapter = llm_adapter
        self.agent_descriptions = agent_descriptions
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for LLM routing."""
        agents_info = "\n".join([
            f"- {agent_type.value}: {description}"
            for agent_type, description in self.agent_descriptions.items()
        ])
        
        return f"""You are a routing assistant that determines which specialized agent should handle a user's request.

Available agents:
{agents_info}

Routing Guidelines:
- LEASE agent: All tenant/landlord issues, security deposits, rental applications, lease terms, subletting
- SALES agent: Property buying, selling, real estate transactions, investment properties
- SUPPORT agent: Technical issues, system problems, bugs, login issues, platform help
- HR agent: Employee benefits, vacation/PTO, payroll, UKG system, performance reviews, employee handbook, HR policies, time tracking, benefits enrollment
- GENERAL agent: Greetings, general inquiries, completely unrelated topics, empty/nonsensical queries

Special Cases:
- If the query is empty, nonsensical ("abcdef..."), or completely unrelated to business, use GENERAL
- HR keywords: benefits, PTO, vacation, payroll, UKG, employee, handbook, policy, performance review, time off
- For mixed intents, prioritize the primary action: "buy property to lease" → SALES (buying is primary)
- Landlord/tenant rights and deposit issues are always LEASE, even without explicit "lease" keywords

Analyze the user's request and respond with ONLY a JSON object in this format:
{{
    "agent_type": "<agent_type>",
    "intent": "<brief intent description>",
    "confidence": <0.0-1.0>,
    "reasoning": "<brief explanation>"
}}

Choose the most appropriate agent based on the request content and context."""
    
    @with_tracing("llm_router_can_handle")
    async def can_handle(self, context: RequestContext) -> bool:
        """LLM router can handle any request as a fallback."""
        return True
    
    @with_tracing("llm_router_handle")
    @cache_routing_decision(ttl=120)  # Cache LLM decisions for 2 minutes
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        """Use LLM to determine routing."""
        try:
            response = await self.llm_adapter.complete(
                prompt=context.prompt.prompt,
                system_prompt=self.system_prompt,
                temperature=0.3,  # Lower temperature for more consistent routing
                response_format="json"
            )
            
            # Parse LLM response
            routing_decision = json.loads(response.content)
            
            # Validate agent type
            agent_type = AgentType(routing_decision.get("agent_type", "general"))
            
            logger.info(
                "LLM routing decision",
                agent_type=agent_type.value,
                intent=routing_decision.get("intent"),
                confidence=routing_decision.get("confidence"),
                reasoning=routing_decision.get("reasoning")
            )
            
            agent_selection_counter.labels(
                agent_type=agent_type.value,
                selection_method=RoutingMethod.LLM_ROUTER.value
            ).inc()
            
            return IntentResult(
                intent=routing_decision.get("intent", "general_query"),
                confidence=routing_decision.get("confidence", 0.8),
                entities={},
                routing_method=RoutingMethod.LLM_ROUTER,
                metadata={
                    "reasoning": routing_decision.get("reasoning", ""),
                    "agent_type": agent_type.value
                }
            )
            
        except Exception as e:
            logger.error("LLM routing failed", error=str(e))
            return None


class FallbackNode(RouterNode):
    """Fallback handler when no other node can handle the request."""
    
    def __init__(self, default_agent: AgentType = AgentType.GENERAL, trace_emitter=None):
        super().__init__(trace_emitter)
        self.default_agent = default_agent
    
    async def can_handle(self, context: RequestContext) -> bool:
        """Fallback always returns true."""
        return True
    
    @with_tracing("fallback_routing")
    async def handle(self, context: RequestContext) -> Optional[IntentResult]:
        """Return default routing decision."""
        logger.warning(
            "Using fallback routing",
            prompt=context.prompt.prompt[:100],
            default_agent=self.default_agent.value
        )
        
        agent_selection_counter.labels(
            agent_type=self.default_agent.value,
            selection_method=RoutingMethod.FALLBACK.value
        ).inc()
        
        return IntentResult(
            intent="general_query",
            confidence=0.5,
            entities={},
            routing_method=RoutingMethod.FALLBACK,
            metadata={"agent_type": self.default_agent.value}
        )


class RouterChain:
    """Main router chain orchestrator."""
    
    def __init__(self, trace_emitter=None):
        self.head: Optional[RouterNode] = None
        self.strategy_selector = StrategySelector()
        self.trace_emitter = trace_emitter
    
    def build_default_chain(
        self,
        regex_rules: List[RoutingRule],
        llm_adapter: OpenAIAdapter,
        agent_descriptions: Dict[AgentType, str],
        use_llm_primary: bool = True
    ) -> 'RouterChain':
        """Build the default routing chain with LLM-first approach."""
        
        if use_llm_primary:
            # LLM-first approach: Use LLM for primary classification, regex as fallback
            llm_classifier = LLMIntentClassifierNode(llm_adapter, agent_descriptions, self.trace_emitter)
            # Use simplified rules for faster fallback matching
            regex_node = RegexNode(SIMPLIFIED_ROUTING_RULES, self.trace_emitter)
            llm_fallback = LLMRouterNode(llm_adapter, agent_descriptions, self.trace_emitter)
            fallback_node = FallbackNode(trace_emitter=self.trace_emitter)
            
            # Build chain: LLM classifier → Regex → LLM fallback → Fallback
            llm_classifier.set_next(regex_node).set_next(llm_fallback).set_next(fallback_node)
            self.head = llm_classifier
            
        else:
            # Traditional approach: Regex first, then LLM
            regex_node = RegexNode(regex_rules, self.trace_emitter)
            ml_node = MLClassifierNode(trace_emitter=self.trace_emitter)  # Disabled for now
            llm_node = LLMRouterNode(llm_adapter, agent_descriptions, self.trace_emitter)
            fallback_node = FallbackNode(trace_emitter=self.trace_emitter)
            
            # Build chain
            regex_node.set_next(ml_node).set_next(llm_node).set_next(fallback_node)
            self.head = regex_node
        
        return self
    
    def build_enhanced_chain(
        self,
        regex_rules: List[RoutingRule],
        llm_adapter: OpenAIAdapter,
        agent_descriptions: Dict[AgentType, str],
        enable_learning: bool = True,
        enable_context_awareness: bool = True,
        use_llm_primary: bool = True
    ) -> 'RouterChain':
        """
        Build enhanced routing chain with learning and context-aware capabilities.
        
        This creates a sophisticated routing chain that includes:
        - Learning router for adaptive optimization
        - Context-aware router for conversation memory
        - Traditional routing fallbacks
        """
        try:
            from .learning_router import LearningRouterNode
            from .context_aware_router import ContextAwareRouter
        except ImportError:
            logger.warning("Enhanced routing components not available, falling back to default chain")
            return self.build_default_chain(regex_rules, llm_adapter, agent_descriptions, use_llm_primary)
        
        # First build the base chain
        base_chain = RouterChain(self.trace_emitter)
        base_chain.build_default_chain(
            regex_rules=regex_rules,
            llm_adapter=llm_adapter,
            agent_descriptions=agent_descriptions,
            use_llm_primary=use_llm_primary
        )
        
        if enable_learning:
            # Wrap base chain with learning capabilities
            learning_router = LearningRouterNode(
                base_router_chain=base_chain,
                trace_emitter=self.trace_emitter,
                learning_enabled=enable_learning
            )
            
            if enable_context_awareness:
                # Add context-aware layer on top of learning
                context_router = ContextAwareRouter(
                    learning_router=learning_router,
                    trace_emitter=self.trace_emitter
                )
                self.head = context_router
            else:
                self.head = learning_router
        elif enable_context_awareness:
            # Only context awareness without learning - use base chain directly
            logger.info("Context awareness enabled without learning - using base chain")
            self.head = base_chain.head
        else:
            # Use base chain as-is
            self.head = base_chain.head
        
        return self

    def get_learning_router(self) -> Optional['LearningRouterNode']:
        """Get the learning router node if available."""
        try:
            from .learning_router import LearningRouterNode
            from .context_aware_router import ContextAwareRouter
            
            if isinstance(self.head, ContextAwareRouter):
                learning_router = self.head.learning_router
                if isinstance(learning_router, LearningRouterNode):
                    return learning_router
            elif isinstance(self.head, LearningRouterNode):
                return self.head
        except ImportError:
            pass
        
        return None

    def get_context_router(self) -> Optional['ContextAwareRouter']:
        """Get the context-aware router if available."""
        try:
            from .context_aware_router import ContextAwareRouter
            
            if isinstance(self.head, ContextAwareRouter):
                return self.head
        except ImportError:
            pass
        
        return None

    async def record_feedback(self, decision_id: str, feedback_type: str, feedback_value: Any):
        """Record feedback for learning purposes."""
        learning_router = self.get_learning_router()
        if learning_router:
            try:
                from .learning_router import FeedbackType
                fb_type = FeedbackType(feedback_type)
                await learning_router.record_feedback(decision_id, fb_type, feedback_value)
            except (ImportError, ValueError) as e:
                logger.warning(f"Could not record feedback: {e}")

    async def record_satisfaction(self, user_id: str, agent_type: str, satisfaction_score: float):
        """Record user satisfaction for context awareness."""
        context_router = self.get_context_router()
        if context_router:
            try:
                agent = AgentType(agent_type)
                await context_router.record_satisfaction_feedback(user_id, agent, satisfaction_score)
            except ValueError:
                logger.warning(f"Unknown agent type: {agent_type}")

    def get_enhanced_metrics(self) -> Dict[str, Any]:
        """Get comprehensive metrics from enhanced routing components."""
        metrics = {
            'enhanced_routing': True,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        learning_router = self.get_learning_router()
        if learning_router:
            metrics['learning_metrics'] = learning_router.get_learning_metrics()
        
        context_router = self.get_context_router()
        if context_router:
            metrics['context_metrics'] = context_router.get_context_metrics()
        
        return metrics

    @with_tracing("router_chain_route")
    async def route(self, context: RequestContext) -> IntentResult:
        """Route the request through the chain."""
        if not self.head:
            raise RuntimeError("Router chain not initialized")
        
        start_time = asyncio.get_event_loop().time()
        trace_id = str(uuid.uuid4())
        
        # Emit trace start event
        if self.trace_emitter and context.prompt.session_id:
            await self.trace_emitter.emit_router_trace(
                session_id=context.prompt.session_id,
                trace_id=trace_id,
                query=context.prompt.prompt,
                user_id=context.user_id,
                timestamp=context.timestamp,
                steps=[],
                final_agent=AgentType.GENERAL,  # Will be updated
                total_latency_ms=0.0,  # Will be updated
                metadata={"request_id": context.request_id}
            )
        
        result = await self.head.process(context)
        
        if not result:
            # This should not happen with fallback node
            raise RuntimeError("No routing decision made")
        
        # Apply strategy selection if we have a routing result
        agent_type = await self.strategy_selector.select(result, context)
        result.metadata["selected_agent"] = agent_type.value
        
        elapsed_ms = (asyncio.get_event_loop().time() - start_time) * 1000
        result.metadata["routing_latency_ms"] = elapsed_ms
        
        # Emit final trace event with complete routing decision
        if self.trace_emitter and context.prompt.session_id:
            await self.trace_emitter.emit_router_decision(
                session_id=context.prompt.session_id,
                trace_id=trace_id,
                final_agent=agent_type,
                confidence=result.confidence,
                intent=result.intent,
                method=result.routing_method.value,
                total_latency_ms=elapsed_ms,
                metadata=result.metadata
            )
        
        logger.info(
            "Routing completed",
            intent=result.intent,
            method=result.routing_method.value,
            agent=agent_type.value,
            confidence=result.confidence,
            latency_ms=elapsed_ms
        )
        
        return result


class StrategySelector:
    """Strategy pattern implementation for final agent selection."""
    
    def __init__(self):
        self.strategies: Dict[str, Any] = {}
    
    async def select(self, intent_result: IntentResult, context: RequestContext) -> AgentType:
        """Select the appropriate agent based on intent and context."""
        _ = context  # Context may be used for future strategy improvements
        
        # For now, extract agent type from metadata
        agent_type_str = intent_result.metadata.get("agent_type", AgentType.GENERAL.value)
        
        try:
            return AgentType(agent_type_str)
        except ValueError:
            logger.warning(f"Invalid agent type: {agent_type_str}, using GENERAL")
            return AgentType.GENERAL


# Simplified routing rules for fallback when LLM classification fails
SIMPLIFIED_ROUTING_RULES = [
    # Basic technical support patterns
    RoutingRule(
        pattern=r"\b(bug|broken|error|crash|login.*problem|system.*down|can't.*log|won't.*work)\b",
        agent_type=AgentType.SUPPORT,
        intent="support_request",
        priority=15
    ),
    # HR patterns - high priority for specific HR keywords
    RoutingRule(
        pattern=r"\b(benefits|benefit|PTO|vacation|time\s+off|payroll|UKG|employee\s+handbook|handbook|performance\s+review|HR\s+policy|time\s+tracking|benefits\s+enrollment)\b",
        agent_type=AgentType.HR,
        intent="hr_inquiry",
        priority=15
    ),
    # Basic lease patterns  
    RoutingRule(
        pattern=r"\b(rent|lease|apartment|tenant|landlord|deposit)\b",
        agent_type=AgentType.LEASE,
        intent="lease_inquiry",
        priority=10
    ),
    # Basic sales patterns
    RoutingRule(
        pattern=r"\b(buy|sell|purchase|property|house|sale)\b",
        agent_type=AgentType.SALES,
        intent="sales_inquiry",
        priority=10
    ),
    # Greetings
    RoutingRule(
        pattern=r"\b(hello|hi|hey|good morning|good afternoon)\b",
        agent_type=AgentType.GENERAL,
        intent="greeting",
        priority=5
    ),
]


# Default routing rules (keeping the original complex ones for reference)
DEFAULT_ROUTING_RULES = [
    # Highest priority: Technical issues with lease/rental systems
    RoutingRule(
        pattern=r"(rental.*application.*system|application.*system|system.*(?:bug|broken|issue)).*(?:lease|rent)|(?:lease|rent).*(?:system.*(?:bug|broken|issue)|application.*system)",
        agent_type=AgentType.SUPPORT,
        intent="support_request",
        priority=20
    ),
    # High-priority lease-specific terms (security deposit, landlord, etc.)
    RoutingRule(
        pattern=r"(landlord|security deposit|deposit.*return|sublease)",
        agent_type=AgentType.LEASE,
        intent="lease_inquiry",
        priority=15
    ),
    # Mixed intent with primary purchase focus
    RoutingRule(
        pattern=r"\b(buy|purchase).*property.*(?:to\s+)?(?:lease|rent)",
        agent_type=AgentType.SALES,
        intent="sales_inquiry",
        priority=12
    ),
    # Multiple keywords - prioritize sales when "buy" and "house" are present
    RoutingRule(
        pattern=r"\b(buy|purchase).*house.*(?:lease|apartment|support|help)",
        agent_type=AgentType.SALES,
        intent="sales_inquiry",
        priority=12
    ),
    # Standard patterns with adjusted priorities
    RoutingRule(
        pattern=r"(lease|rent|apartment|housing|tenant)",
        agent_type=AgentType.LEASE,
        intent="lease_inquiry",
        priority=10
    ),
    RoutingRule(
        pattern=r"(buy|purchase|sell|property|real estate)",
        agent_type=AgentType.SALES,
        intent="sales_inquiry",
        priority=10
    ),
    RoutingRule(
        pattern=r"(help|support|issue|problem|broken|fix)",
        agent_type=AgentType.SUPPORT,
        intent="support_request",
        priority=10
    ),
    RoutingRule(
        pattern=r"\b(hello|hi|hey|good morning|good afternoon)\b",
        agent_type=AgentType.GENERAL,
        intent="greeting",
        priority=5
    ),
]


# Agent descriptions for LLM routing
DEFAULT_AGENT_DESCRIPTIONS = {
    AgentType.LEASE: "Handles all questions about leasing apartments, rental applications, lease terms, tenant inquiries, property management, and lease document analysis",
    AgentType.SALES: "Manages property sales, purchases, real estate transactions, market analysis, investment opportunities, and property valuations",
    AgentType.SUPPORT: "Provides technical support, troubleshooting assistance, system issues, account management, platform guidance, and error resolution",
    AgentType.HR: "Handles employee-related inquiries including vacation time, PTO requests, benefits, payroll, UKG system support, performance reviews, employee policies, and workplace support",
    AgentType.GENERAL: "Handles general inquiries, greetings, basic information requests, platform orientation, and questions that don't fit other specialized categories",
    AgentType.MARKETING: "Assists with marketing campaigns, brand strategy, promotional activities, customer acquisition analysis, and advertising initiatives",
    AgentType.ANALYTICS: "Provides data analysis, business intelligence, reporting, statistical analysis, performance metrics, and data-driven insights",
}