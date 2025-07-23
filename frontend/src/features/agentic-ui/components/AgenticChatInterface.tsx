/**
 * Enhanced Agentic Chat Interface
 * 
 * A sophisticated chat interface that combines traditional messaging with
 * agentic workflow visualization, agent switching, and enterprise features.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Stack,
  Chip,
  Card,
  CardContent,
  Fade,
  Slide,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Send,
  Mic,
  AttachFile,
  SmartToy,
  Psychology,
  Build,
  TrendingUp,
  MoreVert,
  Expand,
  ThumbUp,
  ThumbDown,
  Share,
  Bookmark,
  VolumeUp,
  ContentCopy,
  Refresh
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

import WorkflowVisualization from './WorkflowVisualization';
import { 
  AgenticMessage, 
  AgentPersona, 
  AgenticWorkflow, 
  ChatInterfaceProps,
  MessageType 
} from '../types';

// Animations
const typingAnimation = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
`;

const messageSlideIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateX(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
`;

// Styled Components
const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: '3px',
    '&:hover': {
      background: theme.palette.grey[600],
    },
  },
}));

const MessageBubble = styled(Card)<{ isUser: boolean }>(({ theme, isUser }) => ({
  maxWidth: '80%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  background: isUser 
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
    : theme.palette.background.paper,
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  animation: `${messageSlideIn} 0.3s ease-out`,
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[4],
  },
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  '& .dot': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    animation: `${typingAnimation} 1.4s ease-in-out infinite`,
    '&:nth-of-type(2)': { animationDelay: '0.2s' },
    '&:nth-of-type(3)': { animationDelay: '0.4s' },
  }
}));

const InputContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  margin: theme.spacing(1),
  borderRadius: theme.spacing(3),
  border: `2px solid ${theme.palette.divider}`,
  '&:focus-within': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
  },
}));

interface AgenticChatInterfaceProps extends ChatInterfaceProps {
  activeAgent?: AgentPersona;
  availableAgents: AgentPersona[];
  onAgentSwitch: (agent: AgentPersona) => void;
  onWorkflowAction?: (action: 'pause' | 'resume' | 'cancel', workflowId: string) => void;
  enterpriseFeatures?: {
    showCosts: boolean;
    showSources: boolean;
    enableApprovals: boolean;
    auditMode: boolean;
  };
}

const AgenticChatInterface: React.FC<AgenticChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onWorkflowExpand,
  activeAgent,
  availableAgents,
  onAgentSwitch,
  onWorkflowAction,
  loading = false,
  placeholder = "Ask me anything...",
  enableVoiceInput = true,
  enableFileUpload = true,
  enterpriseFeatures = {
    showCosts: true,
    showSources: true,
    enableApprovals: false,
    auditMode: false
  }
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentMenuAnchor, setAgentMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (loading) {
      setIsTyping(true);
    } else {
      const timer = setTimeout(() => setIsTyping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const toggleWorkflowExpansion = (workflowId: string) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
    onWorkflowExpand?.(workflowId);
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'hr': return '👥';
      case 'data': return '📊';
      case 'finance': return '💰';
      case 'support': return '🛠️';
      case 'code': return '💻';
      default: return '🤖';
    }
  };

  const getFrameworkBadge = (framework: string) => {
    const colors = {
      custom: 'default',
      langchain: 'primary',
      hybrid: 'secondary'
    } as const;
    
    return (
      <Chip
        label={framework}
        size="small"
        color={colors[framework as keyof typeof colors] || 'default'}
        variant="outlined"
        sx={{ ml: 1, fontSize: '0.7rem' }}
      />
    );
  };

  const renderMessage = (message: AgenticMessage) => {
    const isUser = message.type === 'user';
    const isWorkflow = message.type === 'workflow';

    return (
      <Fade in={true} key={message.id} timeout={300}>
        <Box>
          <MessageBubble isUser={isUser} elevation={2}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {/* Message Header */}
              {!isUser && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                    {message.agent ? getAgentIcon(message.agent.type) : '🤖'}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {message.agent?.name || 'System'}
                  </Typography>
                  {message.agent && getFrameworkBadge(message.agent.framework)}
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </Typography>
                </Stack>
              )}

              {/* Message Content */}
              <Typography variant="body1" sx={{ mb: 1 }}>
                {message.content}
              </Typography>

              {/* Workflow Visualization */}
              {message.workflow && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Workflow Progress
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Expand />}
                      onClick={() => toggleWorkflowExpansion(message.workflow!.id)}
                    >
                      {expandedWorkflows.has(message.workflow.id) ? 'Collapse' : 'Expand'}
                    </Button>
                  </Stack>

                  {/* Simplified workflow preview */}
                  <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <CircularProgress 
                          variant="determinate" 
                          value={message.workflow.progress} 
                          size={40}
                          thickness={4}
                        />
                        <Box flex={1}>
                          <Typography variant="body2" color="text.primary">
                            {message.workflow.status === 'executing' ? 'Processing...' : 
                             message.workflow.status === 'completed' ? 'Completed' : 
                             message.workflow.status}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.workflow.progress}% complete
                          </Typography>
                        </Box>
                        {message.workflow.currentStep && (
                          <Chip 
                            label={message.workflow.currentStep.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Message Metadata */}
              {enterpriseFeatures.showCosts && message.metadata.cost && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip 
                    label={`$${message.metadata.cost.toFixed(4)}`}
                    size="small"
                    icon={<TrendingUp />}
                    variant="outlined"
                  />
                  {message.metadata.tokensUsed && (
                    <Chip 
                      label={`${message.metadata.tokensUsed} tokens`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              )}

              {/* Sources */}
              {enterpriseFeatures.showSources && message.metadata.sources && message.metadata.sources.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Sources:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {message.metadata.sources.slice(0, 3).map((source, index) => (
                      <Chip
                        key={index}
                        label={source.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {message.metadata.sources.length > 3 && (
                      <Chip
                        label={`+${message.metadata.sources.length - 3} more`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                </Box>
              )}

              {/* Message Actions */}
              {!isUser && (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Tooltip title="Helpful">
                    <IconButton size="small">
                      <ThumbUp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Not helpful">
                    <IconButton size="small">
                      <ThumbDown fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy message">
                    <IconButton size="small">
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share">
                    <IconButton size="small">
                      <Share fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </CardContent>
          </MessageBubble>
        </Box>
      </Fade>
    );
  };

  return (
    <ChatContainer>
      {/* Agent Selector Header */}
      <Paper elevation={1} sx={{ p: 2, m: 1, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Badge
              badgeContent={activeAgent?.status === 'active' ? '●' : ''}
              color={activeAgent?.status === 'active' ? 'success' : 'default'}
            >
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {activeAgent ? getAgentIcon(activeAgent.type) : '🤖'}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="subtitle1" color="text.primary">
                {activeAgent?.name || 'Select an Agent'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeAgent?.description || 'Choose an agent to start chatting'}
              </Typography>
            </Box>
            {activeAgent && getFrameworkBadge(activeAgent.framework)}
          </Stack>

          <IconButton 
            onClick={(e) => setAgentMenuAnchor(e.currentTarget)}
            color="primary"
          >
            <SmartToy />
          </IconButton>
        </Stack>
      </Paper>

      {/* Agent Selection Menu */}
      <Menu
        anchorEl={agentMenuAnchor}
        open={Boolean(agentMenuAnchor)}
        onClose={() => setAgentMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 300 } }}
      >
        {availableAgents.map((agent) => (
          <MenuItem
            key={agent.id}
            onClick={() => {
              onAgentSwitch(agent);
              setAgentMenuAnchor(null);
            }}
            selected={agent.id === activeAgent?.id}
          >
            <ListItemAvatar>
              <Badge
                badgeContent={agent.status === 'active' ? '●' : ''}
                color={agent.status === 'active' ? 'success' : 'default'}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {getAgentIcon(agent.type)}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={agent.name}
              secondary={`${agent.type} • ${agent.framework}`}
            />
            <ListItemSecondaryAction>
              <Chip
                label={`${agent.performance.successRate.toFixed(0)}%`}
                size="small"
                color="success"
                variant="outlined"
              />
            </ListItemSecondaryAction>
          </MenuItem>
        ))}
      </Menu>

      {/* Messages */}
      <MessagesContainer>
        {messages.map(renderMessage)}
        
        {/* Typing Indicator */}
        {isTyping && (
          <Fade in={true}>
            <MessageBubble isUser={false} elevation={1}>
              <CardContent sx={{ p: 2 }}>
                <TypingIndicator>
                  <Typography variant="body2" color="text.secondary">
                    {activeAgent?.name || 'Agent'} is thinking
                  </Typography>
                  <Box className="dot" />
                  <Box className="dot" />
                  <Box className="dot" />
                </TypingIndicator>
              </CardContent>
            </MessageBubble>
          </Fade>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Input Area */}
      <InputContainer elevation={3}>
        <Stack direction="row" alignItems="flex-end" spacing={1}>
          {enableFileUpload && (
            <Tooltip title="Attach file">
              <IconButton color="primary">
                <AttachFile />
              </IconButton>
            </Tooltip>
          )}

          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={activeAgent ? `Ask ${activeAgent.name}...` : placeholder}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            disabled={!activeAgent || loading}
          />

          {enableVoiceInput && (
            <Tooltip title="Voice input">
              <IconButton color="primary">
                <Mic />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Send message">
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !activeAgent || loading}
            >
              {loading ? <CircularProgress size={24} /> : <Send />}
            </IconButton>
          </Tooltip>
        </Stack>
      </InputContainer>
    </ChatContainer>
  );
};

export default AgenticChatInterface;
