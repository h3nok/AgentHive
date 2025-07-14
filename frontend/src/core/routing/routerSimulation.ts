/**
 * Enhanced Router Simulation Service
 * 
 * This service provides comprehensive mock router functionality with:
 * - Multiple routing algorithms (LLM, regex, fallback)
 * - Dynamic confidence scoring based on query analysis
 * - Simulated latency and performance metrics
 * - Agent distribution and routing decision logic
 */

import { RouterTrace, RouterStep } from '../features/routerTrace/routerTraceSlice';
import { AgentType, RoutingMethod } from '../types/agent';

export interface RoutingDecision {
  selectedAgent: AgentType;
  confidence: number;
  intent: string;
  method: RoutingMethod;
  reasoning: string;
  latency: number;
  metadata?: Record<string, unknown>;
}

export interface SimulationConfig {
  enableLearningOptimization: boolean;
  preferredMethod: RoutingMethod | 'auto';
  confidenceThreshold: number;
  simulateLatency: boolean;
  errorRate: number; // Percentage of requests that should fail
}

class RouterSimulationService {
  private decisionHistory: RoutingDecision[] = [];
  private agentPerformance: Record<AgentType, { requests: number; avgConfidence: number; avgLatency: number }> = {
    [AgentType.HR]: { requests: 0, avgConfidence: 0, avgLatency: 0 },
    [AgentType.SALES]: { requests: 0, avgConfidence: 0, avgLatency: 0 },
    [AgentType.SUPPORT]: { requests: 0, avgConfidence: 0, avgLatency: 0 },
    [AgentType.GENERAL]: { requests: 0, avgConfidence: 0, avgLatency: 0 },
    [AgentType.CUSTOM]: { requests: 0, avgConfidence: 0, avgLatency: 0 },
    [AgentType.MARKETING]: { requests: 0, avgConfidence: 0, avgLatency: 0 },
    [AgentType.ANALYTICS]: { requests: 0, avgConfidence: 0, avgLatency: 0 },
  };

  private config: SimulationConfig = {
    enableLearningOptimization: true,
    preferredMethod: 'auto',
    confidenceThreshold: 0.7,
    simulateLatency: true,
    errorRate: 5,
  };

  // Regex patterns for different agents
  private regexPatterns = {
    [AgentType.HR]: /\b(hr|human resources|employee|benefits|payroll|vacation|sick leave|time off|onboarding|performance|training|policy|compliance)\b/i,
    [AgentType.SALES]: /\b(buy|sell|purchase|price|cost|revenue|sales|customer|acquisition|conversion|marketing|campaign)\b/i,
    [AgentType.SUPPORT]: /\b(help|support|issue|problem|bug|error|technical|account|login|troubleshoot|assistance)\b/i,
    [AgentType.GENERAL]: /\b(explain|what|how|why|when|where|define|describe|tell me|information|knowledge)\b/i,
  };

