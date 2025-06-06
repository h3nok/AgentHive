import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, CssBaseline, useTheme, Container, useMediaQuery } from '@mui/material';
import TopNav from './TopNav';
import Sidebar from '@components/Sidebar';
import ChatInterface from './ChatInterface';
import CanvasPanel from './CanvasPanel';
import ChatErrorBoundary from './ChatErrorBoundary';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { addMessage, clearChat, setActiveSession, assistantResponseFinished, setError, createFolder, updateSessionTitle, setCurrentModel } from '../features/chat/chatSlice';
import { useAgentQueryMutation } from '../features/chat/chatApi';
import { useCreateSessionMutation } from '../features/chat/sessionsApi';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanvas } from '../context/CanvasContext';
import RouterDebugDrawer from './RouterDebugDrawer';


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
  const currentModel = useSelector((state: RootState) => state.chat.currentModel);
  const routingMetadata = useSelector((state: RootState) => state.chat.routingMetadata);
  const [triggerAgentQuery] = useAgentQueryMutation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isOpen: isCanvasOpen } = useCanvas();
  const drawerWidth = useMemo(() => isSidebarCollapsed ? 0 : 240, [isSidebarCollapsed]);
  const { sessionId, agentId: paramAgentId } = useParams<{ sessionId?: string; agentId?: string }>();
  const sessions = useSelector((state: RootState) => state.chat.sessions);
  const folders = useSelector((state: RootState) => state.chat.folders);
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  
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
  
  // Handle model selection
  const handleModelChange = useCallback((modelId: string) => {
    dispatch(setCurrentModel(modelId));
  }, [dispatch]);

  const [createSession] = useCreateSessionMutation();
  const navigate = useNavigate();

  // Function to ensure default folder exists
  const ensureDefaultFolder = useCallback(() => {
    if (folders.length === 0) {
      dispatch(createFolder("Default Session"));
      return true; // folder was created
    }
    return false; // no folder needed to be created
  }, [dispatch, folders]);

  const handleSendMessage = useCallback(async (text: string, agent: string = 'lease') => {
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
    if (!currentSessionId) {
      try {
        const title = text.length <= 30 ? text : text.substring(0,27) + '...';
        const result = await createSession({ title }).unwrap();
        currentSessionId = result.session_id;

        dispatch(setActiveSession(currentSessionId));
        dispatch(updateSessionTitle({ sessionId: currentSessionId, title }));
        navigate(`/chat/${currentSessionId}`);
        // Give backend a brief moment to make the session visible for /agent/query
        await new Promise(r => setTimeout(r, 300));
      } catch (error) {
        console.error('Failed to create new session:', error);
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
      temp: true,
    };
    dispatch(addMessage(userMessage));

    // Trigger the query with session_id
    triggerAgentQuery({ 
      session_id: currentSessionId, 
      query: text, 
      agent
    });
  }, [dispatch, triggerAgentQuery, activeSessionId, createSession, navigate, ensureDefaultFolder]);
  
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

  // Convert currentModel from null to undefined for prop compatibility
  const selectedModelForTopNav = currentModel ?? undefined;

  const [debugOpen, setDebugOpen] = useState(false);
  const toggleDebugDrawer = useCallback(() => setDebugOpen(prev => !prev), []);

  // Auto-open debug drawer when routing metadata updates (intelligent routing event)
  useEffect(() => {
    if (routingMetadata && routingMetadata.routing_enabled) {
      setDebugOpen(true);
    }
  }, [routingMetadata]);

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
          onModelChange={handleModelChange}
          selectedModel={selectedModelForTopNav}
          showModelSelector={true}
          showNotifications={true}
          showSearch={false}
          sidebarCollapsed={isSidebarCollapsed}
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
            backgroundColor: theme.palette.background.default,
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
                  onStopRequest={handleStopRequest}
                  initialAgent={resolvedAgentId}
                  drawerPadding={drawerWidth}
                />
              </ChatErrorBoundary>
            </Box>
            <CanvasPanel />
          </Container>
        </Box>
      </Box>



      {/* Router Debug Drawer */}
      <RouterDebugDrawer
        sessionId={activeSessionId || undefined}
        open={debugOpen}
        onClose={toggleDebugDrawer}
      />
    </Box>
  );
};

export default React.memo(LayoutShell);