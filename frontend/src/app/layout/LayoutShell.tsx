import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, CssBaseline, useTheme, Container, useMediaQuery } from '@mui/material';
import TopNav from './TopNav';
import Sidebar from '../../core/chat/Sidebar';
import ChatInterface from '../../core/chat/ChatInterface';
import ChatErrorBoundary from '../../shared/components/ErrorBoundary';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../shared/store';
import { addMessage, clearChat, setActiveSession, assistantResponseFinished, setError, createFolder, updateSessionTitle, startWorkflow, ChatMessage } from '../../core/chat/chat/chatSlice';
import { useAgentQueryMutation } from '../../core/chat/chat/chatApi';
import { useCreateSessionMutation } from '../../core/chat/chat/sessionsApi';
import { useParams, useNavigate } from 'react-router-dom';


interface LayoutShellProps {
  toggleTheme?: () => void;
  isNewSession?: boolean;
  initialAgent?: string;
}

const LayoutShell: React.FC<LayoutShellProps> = ({ toggleTheme, isNewSession = false, initialAgent }) => {
  const theme = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.chat.isLoading);
  const routingMetadata = useSelector((state: RootState) => state.chat.routingMetadata);
  const [triggerAgentQuery] = useAgentQueryMutation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Canvas functionality placeholder
  const isCanvasOpen = false;
  const drawerWidth = useMemo(() => isSidebarCollapsed ? 0 : 240, [isSidebarCollapsed]);
  const { sessionId, agentId: paramAgentId } = useParams<{ sessionId?: string; agentId?: string }>();
  const sessions = useSelector((state: RootState) => state.chat.sessions);
  const folders = useSelector((state: RootState) => state.chat.folders);
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  
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
      dispatch(clearChat());
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
      dispatch(createFolder("Default"));
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
    
    // We need an active session before we can add messages
    let currentSessionId = activeSessionId || '';
    console.log('📋 Current session ID:', currentSessionId);
    
    if (!currentSessionId) {
      try {
        console.log('🆕 Creating new session...');
        const title = text.length <= 30 ? text : text.substring(0,27) + '...';
        const result = await createSession({ title }).unwrap();
        currentSessionId = result.session_id;

        console.log('✅ Session created:', currentSessionId);
        dispatch(setActiveSession(currentSessionId));
        dispatch(updateSessionTitle({ sessionId: currentSessionId, title }));
        navigate(`/chat/${currentSessionId}`);
        // Give backend a brief moment to make the session visible for /agent/query
        await new Promise(r => setTimeout(r, 300));
      } catch (error) {
        console.error('❌ Failed to create new session:', error);
        dispatch(setError('Failed to create a new session. Please try again.'));
        return;
      }
    }

    // Now that we have a session, add the user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
      agent,
      temp: false, // Don't mark as temp to avoid filtering issues
    };
    
    console.log('💬 Adding user message:', userMessage);
    dispatch(addMessage(userMessage));

    // Trigger the query with session_id
    console.log('🚀 Triggering agent query...');
    triggerAgentQuery({ 
      session_id: currentSessionId, 
      query: text, 
      explicit_agent: agent
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
    
    // Start the workflow in the chat state
    dispatch(startWorkflow({ 
      workflowId, 
      name: workflowId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      agentIds 
    }));
    
    // Send the workflow trigger message if we have a prompt
    if (params?.prompt) {
      // Add a system message to show the workflow is starting
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        text: `🔄 **Workflow Started:** ${workflowId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n**Agents Involved:** ${agentIds.join(', ')}\n\n**Status:** Initializing...`,
        sender: 'system',
        timestamp: new Date().toISOString(),
        temp: false
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
    
    // Manually handle stopping the response
    dispatch(assistantResponseFinished());
    
    // Add a message to indicate the request was stopped
    dispatch(setError("Response generation stopped by user"));
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
                  onSendMessage={handleSendMessage} 
                  isLoading={isLoading} 
                  onWorkflowTrigger={handleWorkflowTrigger}
                  sessionId={activeSessionId}
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