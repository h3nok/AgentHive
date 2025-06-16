import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  Tooltip, 
  IconButton, 
  Snackbar, 
  keyframes
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import ViewSidebarRoundedIcon from '@mui/icons-material/ViewSidebarRounded';
import { useCanvas } from '../context/CanvasContext';
import { agentStyles } from '../constants/agentStyles';
import MarkdownRenderer from './markdown/MarkdownRenderer';
import LogoText from './LogoText';
import QuantumEnhancedMessage from './QuantumEnhancedMessage';
import type { ChatMessage as ChatMessageType } from '../features/chat/chatSlice';
import FancyTypingDots from './FancyTypingDots';

// Interface for component props
interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onRerun?: (messageText: string) => void;
  activeAgent?: string;
}
/**
 * Displays a single chat message bubble with quantum enhancements.
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false, onRerun, activeAgent = "general" }) => {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'assistant';
  const isSystem = message.sender === 'system';
  const isHRAgent = message.sender === 'assistant' && message.agent === 'hr';
  
  // Get theme mode from Redux store or default to light
  const mode = useSelector((state: RootState) => state.app.theme) || 'light';
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [rerunSnackbarOpen, setRerunSnackbarOpen] = useState(false);
  const { openWithMessage } = useCanvas();
  const processingStatus = useSelector((state: RootState) => state.chat.processingStatus);
  // Track whether this message is currently being read aloud
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Debug logging for streaming state
  React.useEffect(() => {
    if (!isUser) {
      console.log(`💬 ChatMessage (${message.id}): isStreaming=${isStreaming}, processingStatus="${processingStatus}", textLength=${message.text.length}`);
    }
  }, [isStreaming, processingStatus, message.text.length, message.id, isUser]);
  
  // Get the agent styling based on activeAgent
  const agentStyle = agentStyles[activeAgent as keyof typeof agentStyles] || agentStyles.general;
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
    setSnackbarOpen(true);
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  const handleRerunSnackbarClose = () => {
    setRerunSnackbarOpen(false);
  };
  
  const handleReadAloud = () => {
    // Toggle speech synthesis for this message
    if (speechSynthesis.speaking || isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };
  
  const handleEditInCanvas = () => {
    // Open the global canvas with this message
    openWithMessage(message);
  };
  
  const handleRerunMessage = () => {
    if (isUser && onRerun) {
      onRerun(message.text);
      setRerunSnackbarOpen(true);
    }
  };
  
  // Format timestamp
  const ts = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Debug: log markdown for assistant messages
  if (!isUser && message.text.trim().length > 0) {
    console.log('Markdown to render:', message.text);
  }

  return (
    <QuantumEnhancedMessage
      message={message}
      isStreaming={isStreaming}
      sentiment={message.text.includes('error') || message.text.includes('failed') ? 'negative' : 
                 message.text.includes('success') || message.text.includes('completed') ? 'positive' : 'neutral'}
      importance={message.text.length > 500 ? 'high' : message.text.length > 200 ? 'medium' : 'low'}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
          marginLeft: isUser ? 'auto' : 0,
        }}
      >
      <Box sx={{ display: 'flex', width: '100%', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <Avatar
          sx={{
            width: { xs: 0, sm: 36 },
            height: { xs: 0, sm: 36 },
            borderRadius: '50%',
            border: isUser ? 'none' : `2px solid ${agentStyle.color}`,
            bgcolor: isUser ? 'primary.main' : agentStyle.bgColor,
            color: isUser ? '#fff' : agentStyle.color,
            fontSize: 18,
            fontWeight: 700,
            mb: '8px',
            boxShadow: isStreaming ? `0 0 6px ${agentStyle.color}66` : '0 2px 6px rgba(0,0,0,0.08)',
            display: { xs: 'none', sm: 'flex' },
          }}
          aria-label={isUser ? 'You' : (isAgent ? 'Agent' : 'Assistant')}
        >
          {isUser ? (
            <PersonIcon fontSize="small" />
          ) : (
            agentStyle.icon || <LogoText size="small" showOnlyBubble animated={false} />
          )}
        </Avatar>
      </Box>
      {/* Agent header label */}
      {!isUser && (
        <Typography
          variant="caption"
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: '#C8102E',
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {agentStyles[activeAgent as keyof typeof agentStyles]?.name || 'Agent'}
        </Typography>
      )}
      {/* Message Bubble */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          px: 2.5,
          py: 1.75,
          borderRadius: 3,
          bgcolor: isUser
            ? (mode === 'dark' ? 'primary.dark' : 'primary.main')
            : 'transparent',
          color: isUser ? '#fff' : 'text.primary',
          wordBreak: 'break-word',
          boxShadow: isUser
            ? '0 4px 12px rgba(198, 12, 48, 0.15)'
            : 'none',
          border: isUser ? 'none' : 'none',
          ...(isUser ? {} : {
            pl: 2.5,
            borderLeft: mode === 'dark' ? '4px solid rgba(255,255,255,0.08)' : '4px solid rgba(0,0,0,0.06)',
          }),
        }}
      >
        {/* Message Content */}
        {isUser ? (
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontSize: '1rem',
              lineHeight: 1.7,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              position: 'relative',
            }}
          >
            {message.text}
          </Typography>
        ) : (
          <Box sx={{
            width: '100%',
            overflow: 'hidden',
            wordBreak: 'break-word',
            '& > *': { maxWidth: '100%' },
            '& table': {
              width: '100%',
              maxWidth: '100%',
              borderCollapse: 'collapse',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            },
            '& th, & td': {
              padding: '8px 12px',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            },
            '& th': {
              backgroundColor: mode === 'dark' ? 'rgba(200,16,46,0.15)' : 'rgba(200,16,46,0.08)',
              color: '#c8102e',
              fontWeight: 600,
              position: 'sticky',
              top: 0,
            },
            '& tr:nth-of-type(odd)': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            },
            '& tr:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(200,16,46,0.10)' : 'rgba(200,16,46,0.08)',
            },
            '& pre': {
              overflow: 'auto',
              maxWidth: '100%',
            },
          }}>
            {message.text.trim().length === 0 && isStreaming ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 40 }}>
                <FancyTypingDots />
              </Box>
            ) : (
              <>
                <MarkdownRenderer markdown={message.text} />
                {message.chart && (
                  <Box sx={{ mt: 2 }}>
                    {message.chart}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
        {/* Actions + Timestamp */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1, flexWrap: 'wrap' }}>
          {/* Actions */}
          {isUser && onRerun && (
            <Tooltip title="Rerun this message">
              <IconButton size="small" onClick={handleRerunMessage} color="inherit">
                <ReplayIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Copy to clipboard">
            <IconButton size="small" onClick={handleCopyText} color="inherit">
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          {!isUser && (
            <Tooltip title={isSpeaking ? "Stop reading" : "Read aloud"}>
              <IconButton 
                size="small" 
                onClick={handleReadAloud} 
                color={isSpeaking ? "error" : "inherit"}
              >
                <VolumeUpIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
          {!isUser && (
            <Tooltip title="Open canvas">
              <IconButton size="small" onClick={handleEditInCanvas} color="inherit">
                <ViewSidebarRoundedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}

          {/* Timestamp & Agent */}
          <Typography variant="caption" sx={{ ml: 1, color: isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontSize: 12 }}>
            {ts}
          </Typography>
        </Box>
      </Paper>
      {/* Snackbars */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Snackbar
        open={rerunSnackbarOpen}
        autoHideDuration={2000}
        onClose={handleRerunSnackbarClose}
        message="Message rerun initiated"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
    </QuantumEnhancedMessage>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default React.memo(ChatMessage);