  /**
   * Simulate intelligent routing decision
   */
  async simulateRouting(query: string, context?: Record<string, unknown>): Promise<RoutingDecision> {
    const startTime = Date.now();
    
    // Simulate potential failure
    if (Math.random() * 100 < this.config.errorRate) {
      throw new Error('Router simulation error: Service temporarily unavailable');
    }

    let method: RoutingMethod;
    let selectedAgent: AgentType;
    let confidence: number;
    let reasoning: string;

    // Determine routing method
    if (this.config.preferredMethod === 'auto') {
      method = this.selectOptimalMethod(query);
    } else {
      method = this.config.preferredMethod as RoutingMethod;
    }

    // Route based on method
    switch (method) {
      case RoutingMethod.REGEX:
        ({ agent: selectedAgent, confidence, reasoning } = this.routeByRegex(query));
        break;
      case RoutingMethod.LLM_ROUTER:
        ({ agent: selectedAgent, confidence, reasoning } = this.routeByLLM(query, context));
        break;
      case RoutingMethod.ML_CLASSIFIER:
        ({ agent: selectedAgent, confidence, reasoning } = this.routeByMLClassifier(query));
        break;
      default:
        ({ agent: selectedAgent, confidence, reasoning } = this.routeByFallback(query));
        method = RoutingMethod.FALLBACK;
    }

    // Apply learning optimization if enabled
    if (this.config.enableLearningOptimization) {
      ({ agent: selectedAgent, confidence } = this.applyLearningOptimization(selectedAgent, confidence, query));
    }

    // Simulate latency
    const latency = this.config.simulateLatency ? this.simulateLatency(method) : 0;
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, latency));
    }

    const decision: RoutingDecision = {
      selectedAgent,
      confidence,
      intent: this.extractIntent(query),
      method,
      reasoning,
      latency: Date.now() - startTime,
      metadata: {
        queryLength: query.length,
        timestamp: new Date().toISOString(),
        context,
      },
    };

    // Update performance tracking
    this.updatePerformanceMetrics(decision);
    this.decisionHistory.push(decision);

    return decision;
  }

  /**
   * Route using regex patterns
   */
  private routeByRegex(query: string): { agent: AgentType; confidence: number; reasoning: string } {
    const scores: Record<AgentType, number> = {
      [AgentType.HR]: 0,
      [AgentType.SALES]: 0, 
      [AgentType.SUPPORT]: 0,
      [AgentType.GENERAL]: 0,
      [AgentType.CUSTOM]: 0,
      [AgentType.MARKETING]: 0,
      [AgentType.ANALYTICS]: 0,
    };

    // Score based on pattern matches
    Object.entries(this.regexPatterns).forEach(([agent, pattern]) => {
      const matches = query.match(pattern);
      if (matches) {
        scores[agent as AgentType] += matches.length * 0.3;
      }
    });

    // Find best match
    const bestAgent = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as AgentType] > scores[b[0] as AgentType] ? a : b
    )[0] as AgentType;

    const confidence = Math.min(scores[bestAgent] / query.split(' ').length, 0.95);
    
    return {
      agent: confidence > 0.2 ? bestAgent : AgentType.GENERAL,
      confidence: confidence > 0.2 ? confidence : 0.3,
      reasoning: confidence > 0.2 
        ? `Regex pattern match for ${bestAgent} with ${Math.round(confidence * 100)}% confidence`
        : 'No strong pattern match, defaulting to general agent'
    };
  }

  /**
   * Route using simulated LLM analysis
   */
  private routeByLLM(query: string, context?: Record<string, unknown>): { agent: AgentType; confidence: number; reasoning: string } {
    const queryLower = query.toLowerCase();
    
    // Simulate LLM understanding with more sophisticated analysis
    const intentSignals: Record<string, number> = {
      lease: this.analyzeLeaseIntent(queryLower),
      sales: this.analyzeSalesIntent(queryLower),
      support: this.analyzeSupportIntent(queryLower),
      general: this.analyzeGeneralIntent(queryLower),
    };

    // Factor in context if available
    if (context?.previousAgent) {
      const prevAgent = context.previousAgent as AgentType;
      const agentKey = prevAgent.toLowerCase();
      if (intentSignals[agentKey] !== undefined) {
        intentSignals[agentKey] += 0.1; // Slight boost for conversation continuity
      }
    }

    const bestIntent = Object.entries(intentSignals).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );

    const selectedAgent = this.mapIntentToAgent(bestIntent[0]);
    const confidence = Math.min(bestIntent[1], 0.98);

    return {
      agent: selectedAgent,
      confidence,
      reasoning: `LLM analysis detected ${bestIntent[0]} intent with ${Math.round(confidence * 100)}% confidence`
    };
  }

  /**
   * Route using simulated ML classifier
   */
  private routeByMLClassifier(query: string): { agent: AgentType; confidence: number; reasoning: string } {
    // Simulate ML feature extraction
    const features = {
      wordCount: query.split(' ').length,
      hasQuestion: /[?]/.test(query),
      hasNumbers: /\d/.test(query),
      avgWordLength: query.split(' ').reduce((sum, word) => sum + word.length, 0) / query.split(' ').length,
      sentiment: this.analyzeSentiment(query),
    };

    // Simulate ML prediction with feature weights
    const predictions = {
      [AgentType.HR]: this.calculateMLScore(features, 'hr'),
      [AgentType.SALES]: this.calculateMLScore(features, 'sales'),
      [AgentType.SUPPORT]: this.calculateMLScore(features, 'support'),
      [AgentType.GENERAL]: this.calculateMLScore(features, 'general'),
    };

    const bestPrediction = Object.entries(predictions).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );

    return {
      agent: bestPrediction[0] as AgentType,
      confidence: bestPrediction[1],
      reasoning: `ML classifier prediction based on linguistic features`
    };
  }

  /**
   * Fallback routing
   */
  private routeByFallback(query: string): { agent: AgentType; confidence: number; reasoning: string } {
    // Simple length-based fallback
    if (query.length > 100) {
      return {
        agent: AgentType.GENERAL,
        confidence: 0.4,
        reasoning: 'Long query routed to general agent as fallback'
      };
    }

    return {
      agent: AgentType.GENERAL,
      confidence: 0.3,
      reasoning: 'Default fallback to general agent'
    };
  }

  /**
   * Convert RouterTrace format for compatibility
   */
  createRouterTrace(decision: RoutingDecision, sessionId: string): RouterTrace {
    const now = new Date().toISOString();
    
    const steps: RouterStep[] = [
      {
        id: `step-1-${Date.now()}`,
        timestamp: now,
        step: 'Query Analysis',
        agent: decision.selectedAgent,
        confidence: decision.confidence,
        intent: decision.intent,
        method: decision.method === RoutingMethod.LLM_ROUTER ? 'llm_router' : 
                decision.method === RoutingMethod.REGEX ? 'regex' : 'fallback',
        latency_ms: Math.round(decision.latency * 0.3),
        metadata: {
          queryLength: decision.metadata?.queryLength,
          intent: decision.intent,
        },
      },
      {
        id: `step-2-${Date.now()}`,
        timestamp: now,
        step: 'Agent Selection',
        agent: decision.selectedAgent,
        confidence: decision.confidence,
        intent: decision.intent,
        method: decision.method === RoutingMethod.LLM_ROUTER ? 'llm_router' : 
                decision.method === RoutingMethod.REGEX ? 'regex' : 'fallback',
        latency_ms: Math.round(decision.latency * 0.7),
        metadata: {
          method: decision.method,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
        },
      },
    ];

    return {
      id: `trace-${Date.now()}`,
      sessionId,
      query: '', // Will be filled by caller
      timestamp: now,
      totalLatency: decision.latency,
      finalAgent: decision.selectedAgent,
      finalConfidence: decision.confidence,
      steps,
      success: true,
    };
  }

  // Helper methods for intent analysis
  private analyzeLeaseIntent(query: string): number {
    const leaseKeywords = ['lease', 'rent', 'property', 'store', 'location', 'retail', 'space', 'tractor supply'];
    return this.calculateKeywordScore(query, leaseKeywords) * 1.2; // Boost for Enterprise context
  }

  private analyzeSalesIntent(query: string): number {
    const salesKeywords = ['sales', 'revenue', 'customer', 'purchase', 'buy', 'sell', 'price', 'cost'];
    return this.calculateKeywordScore(query, salesKeywords);
  }

  private analyzeSupportIntent(query: string): number {
    const supportKeywords = ['help', 'support', 'issue', 'problem', 'error', 'bug', 'technical'];
    return this.calculateKeywordScore(query, supportKeywords);
  }

  private analyzeGeneralIntent(query: string): number {
    const generalKeywords = ['what', 'how', 'why', 'explain', 'tell me', 'describe', 'information'];
    return this.calculateKeywordScore(query, generalKeywords) + 0.1; // Base score for general
  }

  private calculateKeywordScore(query: string, keywords: string[]): number {
    const words = query.toLowerCase().split(/\s+/);
    const matches = words.filter(word => keywords.some(keyword => word.includes(keyword)));
    return Math.min(matches.length / words.length + matches.length * 0.1, 0.9);
  }

  private mapIntentToAgent(intent: string): AgentType {
    switch (intent) {
      case 'hr': return AgentType.HR;
      case 'sales': return AgentType.SALES;
      case 'support': return AgentType.SUPPORT;
      default: return AgentType.GENERAL;
    }
  }

  private calculateMLScore(features: {
    wordCount: number;
    hasQuestion: boolean;
    hasNumbers: boolean;
    avgWordLength: number;
    sentiment: number;
  }, category: string): number {
    // Simulate ML model predictions with different feature weights
    const weights = {
      lease: { wordCount: 0.1, hasQuestion: 0.2, hasNumbers: 0.3, avgWordLength: 0.1, sentiment: 0.1 },
      sales: { wordCount: 0.2, hasQuestion: 0.1, hasNumbers: 0.4, avgWordLength: 0.1, sentiment: 0.3 },
      support: { wordCount: 0.1, hasQuestion: 0.4, hasNumbers: 0.1, avgWordLength: 0.1, sentiment: 0.4 },
      general: { wordCount: 0.2, hasQuestion: 0.3, hasNumbers: 0.1, avgWordLength: 0.2, sentiment: 0.1 },
    };

    const categoryWeights = weights[category as keyof typeof weights];
    return Math.min(
      Object.entries(categoryWeights).reduce((score, [feature, weight]) => {
        const featureValue = features[feature as keyof typeof features];
        const numericValue = typeof featureValue === 'boolean' ? (featureValue ? 1 : 0) : featureValue;
        return score + numericValue * weight;
      }, 0) + Math.random() * 0.1, // Add some randomness
      0.95
    );
  }

  private analyzeSentiment(query: string): number {
    // Simple sentiment analysis simulation
    const positiveWords = ['good', 'great', 'excellent', 'love', 'like', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'worst', 'problem', 'issue'];
    
    const words = query.toLowerCase().split(/\s+/);
    const positive = words.filter(word => positiveWords.includes(word)).length;
    const negative = words.filter(word => negativeWords.includes(word)).length;
    
    return (positive - negative) / words.length + 0.5; // Normalize to 0-1
  }

  private selectOptimalMethod(query: string): RoutingMethod {
    // Use LLM for complex queries
    if (query.length > 50 && /[?]/.test(query)) {
      return RoutingMethod.LLM_ROUTER;
    }

    // Use regex for keyword-heavy queries
    if (this.hasStrongKeywordSignals(query)) {
      return RoutingMethod.REGEX;
    }

    // Use ML classifier for medium complexity
    return RoutingMethod.ML_CLASSIFIER;
  }

  private applyLearningOptimization(agent: AgentType, confidence: number, query: string): { agent: AgentType; confidence: number } {
    const performance = this.agentPerformance[agent];
    
    // Boost confidence if agent has good historical performance
    if (performance.requests > 5 && performance.avgConfidence > 0.8) {
      confidence = Math.min(confidence * 1.1, 0.99);
    }

    // Consider alternative agent if performance is poor
    if (performance.requests > 10 && performance.avgConfidence < 0.5) {
      const alternativeAgent = this.findAlternativeAgent(query);
      if (alternativeAgent !== agent) {
        return { agent: alternativeAgent, confidence: confidence * 0.9 };
      }
    }

    return { agent, confidence };
  }

  private hasStrongKeywordSignals(query: string): boolean {
    return Object.values(this.regexPatterns).some(pattern => pattern.test(query));
  }

  private findAlternativeAgent(query: string): AgentType {
    // Simple alternative selection based on secondary patterns
    if (/help|support/.test(query.toLowerCase())) return AgentType.SUPPORT;
    if (/general|basic/.test(query.toLowerCase())) return AgentType.GENERAL;
    return AgentType.GENERAL;
  }

  private extractIntent(query: string): string {
    if (/\bwhat\b/.test(query.toLowerCase())) return 'information_request';
    if (/\bhow\b/.test(query.toLowerCase())) return 'instruction_request';
    if (/\bhelp\b/.test(query.toLowerCase())) return 'assistance_request';
    if (/\bshow\b|\blist\b/.test(query.toLowerCase())) return 'data_request';
    return 'general_inquiry';
  }

  private simulateLatency(method: RoutingMethod): number {
    const baseLatency = {
      [RoutingMethod.REGEX]: 50,
      [RoutingMethod.ML_CLASSIFIER]: 150,
      [RoutingMethod.LLM_ROUTER]: 300,
      [RoutingMethod.FALLBACK]: 25,
    };

    // Add random variance
    const variance = baseLatency[method] * 0.3;
    return baseLatency[method] + (Math.random() - 0.5) * variance;
  }

  private updatePerformanceMetrics(decision: RoutingDecision): void {
    const performance = this.agentPerformance[decision.selectedAgent];
    performance.requests++;
    performance.avgConfidence = (performance.avgConfidence * (performance.requests - 1) + decision.confidence) / performance.requests;
    performance.avgLatency = (performance.avgLatency * (performance.requests - 1) + decision.latency) / performance.requests;
  }

  // Public configuration methods
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  getDecisionHistory(): RoutingDecision[] {
    return [...this.decisionHistory];
  }

  getPerformanceMetrics() {
    return {
      agentPerformance: { ...this.agentPerformance },
      totalDecisions: this.decisionHistory.length,
      averageLatency: this.decisionHistory.reduce((sum, d) => sum + d.latency, 0) / this.decisionHistory.length || 0,
      averageConfidence: this.decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / this.decisionHistory.length || 0,
      methodDistribution: this.getMethodDistribution(),
    };
  }

  private getMethodDistribution(): Record<RoutingMethod, number> {
    const distribution = {
      [RoutingMethod.REGEX]: 0,
      [RoutingMethod.ML_CLASSIFIER]: 0,
      [RoutingMethod.LLM_ROUTER]: 0,
      [RoutingMethod.FALLBACK]: 0,
    };

    this.decisionHistory.forEach(decision => {
      distribution[decision.method]++;
    });

    return distribution;
  }

  clearHistory(): void {
    this.decisionHistory = [];
    Object.keys(this.agentPerformance).forEach(agent => {
      this.agentPerformance[agent as AgentType] = { requests: 0, avgConfidence: 0, avgLatency: 0 };
    });
  }
}

// Export singleton instance
export const routerSimulationService = new RouterSimulationService();
export default routerSimulationService;
