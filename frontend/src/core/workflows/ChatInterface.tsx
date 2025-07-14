import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  IconButton, 
  Typography,
  Avatar,
  CircularProgress,
  Tooltip,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import { 
  Send, 
  SmartToy, 
  Person, 
  AutoAwesome, 
  Work, 
  Psychology,
  MoreVert,
  AttachFile,
  Mic,
  InsertEmoticon,
  Code,
  DataObject,
  Api,
  AccountTree,
  GroupWork,
  SettingsSuggest
} from '@mui/icons-material';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  metadata?: {
    type?: 'code' | 'data' | 'action';
    language?: string;
    actionType?: string;
    status?: 'pending' | 'success' | 'error';
  };
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string, agentId?: string, workflowId?: string) => void;
  onWorkflowTrigger?: (workflowId: string, params?: any) => void;
  enterpriseMode?: boolean;
  activeWorkflows?: number;
  onNavigateToWorkflows?: () => void;
  onNavigateToAgents?: () => void;
  currentAgent?: {
    id: string;
    name: string;
    status: 'ready' | 'thinking' | 'processing' | 'offline' | 'error';
  };
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  onWorkflowTrigger,
  enterpriseMode = false,
  activeWorkflows = 0,
  onNavigateToWorkflows,
  onNavigateToAgents,
  currentAgent = {
    id: 'default-agent',
    name: 'Enterprise Assistant',
    status: 'ready' as const
  }
}) => {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'agent',
          content: enterpriseMode 
            ? 'Hello! I\'m your Enterprise AI Assistant. How can I help you today?'
            : 'Hello! How can I assist you today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [enterpriseMode]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        content: `I received your message: "${input}"`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
      
      // Call the onSendMessage prop if provided
      if (onSendMessage) {
        onSendMessage(input);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success.main';
      case 'thinking': return 'warning.main';
      case 'processing': return 'info.main';
      case 'error': return 'error.main';
      default: return 'text.secondary';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: theme.palette.background.default,
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: theme.palette.background.paper
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {currentAgent?.name || 'AI Assistant'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: getStatusColor(currentAgent?.status || 'ready') 
              }} />
              <Typography variant="caption" color="textSecondary">
                {currentAgent?.status?.charAt(0).toUpperCase() + currentAgent?.status?.slice(1) || 'Ready'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {enterpriseMode && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Active Workflows">
              <Chip 
                icon={<AccountTree fontSize="small" />} 
                label={`${activeWorkflows} Active`}
                size="small"
                variant="outlined"
                onClick={onNavigateToWorkflows}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
            <Tooltip title="Agent Network">
              <Chip 
                icon={<GroupWork fontSize="small" />} 
                label="Agent Network"
                size="small"
                variant="outlined"
                onClick={onNavigateToAgents}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '80%',
                minWidth: '120px'
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 4,
                  bgcolor: message.sender === 'user' 
                    ? theme.palette.primary.main 
                    : theme.palette.background.paper,
                  color: message.sender === 'user' 
                    ? theme.palette.primary.contrastText 
                    : theme.palette.text.primary,
                  boxShadow: theme.shadows[1],
                  position: 'relative',
                  overflow: 'hidden',
                  '& pre': {
                    margin: 0,
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(0, 0, 0, 0.3)' 
                      : 'rgba(0, 0, 0, 0.05)',
                    overflowX: 'auto',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  },
                  '& code': {
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }
                }}
              >
                {message.isTyping ? (
                  <Box sx={{ display: 'flex', gap: 0.5, p: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'text.secondary',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      '&:nth-of-type(2)': { animationDelay: '0.2s' },
                      '&:nth-of-type(3)': { animationDelay: '0.4s' },
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.3 },
                        '50%': { opacity: 1 }
                      }
                    }} />
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.5 }} />
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.3 }} />
                  </Box>
                ) : (
                  <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                )}
                
                {message.metadata?.type === 'code' && (
                  <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
                    <code>{message.content}</code>
                  </Box>
                )}
              </Box>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 0.5, 
                  px: 1.5,
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {message.sender === 'agent' && (
                  <SmartToy fontSize="inherit" sx={{ opacity: 0.7 }} />
                )}
                {message.sender === 'user' && (
                  <Person fontSize="inherit" sx={{ opacity: 0.7 }} />
                )}
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Box>
        ))}
        
        {isTyping && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            alignSelf: 'flex-start',
            p: 1.5,
            borderRadius: 4,
            bgcolor: 'background.paper',
            boxShadow: theme.shadows[1],
            maxWidth: '80%'
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: 'text.secondary',
              animation: 'pulse 1.5s ease-in-out infinite',
              '&:nth-of-type(2)': { animationDelay: '0.2s' },
              '&:nth-of-type(3)': { animationDelay: '0.4s' },
              '@keyframes pulse': {
                '0%, 100%': { opacity: 0.3 },
                '50%': { opacity: 1 }
              }
            }} />
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.5 }} />
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.secondary', opacity: 0.3 }} />
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          gap: 1,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          p: 1,
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 1px ${theme.palette.primary.main}`
          }
        }}>
          <IconButton size="small">
            <AttachFile fontSize="small" />
          </IconButton>
          
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="standard"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              disableUnderline: true,
              sx: {
                px: 1,
                py: 1,
                '& textarea': {
                  maxHeight: '120px',
                  overflowY: 'auto !important'
                }
              }
            }}
            sx={{ flex: 1 }}
          />
          
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <IconButton size="small" disabled={!input.trim()}>
              <Mic fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={!input.trim()}>
              <InsertEmoticon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={!input.trim()}>
              <Code fontSize="small" />
            </IconButton>
            
            <Button
              variant="contained"
              color="primary"
              disabled={!input.trim()}
              onClick={handleSend}
              endIcon={<Send />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 2,
                py: 0.5,
                minWidth: 'auto',
                '& .MuiButton-endIcon': {
                  ml: 0.5
                }
              }}
            >
              Send
            </Button>
          </Box>
        </Box>
        
        {enterpriseMode && (
          <Box sx={{ 
            mt: 1, 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <Chip 
              label="Run Workflow" 
              size="small" 
              icon={<AccountTree fontSize="small" />}
              onClick={() => onWorkflowTrigger?.('default-workflow')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label="Query Data" 
              size="small" 
              icon={<DataObject fontSize="small" />}
              onClick={() => onWorkflowTrigger?.('data-query')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label="API Call" 
              size="small" 
              icon={<Api fontSize="small" />}
              onClick={() => onWorkflowTrigger?.('api-call')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label="Agent Settings" 
              size="small" 
              icon={<SettingsSuggest fontSize="small" />}
              onClick={onNavigateToAgents}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatInterface;
