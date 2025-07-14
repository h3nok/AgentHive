/**
 * Agent types matching the backend schema
 */
export enum AgentType {
  LEASE = "lease",
  GENERAL = "general", 
  SALES = "sales",
  SUPPORT = "support",
  HR = "hr",
  FINANCE = "finance",
  IT = "it",
  MARKETING = "marketing",
  ANALYTICS = "analytics",
  CUSTOM = "custom"
}

/**
 * Routing methods for intelligent routing
 */
export enum RoutingMethod {
  REGEX = "regex",
  ML_CLASSIFIER = "ml_classifier", 
  LLM_ROUTER = "llm_router",
  FALLBACK = "fallback"
}

/**
 * Agent metadata for UI display
 */
export interface AgentMetadata {
  id: AgentType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  emoji: string;
  capabilities: string[];
}
