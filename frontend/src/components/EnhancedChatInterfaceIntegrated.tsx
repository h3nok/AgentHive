// Enhanced ChatInterface with Revolutionary Enterprise Features
import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { 
  Box,
  Container, 
  Toolbar,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material';
import ChatMessageList from './ChatMessageList';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useCanvas } from '../context/CanvasContext';
import { useMediaQuery } from '@mui/material';
import { containerStyles } from '../constants';
import { useGetSessionQuery } from '../features/chat/sessionsApi';
import { useEnterpriseFeatures } from '../hooks/useEnterpriseFeatures';

// Revolutionary Enterprise Components
import { usePredictiveUI } from '../hooks/usePredictiveUI';
import { QuantumMessageContainer } from './QuantumMessageContainer';
import { Chat3DEnvironment } from './Chat3DEnvironment';
import { AdvancedVoiceInterface } from './AdvancedVoiceInterface';
import { ContextualSmartSuggestions } from './ContextualSmartSuggestions';
import { EnterpriseMonitor } from './EnterpriseMonitor';

// Lazy load components
const AgentDrivenChatInput = lazy(() => import('./AgentDrivenChatInput'));

// Import icons
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
  ThreeDRotation as ThreeDIcon,
  ViewInAr as ViewInArIcon,
  RecordVoiceOver as VoiceIcon,
} from '@mui/icons-material';

export interface EnhancedChatInterfaceProps {
  onSendMessage: (text: string, agent: string) => void;
  isLoading: boolean;
  onStopRequest?: () => void;
  drawerPadding?: number;
  initialAgent?: string;
}

