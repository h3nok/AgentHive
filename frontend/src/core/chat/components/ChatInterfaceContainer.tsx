import React, { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { Box, useTheme, IconButton, Tooltip, Fade, Paper, Typography, Chip, alpha } from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../shared/store';
import type { RootState } from '../../../shared/store';
import { selectMessagesBySession, setActiveSession } from '../../../shared/store/slices/entitiesSlice';

// Modular Components
import ChatMessageArea from './ChatMessageArea';
import ChatInputSection from './ChatInputSection';
import AutomationPanel from './AutomationPanel';
import FloatingActionButtons from './FloatingActionButtons';

// Revolutionary Agentic Interface (lazy loaded)
const AgenticChatInterface = lazy(() => import('./AgenticChatInterface'));

// Types
import type {
  ChatInterfaceProps,
  ChatInterfaceHandlers,
  ChatInterfaceState,
  QuickAction,
  SmartSuggestion,
  CurrentWorkflow
} from './types';

const ChatInterfaceContainer: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  isLoading = false,
  messages: propMessages = [],
  sessionId,
  onWorkflowTrigger,
  enterpriseMode = false,
  activeWorkflows = 0,
  onNavigateToWorkflows,
  onNavigateToAgents,
  currentAgent,
  agenticMode = false,
  showAgentConsciousness = false,
  enableSwarmVisualization = false
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  // Enhanced local state management with agentic integration
  const [state, setState] = useState<ChatInterfaceState>({
    inputValue: '',
    showSuggestions: false,
    isAutomationDrawerOpen: false,
    selectedAgent: null,
    // Agentic interface state
    agentConsciousnessVisible: showAgentConsciousness,
    swarmVisualizationActive: enableSwarmVisualization,
    spatialLayoutMode: agenticMode ? 'constellation' : 'traditional'
  });

  // Agentic mode state management
  const [agenticState, setAgenticState] = useState({
    isAgenticMode: agenticMode,
    isTransitioning: false,
    showAgenticHint: false,
    detectedMultiAgent: false,
    preloadedComponents: false
  });

  // Get current session and messages from Redux state
  const activeSessionId = useAppSelector((state: RootState) => (state as any).entities?.activeSessionId);
  const allSessions = useAppSelector(useCallback((state: RootState) => Object.values((state as any).entities?.sessions?.entities || {}), []));
  
  // Determine effective session id: props -> active -> first available
  const currentSessionId = useMemo(() => {
    if (sessionId) return sessionId;
    if (activeSessionId) return activeSessionId;
    return allSessions.length > 0 ? allSessions[0].id : null;
  }, [sessionId, activeSessionId, allSessions]);
  
  // Get messages from Redux state for the current session
  const reduxMessages = useAppSelector((state: RootState) => {
    if (!currentSessionId) return [];
    return selectMessagesBySession(state, currentSessionId);
  });
  
  // Use props messages if provided, otherwise use Redux messages
  const messages = useMemo(() => {
    const messagesToUse = propMessages.length > 0 ? propMessages : reduxMessages;
    // Filter out temporary messages that might cause duplicates
    return messagesToUse.filter((msg: any, index: number, arr: any[]) => {
      if (!(msg as any).temp) return true;
      return !arr.some(otherMsg => !(otherMsg as any).temp && (otherMsg as any).text === (msg as any).text);
    });
  }, [propMessages, reduxMessages]);
  
  // When there is no activeSessionId but sessions exist, set the first one as active
  useEffect(() => {
    if (!activeSessionId && allSessions.length > 0) {
      dispatch(setActiveSession(allSessions[0].id));
    }
  }, [activeSessionId, allSessions, dispatch]);

  // Get active session info
  const activeSession = useMemo(() => 
    currentSessionId ? (allSessions as any[]).find((s: any) => s.id === currentSessionId) : null, 
    [currentSessionId, allSessions]
  );
  
  const currentWorkflow: CurrentWorkflow | undefined = (activeSession as any)?.workflow;

  // Event handlers
  const handlers: ChatInterfaceHandlers = {
    onSendMessage: useCallback((message: string, agent?: string, workflow?: string) => {
      onSendMessage(message, agent, workflow);
      setState(prev => ({ ...prev, inputValue: '', showSuggestions: false }));
    }, [onSendMessage]),

    onQuickAction: useCallback((action: QuickAction) => {
      console.log('Quick action triggered:', action);
      onSendMessage(action.prompt, currentAgent?.id);
    }, [onSendMessage, currentAgent]),

    onSuggestionClick: useCallback((suggestion: SmartSuggestion) => {
      console.log('Suggestion clicked:', suggestion);
      onSendMessage(suggestion.text, currentAgent?.id);
      setState(prev => ({ ...prev, showSuggestions: false }));
    }, [onSendMessage, currentAgent]),

    onToggleAutomationDrawer: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        isAutomationDrawerOpen: !prev.isAutomationDrawerOpen 
      }));
    }, []),

    onNavigateToWorkflows,
    onNavigateToAgents,
    onWorkflowTrigger
  };

  // State update helpers
  const updateInputValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, inputValue: value }));
  }, []);

  const toggleSuggestions = useCallback((show?: boolean) => {
    setState(prev => ({ ...prev, showSuggestions: show ?? !prev.showSuggestions }));
  }, []);

  // Multi-agent activity detection
  useEffect(() => {
    // Simulate multi-agent detection logic
    const activeAgentCount = messages.filter((msg: any) => 
      msg.role === 'assistant' && msg.agentId
    ).length;
    
    const hasMultipleAgents = activeAgentCount > 1;
    
    setAgenticState(prev => ({
      ...prev,
      detectedMultiAgent: hasMultipleAgents,
      showAgenticHint: hasMultipleAgents && !prev.isAgenticMode && !prev.preloadedComponents
    }));
    
    // Preload agentic components when multi-agent detected
    if (hasMultipleAgents && !agenticState.preloadedComponents) {
      const timer = setTimeout(() => {
        import('./AgenticChatInterface').then(() => {
          setAgenticState(prev => ({ ...prev, preloadedComponents: true }));
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, agenticState.isAgenticMode, agenticState.preloadedComponents]);

  // Agentic mode toggle handler
  const handleAgenticModeToggle = useCallback(() => {
    setAgenticState(prev => ({
      ...prev,
      isTransitioning: true,
      showAgenticHint: false
    }));
    
    setTimeout(() => {
      setAgenticState(prev => ({
        ...prev,
        isAgenticMode: !prev.isAgenticMode,
        isTransitioning: false
      }));
    }, 300);
  }, []);

  // Enhanced handlers with agentic integration
  const handleSendMessageWithAgenticSupport = useCallback((message: string, agent?: string, workflow?: string) => {
    onSendMessage(message, agent, workflow);
    setState(prev => ({ ...prev, inputValue: '', showSuggestions: false }));
    
    // Track message for multi-agent detection
    setAgenticState(prev => ({ ...prev, showAgenticHint: false }));
  }, [onSendMessage]);

  // Render agentic mode interface
  if (agenticState.isAgenticMode) {
    return (
      <Suspense 
        fallback={
          <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: theme.palette.mode === 'dark'
              ? `radial-gradient(ellipse at center, ${alpha('#0d1421', 0.95)}, ${alpha('#000', 1)})`
              : `radial-gradient(ellipse at center, ${alpha('#f8fafc', 0.95)}, ${alpha('#e2e8f0', 1)})`
          }}>
            <Typography>Loading Agentic Interface...</Typography>
          </Box>
        }
      >
        <AgenticChatInterface
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          messages={messages}
          sessionId={currentSessionId}
          enterpriseMode={enterpriseMode}
          currentAgent={currentAgent}
          onStandardModeRequest={handleAgenticModeToggle}
        />
      </Suspense>
    );
  }

  // Standard chat interface with agentic hints and smooth transition
  return (
    <Fade in={!agenticState.isTransitioning}>
      <Box sx={{ height: '100vh', display: 'flex', position: 'relative' }}>
        {/* Agentic Mode Toggle Controls */}
        {(agenticState.showAgenticHint || agenticState.detectedMultiAgent) && (
          <Fade in timeout={800}>
            <Paper
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 2,
                zIndex: 1000,
                cursor: 'pointer'
              }}
              onClick={handleAgenticModeToggle}
            >
              <Psychology 
                sx={{ 
                  fontSize: 20, 
                  color: theme.palette.primary.main,
                  animation: 'pulse 2s ease-in-out infinite'
                }} 
              />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  🧠 Multiple agents detected
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>
                  Switch to Agentic Mode to see them collaborate
                </Typography>
              </Box>
              <Chip 
                label="Switch" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Paper>
          </Fade>
        )}
        
        {/* Standard Agentic Toggle (always visible for easy access) */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: agenticState.showAgenticHint || agenticState.detectedMultiAgent ? 20 : 20,
            zIndex: 999,
          }}
        >
          <Tooltip title={"Toggle Agentic Mode"}>
            <IconButton
              onClick={handleAgenticModeToggle}
              sx={{
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              <Psychology sx={{ color: theme.palette.primary.main }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Floating Action Buttons */}
        <FloatingActionButtons
          isAutomationDrawerOpen={state.isAutomationDrawerOpen}
          onToggleAutomationDrawer={handlers.onToggleAutomationDrawer}
          onNavigateToAgents={handlers.onNavigateToAgents}
          onNavigateToWorkflows={handlers.onNavigateToWorkflows}
          showNavigationButtons={false} // Set to true to enable navigation buttons
        />

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(18, 18, 18, 0.7)' 
          : 'rgba(255, 255, 255, 0.4)',
      }}>
        {/* Chat Messages Area */}
        <ChatMessageArea
          messages={messages}
          isLoading={isLoading}
          currentWorkflow={currentWorkflow}
        />

        {/* Input Section at Bottom */}
        <Box sx={{ 
          px: 3, 
          pb: 2,
          bgcolor: 'transparent',
        }}>
          <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
            <ChatInputSection
              onSendMessage={handleSendMessageWithAgenticSupport}
              isLoading={isLoading}
              inputValue={state.inputValue}
              showSuggestions={state.showSuggestions}
              currentAgent={currentAgent}
              onQuickAction={handlers.onQuickAction}
              onSuggestionClick={handlers.onSuggestionClick}
              enterpriseMode={enterpriseMode}
            />
          </Box>
        </Box>
      </Box>

      {/* Right-hand Automation Panel */}
      <AutomationPanel
        isOpen={state.isAutomationDrawerOpen}
        onClose={() => setState(prev => ({ ...prev, isAutomationDrawerOpen: false }))}
        enterpriseMode={enterpriseMode}
        activeWorkflows={activeWorkflows}
        onNavigateToWorkflows={handlers.onNavigateToWorkflows}
        onQuickAction={handlers.onQuickAction}
      >
        {/* Enhanced automation panel with agentic preview hints */}
        {agenticState.detectedMultiAgent && (
          <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.8rem' }}>
              🤖 Multi-Agent Activity Detected
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.8 }}>
              Multiple AI agents are collaborating on this conversation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {Array.from(new Set(
                messages
                  .filter((msg: any) => msg.role === 'assistant' && msg.agentId)
                  .map((msg: any) => msg.agentId)
              )).map((agentId) => (
                <Chip
                  key={agentId}
                  label={agentId}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              ))}
            </Box>
          </Box>
        )}
      
        {/* Standard Agentic Toggle (always visible for easy access) */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: agenticState.showAgenticHint || agenticState.detectedMultiAgent ? 340 : 20,
            zIndex: 999,
          }}
        >
          <Tooltip title={"Toggle Agentic Mode"}>
            <IconButton
              onClick={handleAgenticModeToggle}
              sx={{
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              <Psychology sx={{ color: theme.palette.primary.main }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Floating Action Buttons */}
        <FloatingActionButtons
          isAutomationDrawerOpen={state.isAutomationDrawerOpen}
          onToggleAutomationDrawer={handlers.onToggleAutomationDrawer}
          onNavigateToAgents={handlers.onNavigateToAgents}
          onNavigateToWorkflows={handlers.onNavigateToWorkflows}
          showNavigationButtons={false} // Set to true to enable navigation buttons
        />

        {/* Main Content Area */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.7)' 
            : 'rgba(255, 255, 255, 0.4)',
        }}>
          {/* Chat Messages Area */}
          <ChatMessageArea
            messages={messages}
            isLoading={isLoading}
            currentWorkflow={currentWorkflow}
          />

          {/* Input Section at Bottom */}
          <Box sx={{ 
            px: 3, 
            pb: 2,
            bgcolor: 'transparent',
          }}>
            <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
              <ChatInputSection
                onSendMessage={handleSendMessageWithAgenticSupport}
                isLoading={isLoading}
                inputValue={state.inputValue}
                showSuggestions={state.showSuggestions}
                currentAgent={currentAgent}
                onQuickAction={handlers.onQuickAction}
                onSuggestionClick={handlers.onSuggestionClick}
                enterpriseMode={enterpriseMode}
              />
            </Box>
          </Box>
        </Box>

        {/* Right-hand Automation Panel */}
        <AutomationPanel
          isOpen={state.isAutomationDrawerOpen}
          onClose={() => setState(prev => ({ ...prev, isAutomationDrawerOpen: false }))}
          enterpriseMode={enterpriseMode}
          activeWorkflows={activeWorkflows}
          onNavigateToWorkflows={handlers.onNavigateToWorkflows}
          onQuickAction={handlers.onQuickAction}
        >
          {/* Enhanced automation panel with agentic preview hints */}
          {agenticState.detectedMultiAgent && (
            <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.8rem' }}>
                🤖 Multi-Agent Activity Detected
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.8 }}>
                Multiple AI agents are collaborating on this conversation.
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {Array.from(new Set(
                  messages
                    .filter((msg: any) => msg.role === 'assistant' && msg.agentId)
                    .map((msg: any) => msg.agentId)
                )).map((agentId) => (
                  <Chip
                    key={agentId}
                    label={agentId}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.65rem', height: 18 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </AutomationPanel>
      </Box>
    </Fade>
  );

export default ChatInterfaceContainer;
