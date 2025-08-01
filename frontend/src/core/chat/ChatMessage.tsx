import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Avatar,
  Paper,
  Tooltip,
  IconButton,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import ViewSidebarRoundedIcon from '@mui/icons-material/ViewSidebarRounded';
import { agentStyles } from '../../shared/constants/agentStyles';
import MarkdownRenderer from '../../shared/components/MarkdownRenderer';
import LogoText from '../../shared/components/LogoText';
import type { Message as ChatMessageType } from '../../shared/store/slices/entitiesSlice';
import { selectTheme, selectChatTyping } from '../../shared/store/slices/uiSlice';
import {
  ChartComponent,
  CodeBlockComponent,
  DataTableComponent,
  ActionButtonsComponent
} from '../../shared/components/RichMessageComponents';

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
  // isSystem and isHRAgent variables removed - unused
  
  // Get theme mode from consolidated UI store
  const mode = useSelector(selectTheme);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [rerunSnackbarOpen, setRerunSnackbarOpen] = useState(false);
  // Canvas functionality placeholder
  const openWithMessage = (message: any) => {
    console.log('Canvas functionality disabled:', message);
  };
  const processingStatus = useSelector(selectChatTyping);
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
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        display: 'flex',
        width: '100%',
        mb: 3, // Increased spacing between messages
        px: { xs: 1, sm: 2 },
        position: 'relative',
      }}
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
            bgcolor: isUser ? '#f59e0b' : agentStyle.bgColor, // Honey color for user avatar
            color: isUser ? '#ffffff' : agentStyle.color,
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
            color: '#d97706', // Honey/amber color that's warm and professional
            mb: 0.5,
            ml: { xs: 0, sm: 5 }, // Align with message content when avatar is visible
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {agentStyles[activeAgent as keyof typeof agentStyles]?.name || 'Agent'}
        </Typography>
      )}
      {/* Message Content - User vs Assistant */}
      {isUser ? (
        // User messages keep the bubble style
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            px: 2.5,
            py: 1.75,
            borderRadius: 3,
            bgcolor: '#f59e0b', // Honey/amber color
            color: '#ffffff', // White text on honey background
            wordBreak: 'break-word',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)', // Honey-colored shadow
            border: 'none',
          }}
        >
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

          {/* Actions + Timestamp for user messages */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1, flexWrap: 'wrap' }}>
            {onRerun && (
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
            <Typography variant="caption" sx={{ ml: 1, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {ts}
            </Typography>
          </Box>
        </Paper>
      ) : (
        // Assistant messages: completely transparent, no bubble at all
        <Box
          sx={{
            ml: { xs: 0, sm: 5 }, // Align with avatar and agent name
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
          }}
        >
          {message.text.trim().length === 0 && isStreaming ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: 40 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <>
              {/* Rich content detection and rendering */}
              {(message.text.includes('```chart') || message.text.includes('```graph')) && (() => {
                // Parse chart data from markdown
                try {
                  const chartMatch = message.text.match(/```(?:chart|graph)\s*([\s\S]*?)```/);
                  if (chartMatch) {
                    const chartData = JSON.parse(chartMatch[1]);
                    return (
                      <ChartComponent
                        type={chartData.type || 'bar'}
                        data={chartData.data || []}
                        title={chartData.title}
                        description={chartData.description}
                      />
                    );
                  }
                } catch (error) {
                  console.error('Error parsing chart data:', error);
                }
                return null;
              })()}
              
              {(message.text.includes('```json') || message.text.includes('```sql') || message.text.includes('```python') || message.text.includes('```javascript')) && (() => {
                // Parse code blocks
                const codeMatch = message.text.match(/```(\w+)\s*([\s\S]*?)```/);
                if (codeMatch) {
                  const [, language, code] = codeMatch;
                  return (
                    <CodeBlockComponent
                      code={code.trim()}
                      language={language}
                      title={`${language.toUpperCase()} Code`}
                      executable={language === 'python' || language === 'javascript'}
                      onExecute={(code) => console.log('Executing code:', code)}
                    />
                  );
                }
                return null;
              })()}
              
              {(message.text.includes('|') && message.text.split('\n').some(line => line.includes('|'))) && (() => {
                // Parse table data from markdown
                try {
                  const lines = message.text.split('\n').filter(line => line.includes('|'));
                  if (lines.length >= 2) {
                    const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
                    const rows = lines.slice(2).map(line => {
                      const cells = line.split('|').map(c => c.trim()).filter(c => c);
                      const row: any = {};
                      headers.forEach((header, index) => {
                        row[header] = cells[index] || '';
                      });
                      return row;
                    });
                    
                    if (rows.length > 0) {
                      return (
                        <DataTableComponent
                          data={rows}
                          title="Data Table"
                          columns={headers.map(h => ({ key: h, label: h, type: 'string' as const }))}
                        />
                      );
                    }
                  }
                } catch (error) {
                  console.error('Error parsing table data:', error);
                }
                return null;
              })()}
              
              {/* Default markdown rendering for non-rich content */}
              {!(message.text.includes('```chart') || message.text.includes('```graph') || 
                 message.text.includes('```json') || message.text.includes('```sql') || 
                 message.text.includes('```python') || message.text.includes('```javascript') ||
                 (message.text.includes('|') && message.text.split('\n').some(line => line.includes('|')))) && (
                <MarkdownRenderer markdown={message.text} />
              )}
              
              {/* Action buttons for interactive messages */}
              {(message.text.includes('action:') || message.text.includes('button:') || message.text.includes('workflow:')) && (
                <Box sx={{ mt: 2 }}>
                  <ActionButtonsComponent 
                    actions={[
                      { id: 'execute', label: 'Execute', type: 'primary' as const, onClick: () => console.log('Execute action') },
                      { id: 'save', label: 'Save', type: 'secondary' as const, onClick: () => console.log('Save action') },
                      { id: 'share', label: 'Share', type: 'success' as const, onClick: () => console.log('Share action') }
                    ]}
                    title="Available Actions"
                  />
                </Box>
              )}
              
              {/* Legacy chart support */}
              {message.metadata?.chart && (
                <Box sx={{ mt: 2 }}>
                  {message.metadata.chart}
                </Box>
              )}
            </>
          )}

          {/* Actions + Timestamp for assistant messages */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Copy to clipboard">
              <IconButton size="small" onClick={handleCopyText} color="inherit">
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isSpeaking ? "Stop reading" : "Read aloud"}>
              <IconButton 
                size="small" 
                onClick={handleReadAloud} 
                color={isSpeaking ? "error" : "inherit"}
              >
                <VolumeUpIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Open canvas">
              <IconButton size="small" onClick={handleEditInCanvas} color="inherit">
                <ViewSidebarRoundedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', fontSize: 12 }}>
              {ts}
            </Typography>
          </Box>
        </Box>
      )}
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
    </Box>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default React.memo(ChatMessage);