// Loading component for suspense fallback
const InputLoadingFallback = () => (
  <Box sx={{ 
    p: 2, 
    display: 'flex', 
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    bgcolor: 'background.paper',
    boxShadow: 1
  }}>
    <CircularProgress size={24} color="primary" />
  </Box>
);

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({ 
  onSendMessage, 
  isLoading,
  onStopRequest,
  drawerPadding = 0,
  initialAgent
}) => {
  const inputBarRef = useRef<HTMLDivElement>(null);
  const { features } = useEnterpriseFeatures();

  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgent ?? "lease");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [is3DMode, setIs3DMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  
  const theme = useTheme();
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  const { isOpen: isCanvasOpen, width: canvasWidth } = useCanvas();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  
  // Revolutionary AI-powered predictive UI
  const { 
    suggestedActions,
    preloadedComponents,
    intentScore,
    nextLikelyInteraction,
    analyzeUserIntent,
    recordInteraction
  } = usePredictiveUI();
  
  // Trigger message fetch for active session
  useGetSessionQuery(activeSessionId!, { skip: !activeSessionId, refetchOnMountOrArgChange: true });

  // Measure input bar height and set CSS variable
  useEffect(() => {
    const el = inputBarRef.current;
    if (!el) return;
    const updateVar = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--input-h', `${h}px`);
    };
    updateVar();
    const ro = new ResizeObserver(updateVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Enhanced message submission with AI context
  const handleSendMessage = useCallback((text: string, agent: string) => {
    setSelectedAgent(agent);
    
    // Update AI context for predictive features
    if (features.predictiveUI) {
      analyzeUserIntent(text, {
        lastMessage: text,
        selectedAgent: agent,
        timestamp: Date.now(),
        messageCount: Date.now(), // This would be actual count in real implementation
      });
    }
    
    onSendMessage(text, agent);
  }, [onSendMessage, features.predictiveUI, analyzeUserIntent]);
  
  // Handle agent selection with AI enhancement
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgent(agentId);
    setSnackbarMessage(`Switched to ${agentId} agent`);
    setSnackbarOpen(true);
    
    // Update predictive context
    if (features.predictiveUI) {
      analyzeUserIntent('', {
        selectedAgent: agentId,
        agentSwitchTime: Date.now(),
      });
    }
  }, [features.predictiveUI, analyzeUserIntent]);
  
  // Handle stop request with enterprise monitoring
  const handleStopRequest = useCallback(() => {
    if (onStopRequest) {
      onStopRequest();
      setSnackbarMessage("Generation stopped");
      setSnackbarOpen(true);
    }
  }, [onStopRequest]);
  
  // Close snackbar
  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  // Enhanced welcome screen with quantum effects
  const renderNoActiveSession = useCallback(() => (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      p: 3,
      textAlign: 'center',
      position: 'relative',
      ...(features.quantumEnhancement && {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%)',
          animation: 'quantumFieldPulse 4s ease-in-out infinite',
        }
      })
    }}>
      <SmartToyIcon sx={{ 
        fontSize: 60, 
        color: 'primary.main', 
        mb: 2,
        ...(features.quantumEnhancement && {
          filter: 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.3))',
          animation: 'neuralPulse 3s ease-in-out infinite',
        })
      }} />
      <Box sx={{ 
        typography: 'h4', 
        mb: 2, 
        fontWeight: 'medium',
        ...(features.quantumEnhancement && {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        })
      }}>
        {features.quantumEnhancement ? '🚀 Quantum-Enhanced Chat Interface' : 'No Active Chat Selected'}
      </Box>
      <Box sx={{ typography: 'body1', mb: 4, maxWidth: 600, color: 'text.secondary' }}>
        {features.quantumEnhancement 
          ? 'Experience revolutionary AI-powered chat with quantum field effects, predictive intelligence, and enterprise-grade monitoring.'
          : 'Select a chat from the sidebar or start a new conversation by typing a message below.'
        }
      </Box>
      
      {/* Enterprise Feature Indicators */}
      {Object.entries(features).some(([_, enabled]) => enabled) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {features.predictiveUI && (
            <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: 'rgba(243, 156, 18, 0.1)', color: '#f39c12' }}>
              🐝 Predictive UI Active
            </Box>
          )}
          {features.voiceInterface && (
            <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: 'rgba(69, 183, 209, 0.1)', color: '#45b7d1' }}>
              🎤 Voice Commands Ready
            </Box>
          )}
          {features.threeDEnvironment && (
            <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: 'rgba(78, 205, 196, 0.1)', color: '#4ecdc4' }}>
              🌐 3D Environment Available
            </Box>
          )}
        </Box>
      )}
    </Box>
  ), [features]);

  // Render messages with quantum enhancement
  const renderMessages = useCallback(() => {
    if (!activeSessionId) {
      return renderNoActiveSession();
    }

    if (features.quantumEnhancement) {
      return (
        <QuantumMessageContainer
          message="Chat interface"
          isStreaming={false}
          sentiment={0}
          complexity={0.5}
          importance={0.8}
        >
          <ChatMessageList activeAgent={selectedAgent} />
        </QuantumMessageContainer>
      );
    }

    return <ChatMessageList activeAgent={selectedAgent} />;
  }, [activeSessionId, features.quantumEnhancement, selectedAgent, renderNoActiveSession]);

  return (
    <Box sx={{ ...containerStyles, height: '100vh', position: 'relative' }}>
      {/* Enterprise Monitoring */}
      {features.enterpriseMonitoring && <EnterpriseMonitor />}
      
      {/* 3D Environment Overlay */}
      {features.threeDEnvironment && is3DMode && (
        <Chat3DEnvironment 
          messages={[]} // This would be actual messages from state
          onMessageClick={(messageId: string) => console.log('Message clicked:', messageId)}
        />
      )}
      
      {/* Offset content for fixed TopNav AppBar */}
      <Toolbar />
      
      {/* Enterprise Feature Controls */}
      {(features.threeDEnvironment || features.voiceInterface) && (
        <Box sx={{ 
          position: 'fixed', 
          top: 80, 
          right: 16, 
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {features.threeDEnvironment && (
            <Tooltip title={is3DMode ? "Exit 3D Mode" : "Enter 3D Mode"}>
              <IconButton
                onClick={() => setIs3DMode(!is3DMode)}
                sx={{
                  bgcolor: is3DMode ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255,255,255,0.9)',
                  color: is3DMode ? '#4ecdc4' : 'primary.main',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    bgcolor: is3DMode ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255,255,255,1)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {is3DMode ? <ViewInArIcon /> : <ThreeDIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          {features.voiceInterface && (
            <Tooltip title={voiceMode ? "Stop Voice Mode" : "Start Voice Mode"}>
              <IconButton
                onClick={() => setVoiceMode(!voiceMode)}
                sx={{
                  bgcolor: voiceMode ? 'rgba(69, 183, 209, 0.2)' : 'rgba(255,255,255,0.9)',
                  color: voiceMode ? '#45b7d1' : 'primary.main',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    bgcolor: voiceMode ? 'rgba(69, 183, 209, 0.3)' : 'rgba(255,255,255,1)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <VoiceIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
      
      {/* Voice Interface */}
      {features.voiceInterface && voiceMode && (
        <AdvancedVoiceInterface />
      )}
      
      {/* Messages area with quantum enhancement */}
      <Fade in timeout={800}>
        <Box sx={{ flexGrow: 1 }}>
          {renderMessages()}
        </Box>
      </Fade>
      
      {/* Smart Suggestions */}
      {features.smartSuggestions && activeSessionId && (
        <ContextualSmartSuggestions
          currentInput=""
          conversationHistory={[]}
          userProfile={{
            preferences: [],
            recentActions: [],
            expertise: []
          }}
          onSuggestionSelect={(suggestion: { title: string }) => {
            handleSendMessage(suggestion.title, selectedAgent);
          }}
        />
      )}
 
      {/* Enhanced Input area with predictive UI */}
      <Box 
        ref={inputBarRef}
        sx={{ 
          pt: 2,
          pb: 2,
          width: '100%',
          position: 'fixed',
          bottom: 0,
          left: 0,
          paddingLeft: { sm: `${drawerPadding}px` },
          paddingRight: !isSmall && isCanvasOpen ? `${canvasWidth}px` : (drawerPadding ? 2 : undefined),
          zIndex: 'var(--z-input)',
          backgroundColor: 'transparent',
          backdropFilter: features.quantumEnhancement ? 'blur(20px)' : 'none',
          minHeight: 'var(--input-h)',
          display: 'flex',
          justifyContent: 'center',
          ...(features.quantumEnhancement && {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.9) 100%)',
            borderTop: '1px solid rgba(102, 126, 234, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.6,
            }
          })
        }}
      >
        <Container 
          maxWidth={false} 
          sx={{ 
            position: 'relative', 
            maxWidth: 720,
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Predictive UI Suggestions */}
          {features.predictiveUI && suggestedActions.length > 0 && (
            <Box sx={{ 
              mb: 1, 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {suggestedActions.slice(0, 3).map((action, index) => (
                <Box
                  key={index}
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.2)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleSendMessage(action, selectedAgent)}
                >
                  💡 {action}
                </Box>
              ))}
            </Box>
          )}
          
          <Suspense fallback={<InputLoadingFallback />}>
            <AgentDrivenChatInput 
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onStopRequest={handleStopRequest}
              activeAgent={selectedAgent}
              onAgentChange={handleAgentSelect}
            />
          </Suspense>
        </Container>
      </Box>

      {/* Enhanced Snackbar with quantum effects */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={handleSnackbarClose}
        sx={{
          ...(features.quantumEnhancement && {
            '& .MuiSnackbarContent-root': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }
          })
        }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="info" 
          sx={{ 
            width: '100%',
            ...(features.quantumEnhancement && {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white',
              }
            })
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default React.memo(EnhancedChatInterface);
