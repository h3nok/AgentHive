import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, CssBaseline, useTheme, Container, useMediaQuery } from '@mui/material';
import TopNav from './TopNav';
import Sidebar from '../../core/chat/Sidebar';
import ChatInterface from '../../core/chat/ChatInterface';
import ChatErrorBoundary from '../../shared/components/ErrorBoundary';
import { useAppDispatch, useAppSelector } from '../../shared/store';
import { addMessage, setActiveSession, selectMessagesBySession } from '../../shared/store/slices/entitiesSlice';
import { selectIsLoading } from '../../shared/store/slices/uiSlice';
import { chatApi } from '../../core/chat/chat/chatApi';
import { useCreateSessionMutation } from '../../shared/store/api/apiSlice';
import { useParams, useNavigate } from 'react-router-dom';


interface LayoutShellProps {
  toggleTheme?: () => void;
  isNewSession?: boolean;
  initialAgent?: string;
}

const LayoutShell: React.FC<LayoutShellProps> = ({ toggleTheme, isNewSession = false, initialAgent }) => {
  const theme = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);
  
  // Memoized selectors to prevent unnecessary re-renders
  const sessions = useAppSelector(useMemo(() => (state: any) => {
    const sessionIds = state.entities?.sessions?.ids || [];
    return sessionIds.map((id: string) => state.entities.sessions.entities[id]).filter(Boolean);
  }, []));
  const folders = useAppSelector(useMemo(() => (state: any) => (state.entities as any)?.folders || [], []));
  
  const [triggerAgentQuery] = chatApi.useAgentQueryMutation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Canvas functionality placeholder
  const isCanvasOpen = false;
  const drawerWidth = useMemo(() => isSidebarCollapsed ? 0 : 240, [isSidebarCollapsed]);
  const { sessionId, agentId: paramAgentId } = useParams<{ sessionId?: string; agentId?: string }>();
  const activeSessionId = useAppSelector(state => state.entities.activeSessionId);
  
  // DIRECT REDUX STATE INSPECTION - bypassing selectors entirely
  const messages = useAppSelector(state => {
    console.log('🔬 DIRECT STATE INSPECTION: Full Redux state:', state);
    console.log('🔬 DIRECT STATE INSPECTION: state.entities:', state.entities);
    console.log('🔬 DIRECT STATE INSPECTION: state.entities.messages:', state.entities?.messages);
    console.log('🔬 DIRECT STATE INSPECTION: state.entities.messages.entities:', state.entities?.messages?.entities);
    console.log('🔬 DIRECT STATE INSPECTION: state.entities.messages.ids:', state.entities?.messages?.ids);
    
    // Manual message extraction without selectors
    const messageEntities = state.entities?.messages?.entities || {};
    const messageIds = state.entities?.messages?.ids || [];
    const allMessagesRaw = messageIds.map(id => messageEntities[id]).filter(Boolean);
    
    console.log('🔬 DIRECT EXTRACTION: messageIds:', messageIds);
    console.log('🔬 DIRECT EXTRACTION: messageEntities:', messageEntities);
    console.log('🔬 DIRECT EXTRACTION: allMessagesRaw:', allMessagesRaw);
    
    // Filter by session ID manually
    const sessionMessages = activeSessionId 
      ? allMessagesRaw.filter(msg => msg && msg.sessionId === activeSessionId)
      : [];
    
    console.log('🔬 DIRECT FILTERING: activeSessionId:', activeSessionId);
    console.log('🔬 DIRECT FILTERING: sessionMessages:', sessionMessages);
    
    // Compare with selector results
    if (activeSessionId) {
      const selectorResult = selectMessagesBySession(state, activeSessionId);
      console.log('🔬 SELECTOR COMPARISON: selectMessagesBySession result:', selectorResult);
      console.log('🔬 SELECTOR COMPARISON: manual vs selector equal:', JSON.stringify(sessionMessages) === JSON.stringify(selectorResult));
    }
    
    return sessionMessages;
  });
  
  console.log('📋 LayoutShell: Active session:', activeSessionId, 'Messages count:', messages.length);
  console.log('📋 LayoutShell: Actual messages array:', messages);
  
  // Agent status for TopNav
  const [selectedAgent, setSelectedAgent] = useState(initialAgent || 'general');
  const agentStatuses = useMemo(() => [
    { id: 'general', name: 'General Assistant', status: 'ready' as const, confidence: 95 },
    { id: 'technical', name: 'Technical Expert', status: 'ready' as const, confidence: 88 },
    { id: 'business', name: 'Business Analyst', status: 'ready' as const, confidence: 92 },
    { id: 'support', name: 'Support Agent', status: 'ready' as const, confidence: 85 },
  ], []);
  
  // Reference to track if we should stop the response
  const shouldStopRef = useRef<boolean>(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Auto-collapse sidebar when canvas opens for focus
  useEffect(() => {
    if (isCanvasOpen) {
      setIsSidebarCollapsed(true);
    }
  }, [isCanvasOpen]);

  // Clear chat state when isNewSession is true
  useEffect(() => {
    if (isNewSession) {
      // TODO: Implement clearChat equivalent in consolidated store
      console.log('Clear chat requested for new session');
    }
  }, [isNewSession, dispatch]);

  // Sync active session with URL param
  useEffect(() => {
    if (sessionId && !isNewSession) {
      const sessionExists = sessions.some(session => session.id === sessionId);
      if (sessionExists) {
        dispatch(setActiveSession(sessionId));
      }
    } else if (sessions.length > 0 && !activeSessionId) {
      // If no session is active but sessions exist, set the first one as active
      dispatch(setActiveSession(sessions[0].id));
    }
  }, [sessionId, sessions, dispatch, isNewSession, activeSessionId]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);
  
  const [createSession] = useCreateSessionMutation();
  const navigate = useNavigate();

  // Function to ensure default folder exists
  const ensureDefaultFolder = useCallback(() => {
    // Check if we already have any folders
    if (folders.length === 0) {
      // TODO: Implement createFolder equivalent in consolidated store
      console.log('Create default folder requested');
      return true; // folder was created
    }
    
    // Don't create duplicates if folders already exist
    return false; // no folder needed to be created
  }, [dispatch, folders]);

  const handleSendMessage = useCallback(async (text: string, agent: string = selectedAgent) => {
    console.log('🔄 LayoutShell: handleSendMessage called with:', { text, agent, activeSessionId });
    
    // Reset the stop flag
    shouldStopRef.current = false;
    
    // Check if we need to create a default folder first
    const folderCreated = ensureDefaultFolder();
    if (folderCreated) {
      // Wait for the folder to be created before proceeding
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // CRITICAL: Ensure we have an active session ID before proceeding
    let currentSessionId: string = activeSessionId || '';
    if (!currentSessionId) {
      // Create a new session if none exists
      const newSessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
      console.log('🆕 LayoutShell: Creating new session:', newSessionId);
      dispatch(setActiveSession(newSessionId));
      currentSessionId = newSessionId;
      
      // Also ensure the session exists in the store
      try {
        const sessionData = {
          title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        };
        await createSession({ ...sessionData }).unwrap();
      } catch (error) {
        console.error('❌ Failed to create session:', error);
      }
    }
    
    console.log('✅ LayoutShell: Using sessionId:', currentSessionId);
    
    if (!currentSessionId) {
      try {
        console.log('🆕 Creating new session...');
        const title = text.length <= 30 ? text : text.substring(0,27) + '...';
        const result = await createSession({ title }).unwrap();
        currentSessionId = result.session_id;

        console.log('✅ Session created:', currentSessionId);
        dispatch(setActiveSession(currentSessionId));
        console.log('Update session title requested:', { sessionId: activeSessionId, title: title });
        navigate(`/chat/${currentSessionId}`);
        // Give backend a brief moment to make the session visible for /agent/query
        await new Promise(r => setTimeout(r, 300));
      } catch (error) {
        console.error('❌ Failed to create new session:', error);
        console.error('No active session found. Please create a new session.');
        return;
      }
    }

    // Now that we have a session, add the user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: text,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
      sessionId: currentSessionId, // Use the guaranteed non-empty currentSessionId
      agentId: agent,
      status: 'sent' as const
    };
    
    console.log('💬 Adding user message:', userMessage);
    dispatch(addMessage(userMessage));

    // Trigger the query with session_id
    console.log('🚀 Triggering agent query...');
    triggerAgentQuery({ 
      session_id: currentSessionId, 
      query: text, 
      explicit_agent: agent,
      stream: true
    });
  }, [dispatch, triggerAgentQuery, activeSessionId, createSession, navigate, ensureDefaultFolder, selectedAgent]);

  const handleWorkflowTrigger = useCallback(async (workflowId: string, params?: any) => {
    console.log('🔥 LayoutShell: Workflow triggered:', workflowId, params);
    
    // Map quick action IDs to agent sequences
    const workflowAgentMap: Record<string, string[]> = {
      'time-off-request': ['HR Agent', 'Calendar Agent', 'Policy Agent'],
      'expense-report': ['Finance Agent', 'OCR Agent', 'Compliance Agent'],
      'meeting-schedule': ['Calendar Agent', 'Communication Agent'],
      'onboard-employee': ['HR Agent', 'IT Agent', 'Security Agent', 'Training Agent'],
      'contract-review': ['Legal Agent', 'Risk Agent', 'Document Agent'],
      'performance-analysis': ['Analytics Agent', 'Data Agent'],
      'workflow-status': ['Workflow Orchestrator', 'Status Monitor'],
      'emergency-escalation': ['Security Agent', 'Notification Agent', 'Leadership Agent']
    };
    
    const agentIds = workflowAgentMap[workflowId] || ['General Agent'];
    
    // TODO: Implement startWorkflow equivalent in consolidated store
    console.log('Start workflow requested:', { 
      workflowId, 
      name: workflowId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      agentIds 
    });
    
    // Send the workflow trigger message if we have a prompt
    if (params?.prompt) {
      // Add a system message to show the workflow is starting
      const systemMessage = {
        id: `system-${Date.now()}`,
        text: `🔄 **Workflow Started:** ${workflowId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n**Agents Involved:** ${agentIds.join(', ')}\n\n**Status:** Initializing...`,
        sender: 'system' as const,
        timestamp: new Date().toISOString(),
        sessionId: activeSessionId || '',
        agentId: 'system',
        status: 'sent' as const
      };
      dispatch(addMessage(systemMessage));
      
      // Send the actual message to trigger the workflow
      await handleSendMessage(params.prompt, 'workflow-orchestrator');
    }
  }, [dispatch, handleSendMessage]);
  
  // Handler for the stop button
  const handleStopRequest = useCallback(() => {
    // Set the stop flag
    shouldStopRef.current = true;
    
    console.log('Assistant response finished');
    
    // TODO: Implement setError equivalent in consolidated store
    console.log("Response generation stopped by user");
  }, [dispatch]);

  const resolvedAgentId = initialAgent ?? paramAgentId;



  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%', 
      height: '100vh', 
      overflow: 'hidden',
      bgcolor: theme.palette.background.default,
    }}>
      <CssBaseline />
      
      {/* TopNav - Fixed at top */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: theme.zIndex.appBar + 1, // Ensure TopNav is above sidebar
        height: 'var(--nav-h)',
        backgroundColor: 'transparent'
      }}>
        <TopNav 
          toggleTheme={toggleTheme}
          showNotifications={true}
          showSearch={false}
          sidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={setIsSidebarCollapsed}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          agentStatuses={agentStatuses}
        />
      </Box>
      
      {/* Main layout container below nav */}
      <Box sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        paddingTop: 'var(--nav-h)',
      }}>
        {/* Sidebar */}
        <Box sx={{ 
          position: 'relative',
          width: isSidebarCollapsed ? 0 : drawerWidth,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeOut,
            duration: '0.35s',
          }),
          overflow: 'hidden',
        }}>
          <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        </Box>
        
        {/* Main content area */}
        <Box 
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
            minHeight: 0,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(18, 18, 18, 0.8)' // Very transparent dark
              : 'rgba(248, 250, 252, 0.6)', // Very light, transparent background
          }}
        >
          <Container 
            maxWidth={false}
            disableGutters
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'row',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <Box sx={{ 
              flex: 1,
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
              minWidth: 0,
              backgroundColor: theme.palette.background.paper,
            }}>
              <ChatErrorBoundary>
                <ChatInterface 
                  messages={messages}
                  sessionId={activeSessionId}
                  onSendMessage={handleSendMessage} 
                  isLoading={isLoading} 
                  onWorkflowTrigger={handleWorkflowTrigger}
                  enterpriseMode={true}
                  activeWorkflows={0}
                  currentAgent={{
                    id: selectedAgent,
                    name: selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1),
                    status: 'ready'
                  }}
                />
              </ChatErrorBoundary>
            </Box>
          </Container>
        </Box>
      </Box>


    </Box>
  );
};

export default React.memo(LayoutShell);