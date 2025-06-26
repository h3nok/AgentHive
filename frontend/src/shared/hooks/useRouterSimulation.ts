import { useState, useCallback, useRef } from 'react';
import { useAppDispatch } from '../store';
import { routerSimulationService, RoutingDecision, SimulationConfig } from '../services/routerSimulation';
import { addTrace } from '../features/routerTrace/routerTraceSlice';

export interface UseRouterSimulationResult {
  simulateRouting: (query: string, context?: Record<string, unknown>) => Promise<RoutingDecision>;
  isSimulating: boolean;
  lastDecision: RoutingDecision | null;
  error: string | null;
  config: SimulationConfig;
  updateConfig: (newConfig: Partial<SimulationConfig>) => void;
  clearHistory: () => void;
  getPerformanceMetrics: () => ReturnType<typeof routerSimulationService.getPerformanceMetrics>;
}

/**
 * Hook for router simulation integration
 * Provides methods to simulate routing and manage routing state
 */
export const useRouterSimulation = (): UseRouterSimulationResult => {
  const dispatch = useAppDispatch();
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastDecision, setLastDecision] = useState<RoutingDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);

  const simulateRouting = useCallback(async (
    query: string, 
    context?: Record<string, unknown>
  ): Promise<RoutingDecision> => {
    setIsSimulating(true);
    setError(null);

    try {
      const decision = await routerSimulationService.simulateRouting(query, context);
      setLastDecision(decision);

      // Create router trace for debug drawer
      const trace = routerSimulationService.createRouterTrace(decision, sessionIdRef.current);
      trace.query = query; // Set the query
      
      // Add to router trace state
      dispatch(addTrace(trace));

      return decision;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Router simulation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSimulating(false);
    }
  }, [dispatch]);

  const updateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    routerSimulationService.updateConfig(newConfig);
  }, []);

  const clearHistory = useCallback(() => {
    routerSimulationService.clearHistory();
    setLastDecision(null);
    setError(null);
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return routerSimulationService.getPerformanceMetrics();
  }, []);

  return {
    simulateRouting,
    isSimulating,
    lastDecision,
    error,
    config: routerSimulationService.getConfig(),
    updateConfig,
    clearHistory,
    getPerformanceMetrics,
  };
};

export default useRouterSimulation;
