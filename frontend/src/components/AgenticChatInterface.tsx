import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Stack,
  TextField,
  Button,
  Fade,
  Slide,
  useTheme,
  alpha,
  Tooltip,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Badge,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Send,
  SmartToy,
  Psychology,
  Engineering,
  Support,
  Business,
  Analytics,
  Settings,
  AutoMode,
  ToggleOff,
  Circle,
  History,
  Add,
  MoreVert
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Agent types and configurations
const AGENTS = {
  general: { name: 'General AI', icon: SmartToy, color: '#6366f1', description: 'General purpose assistant' },
  technical: { name: 'Tech Expert', icon: Engineering, color: '#10b981', description: 'Engineering & coding help' },
  support: { name: 'Support Agent', icon: Support, color: '#f59e0b', description: 'Customer support specialist' },
  business: { name: 'Business Analyst', icon: Business, color: '#ef4444', description: 'Business strategy & analysis' },
  data: { name: 'Data Scientist', icon: Analytics, color: '#8b5cf6', description: 'Data analysis & insights' },
  psychology: { name: 'AI Psychologist', icon: Psychology, color: '#ec4899', description: 'Human behavior & psychology' }
};

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agent?: string;
  timestamp: Date;
  type?: 'text' | 'thinking' | 'error';
  metadata?: any;
}

interface Session {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  primaryAgent: string;
}

export const AgenticChatInterface: React.FC = () => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRouting, setAutoRouting] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('general');
  const [agentMenuAnchor, setAgentMenuAnchor] = useState<null | HTMLElement>(null);
  const [showSessions, setShowSessions] = useState(true);

  // Create initial session
  useEffect(() => {
    const initialSession: Session = {
      id: 'session-1',
      name: 'New Conversation',
      lastMessage: 'Welcome to AgentHive!',
      timestamp: new Date(),
      messageCount: 0,
      primaryAgent: 'general'
    };
    setSessions([initialSession]);
    setCurrentSession(initialSession.id);
    
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: 'Welcome to AgentHive! I\'m your multi-agent AI assistant. Choose an agent or let me route your messages automatically.',
      sender: 'agent',
      agent: 'general',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate agent selection and response
    let targetAgent = selectedAgent;
    if (autoRouting) {
      targetAgent = determineAgent(inputValue);
    }

    // Add thinking indicator
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      content: `${AGENTS[targetAgent as keyof typeof AGENTS]?.name} is thinking...`,
      sender: 'agent',
      agent: targetAgent,
      timestamp: new Date(),
      type: 'thinking'
    };
    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate response delay
    setTimeout(() => {
      const response = generateAgentResponse(inputValue, targetAgent);
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        content: response,
        sender: 'agent',
        agent: targetAgent,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => prev.filter(m => m.type !== 'thinking').concat([agentMessage]));
      setIsLoading(false);

      // Update session
      if (currentSession) {
        setSessions(prev => prev.map(session => 
          session.id === currentSession 
            ? { ...session, lastMessage: response, messageCount: session.messageCount + 2, timestamp: new Date() }
            : session
        ));
      }
    }, 1500 + Math.random() * 1000);
  }, [inputValue, isLoading, selectedAgent, autoRouting, currentSession]);

  // Smart agent routing
  const determineAgent = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('code') || lower.includes('bug') || lower.includes('technical')) return 'technical';
    if (lower.includes('business') || lower.includes('strategy') || lower.includes('market')) return 'business';
    if (lower.includes('data') || lower.includes('analyze') || lower.includes('chart')) return 'data';
    if (lower.includes('help') || lower.includes('support') || lower.includes('problem')) return 'support';
    if (lower.includes('behavior') || lower.includes('psychology') || lower.includes('emotion')) return 'psychology';
    return 'general';
  };

  // Generate agent responses
  const generateAgentResponse = (message: string, agent: string): string => {
    const responses = {
      general: [
        "I understand your question. Let me help you with that.",
        "That's an interesting point. Here's what I think...",
        "I can assist you with that. Let me break it down."
      ],
      technical: [
        "Looking at this from a technical perspective...",
        "Here's the engineering approach I'd recommend:",
        "From a development standpoint, here's what I suggest:"
      ],
      support: [
        "I'm here to help! Let me walk you through this step by step.",
        "I understand your concern. Here's how we can resolve this:",
        "Thank you for reaching out. Here's the solution:"
      ],
      business: [
        "From a business strategy perspective...",
        "Analyzing the market dynamics here...",
        "The strategic approach I'd recommend is:"
      ],
      data: [
        "Based on the data patterns I see...",
        "The analytics suggest...",
        "Here's what the numbers tell us:"
      ],
      psychology: [
        "From a behavioral psychology standpoint...",
        "Understanding the human element here...",
        "The psychological factors to consider are:"
      ]
    };
    
    const agentResponses = responses[agent as keyof typeof responses] || responses.general;
    return agentResponses[Math.floor(Math.random() * agentResponses.length)] + ` regarding "${message}". This is a simulated response from the ${AGENTS[agent as keyof typeof AGENTS]?.name}.`;
  };

  // Create new session
  const createNewSession = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: `Conversation ${sessions.length + 1}`,
      lastMessage: 'New conversation started',
      timestamp: new Date(),
      messageCount: 0,
      primaryAgent: selectedAgent
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession.id);
    setMessages([]);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      overflow: 'hidden'
    }}>
      {/* Sessions Sidebar */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <Paper sx={{ 
              width: 300, 
              height: '100%', 
              borderRadius: 0,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(10px)',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Sessions</Typography>
                  <Tooltip title="New Session">
                    <IconButton onClick={createNewSession} size="small">
                      <Add />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              
              <Box sx={{ overflowY: 'auto', height: 'calc(100% - 80px)' }}>
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Box
                      onClick={() => setCurrentSession(session.id)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderLeft: currentSession === session.id ? `4px solid ${theme.palette.primary.main}` : 'none',
                        background: currentSession === session.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.05),
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {session.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {session.lastMessage.substring(0, 50)}...
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                        <Chip size="small" label={session.messageCount} />
                        <Typography variant="caption" color="text.secondary">
                          {session.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ 
          p: 2, 
          borderRadius: 0,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => setShowSessions(!showSessions)}>
                <History />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AgentHive Multi-Agent Chat
              </Typography>
              {!autoRouting && (
                <Chip 
                  avatar={<Avatar sx={{ bgcolor: AGENTS[selectedAgent as keyof typeof AGENTS]?.color }}>
                    {React.createElement(AGENTS[selectedAgent as keyof typeof AGENTS]?.icon)}
                  </Avatar>}
                  label={AGENTS[selectedAgent as keyof typeof AGENTS]?.name}
                  onClick={(e) => setAgentMenuAnchor(e.currentTarget)}
                  variant="outlined"
                />
              )}
            </Stack>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={autoRouting} 
                    onChange={(e) => setAutoRouting(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {autoRouting ? <AutoMode fontSize="small" /> : <ToggleOff fontSize="small" />}
                    <Typography variant="caption">
                      {autoRouting ? 'Auto Routing' : 'Manual'}
                    </Typography>
                  </Stack>
                }
              />
              <IconButton>
                <Settings />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2,
          background: 'transparent'
        }}>
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 500,
                  delay: index * 0.05 
                }}
              >
                <Box sx={{ 
                  mb: 2,
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <Box sx={{ 
                    maxWidth: '70%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                  }}>
                    {message.sender === 'agent' && (
                      <Avatar sx={{ 
                        bgcolor: AGENTS[message.agent as keyof typeof AGENTS]?.color || theme.palette.primary.main,
                        width: 32, 
                        height: 32 
                      }}>
                        {message.agent && React.createElement(AGENTS[message.agent as keyof typeof AGENTS]?.icon)}
                      </Avatar>
                    )}
                    
                    <Paper sx={{
                      p: 2,
                      background: message.sender === 'user' 
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        : message.type === 'thinking'
                        ? alpha(theme.palette.background.paper, 0.7)
                        : alpha(theme.palette.background.paper, 0.9),
                      color: message.sender === 'user' ? 'white' : 'inherit',
                      backdropFilter: 'blur(10px)',
                      border: message.type === 'thinking' ? `1px dashed ${theme.palette.divider}` : 'none',
                      borderRadius: message.sender === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {message.type === 'thinking' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {message.content}
                          </Typography>
                        </Box>
                      )}
                      
                      {message.type !== 'thinking' && (
                        <>
                          <Typography variant="body1">
                            {message.content}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            display: 'block', 
                            mt: 1, 
                            opacity: 0.7,
                            textAlign: message.sender === 'user' ? 'right' : 'left'
                          }}>
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                        </>
                      )}
                    </Paper>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Paper sx={{ 
          p: 2,
          borderRadius: 0,
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Type your message..."
              variant="outlined"
              fullWidth
              multiline
              maxRows={4}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: alpha(theme.palette.background.paper, 0.5),
                  backdropFilter: 'blur(10px)',
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
                '&:disabled': {
                  bgcolor: theme.palette.action.disabled,
                }
              }}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
            </IconButton>
          </Stack>
        </Paper>
      </Box>

      {/* Agent Selection Menu */}
      <Menu
        anchorEl={agentMenuAnchor}
        open={Boolean(agentMenuAnchor)}
        onClose={() => setAgentMenuAnchor(null)}
      >
        {Object.entries(AGENTS).map(([key, agent]) => (
          <MenuItem
            key={key}
            onClick={() => {
              setSelectedAgent(key);
              setAgentMenuAnchor(null);
            }}
            selected={selectedAgent === key}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ bgcolor: agent.color, width: 24, height: 24 }}>
                {React.createElement(agent.icon, { fontSize: 'small' })}
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{agent.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {agent.description}
                </Typography>
              </Box>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default AgenticChatInterface;
