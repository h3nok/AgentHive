import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../shared/store';
import { selectMessagesBySessionId, ChatMessage as ChatMessageType } from './chat/chatSlice';
import ChatMessage from './ChatMessage';
import EnterpriseAgentSelector from './EnterpriseAgentSelector';
import { AgentType } from '../../shared/types/agent';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  Button,
  Divider
} from '@mui/material';
import { lighten } from '@mui/material/styles';
import {
  Send,
  Mic,
  AttachFile,
  SmartToy,
  AutoAwesome,
  AccessTime,
  Payment,
  PersonAdd,
  CalendarToday,
  TrendingUp,
  CheckCircle,
  AccountTree,
  Hub,
  Security,
  Assessment,
  ChevronRight,
  ChevronLeft,
  Tune,
  Settings as SettingsIcon,
  Message as MessageIcon,
  Speed
} from '@mui/icons-material';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactElement;
  description: string;
  category: 'hr' | 'finance' | 'operations' | 'general';
  color?: string;
  estimatedTime: string;
  agentsRequired: string[];
  prompt: string;
}

interface SmartSuggestion {
  id: string;
  text: string;
  confidence: number;
  type: 'workflow' | 'query' | 'action';
  icon: React.ReactNode;
  context?: string;
}

interface WorkspaceContext {
  id: string;
  title: string;
  type: 'task' | 'conversation' | 'document' | 'workflow' | 'dashboard';
  relatedTasks?: string[];
  metadata?: Record<string, any>;
}

// Enhanced props interface for task interface
export interface ChatInterfaceProps {
  onSendMessage: (message: string, agent?: string, workflow?: string) => void;
  isLoading?: boolean;
  messages?: ChatMessageType[];
  sessionId?: string | null;
  onWorkflowTrigger?: (workflowId: string, params?: Record<string, unknown>) => void;
  // Enterprise integration props
  enterpriseMode?: boolean;
  activeWorkflows?: number;
  onNavigateToWorkflows?: () => void;
  onNavigateToAgents?: () => void;
  currentAgent?: {
    id: string;
    name: string;
    status: string;
  };
  // Workspace context props
  workspaceContext?: WorkspaceContext;
  embeddedMode?: boolean; // When used inside dashboard
  onWorkspaceAction?: (action: string, data?: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  isLoading = false,
  messages: propMessages = [],
  sessionId,
  onWorkflowTrigger,
  enterpriseMode = false,
  activeWorkflows = 0,
  onNavigateToWorkflows,
  onNavigateToAgents,
  currentAgent
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAutomationDrawerOpen, setIsAutomationDrawerOpen] = useState(false);
  
  // Get current session and messages from Redux state
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  const allSessions = useSelector((state: RootState) => state.chat.sessions);
  
  // Use sessionId from props/params or fallback to active session
  const currentSessionId = sessionId || activeSessionId;
  
  // Get messages from Redux state for the current session
  const reduxMessages = useSelector((state: RootState) => {
    if (!currentSessionId) return [];
    return selectMessagesBySessionId(currentSessionId)(state);
  });
  
  // Use props messages if provided, otherwise use Redux messages
  const messages = useMemo(() => {
    const messagesToUse = propMessages.length > 0 ? propMessages : reduxMessages;
    // Filter out temporary messages that might cause duplicates
    return messagesToUse.filter((msg: ChatMessageType, index: number, arr: ChatMessageType[]) => {
      // Keep all non-temp messages
      if (!msg.temp) return true;
      // For temp messages, only keep if there's no non-temp version
      return !arr.some((otherMsg: ChatMessageType, otherIndex: number) => 
        otherIndex !== index && 
        otherMsg.text === msg.text && 
        otherMsg.sender === msg.sender && 
        !otherMsg.temp
      );
    });
  }, [propMessages, reduxMessages]);
  
  // Get active session info
  const activeSession = useMemo(() => 
    currentSessionId ? allSessions.find((s: any) => s.id === currentSessionId) : null, 
    [currentSessionId, allSessions]
  );
  
  const currentWorkflow = activeSession?.workflow;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickActions: QuickAction[] = [
    {
      id: 'time-off-request',
      label: 'Request Time Off',
      icon: <AccessTime />,
      description: 'Submit vacation, sick leave, or personal time off request',
      category: 'hr',
      estimatedTime: '2-4 hours',
      agentsRequired: ['HR Agent', 'Calendar Agent', 'Policy Agent'],
      prompt: 'I need to request time off from [start date] to [end date] for [reason]'
    },
    {
      id: 'expense-report',
      label: 'Submit Expenses',
      icon: <Payment />,
      description: 'Upload receipts and create expense report for approval',
      category: 'finance',
      estimatedTime: '1-2 hours',
      agentsRequired: ['Finance Agent', 'OCR Agent', 'Compliance Agent'],
      prompt: 'I need to submit an expense report for [amount] spent on [category]'
    },
    {
      id: 'meeting-schedule',
      label: 'Schedule Meeting',
      icon: <CalendarToday />,
      description: 'Find optimal time slots and coordinate with attendees',
      category: 'operations',
      estimatedTime: '15-30 minutes',
      agentsRequired: ['Calendar Agent', 'Communication Agent'],
      prompt: 'Schedule a meeting with [participants] about [topic] for [duration]'
    },
    {
      id: 'onboard-employee',
      label: 'Onboard New Employee',
      icon: <PersonAdd />,
      description: 'Complete setup for new hire including accounts and equipment',
      category: 'hr',
      estimatedTime: '4-6 hours',
      agentsRequired: ['HR Agent', 'IT Agent', 'Security Agent', 'Training Agent'],
      prompt: 'Set up onboarding for new employee [name] starting [date] in [department]'
    }
  ];

  // Enterprise-specific quick actions
  const enterpriseQuickActions: QuickAction[] = [
    {
      id: 'quarterly-report',
      label: 'Generate Report',
      icon: <Assessment />,
      description: 'Create comprehensive business intelligence reports',
      category: 'operations',
      estimatedTime: '30-60 minutes',
      agentsRequired: ['Analytics Agent', 'Data Agent', 'Visualization Agent'],
      prompt: 'Generate a quarterly performance report for [department/metric]'
    },
    {
      id: 'compliance-audit',
      label: 'Compliance Check',
      icon: <Security />,
      description: 'Automated compliance monitoring and reporting',
      category: 'operations',
      estimatedTime: '1-2 hours',
      agentsRequired: ['Compliance Agent', 'Security Agent', 'Audit Agent'],
      prompt: 'Run compliance audit for [regulation/standard] in [timeframe]'
    }
  ];

  const smartSuggestions: SmartSuggestion[] = [
    {
      id: 'workflow-suggestion-1',
      text: 'Automate employee onboarding process',
      confidence: 0.95,
      type: 'workflow',
      icon: <PersonAdd />,
      context: 'HR workflow optimization'
    },
    {
      id: 'workflow-suggestion-2',
      text: 'Set up expense approval automation',
      confidence: 0.88,
      type: 'workflow',
      icon: <Payment />,
      context: 'Finance process automation'
    },
    {
      id: 'query-suggestion-1',
      text: 'Show me this month\'s productivity metrics',
      confidence: 0.82,
      type: 'query',
      icon: <TrendingUp />,
      context: 'Analytics inquiry'
    }
  ];

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle send message with proper error handling
  const handleSend = useCallback(() => {
    try {
      const message = inputValue.trim();
      if (!message) return;
      
      console.log('🔄 ChatInterface: Sending message:', message);
      
      // Call the parent's send message handler
      onSendMessage(message);
      
      // Reset input and maintain focus
      setInputValue('');
      inputRef.current?.focus();
      
      // Hide suggestions if shown
      setShowSuggestions(false);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Optionally show an error message to the user
    }
  }, [inputValue, onSendMessage]);

  // Handle input change with debounced suggestions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value;
      setInputValue(value);
      
      // Show/hide suggestions based on input
      if (value.trim().length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error handling input change:', error);
    }
  }, []);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setInputValue(action.prompt);
    inputRef.current?.focus();
    if (onWorkflowTrigger) {
      onWorkflowTrigger(action.id);
    }
  }, [onWorkflowTrigger]);

  const handleSuggestionClick = useCallback((suggestion: SmartSuggestion) => {
    setInputValue(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // Animation variants for messages with proper typing
  const messageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.3 
      } 
    },
    exit: { 
      opacity: 0, 
      x: -20 
    }
  };

  // Render messages with animations and proper styling
  const renderMessages = () => {
    if (!messages || messages.length === 0) {
      return (
        <Box 
          component={motion.div}
          initial="hidden"
          animate="visible"
          variants={messageVariants}
          sx={{ 
            width: '100%',
            textAlign: 'center', 
            py: 8, 
            color: 'text.secondary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px'
          }}
        >
          <SmartToy sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            Welcome to AgentHive
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Start a conversation with our AI agents!
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%' }}>
        <AnimatePresence>
          {messages.map((msg: ChatMessageType, index: number) => (
            <Box
              key={msg.id || `msg-${index}`}
              component={motion.div}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              sx={{ 
                width: '100%', 
                mb: 2,
                '&:last-child': { mb: 0 }
              }}
            >
              <ChatMessage 
                message={msg} 
                isStreaming={isLoading && index === messages.length - 1}
              />
            </Box>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', position: 'relative' }}>
      {/* Floating Automation Hub Button */}
      <Tooltip title={`${isAutomationDrawerOpen ? 'Close' : 'Open'} Automation Hub`}>
        <IconButton
          onClick={() => setIsAutomationDrawerOpen(!isAutomationDrawerOpen)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: isAutomationDrawerOpen ? 300 : 20, // Move left when drawer is open
            zIndex: 1200,
            width: 56,
            height: 56,
            bgcolor: alpha(theme.palette.primary.main, isAutomationDrawerOpen ? 0.9 : 0.8),
            color: 'white',
            boxShadow: theme.shadows[6],
            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: theme.palette.primary.main,
              transform: 'scale(1.05)',
              boxShadow: theme.shadows[12],
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother transition for position change
            // Pulse animation when closed
            ...(!isAutomationDrawerOpen && {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                '70%': {
                  boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0)}`,
                },
                '100%': {
                  boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
                },
              },
            }),
          }}
        >
          <Tune sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>

      {/* Enterprise Navigation Buttons (if needed) */}
      {enterpriseMode && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: isAutomationDrawerOpen ? 370 : 100, // Adjust position based on drawer state
            zIndex: 1200,
            display: 'flex',
            gap: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
          }}
        >
          <Tooltip title="Navigate to Agent Network">
            <IconButton
              onClick={onNavigateToAgents}
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Hub />
            </IconButton>
          </Tooltip>
          <Tooltip title="Navigate to Workflow Hub">
            <IconButton
              onClick={onNavigateToWorkflows}
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.2),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <AutoAwesome />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(18, 18, 18, 0.7)' // Lighter dark background
          : 'rgba(255, 255, 255, 0.4)', // Very light transparent background
      }}>
        {/* Chat Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          px: 3,
          pt: { xs: 10, sm: 12 }, // Increased padding to properly clear the fixed transparent nav (80px mobile, 96px desktop)
          pb: 2,
          bgcolor: 'transparent', // Make chat area fully transparent
        }}>
          <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
          {/* Messages Container */}
          {messages.length > 0 ? (
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              // Remove all background and borders for clean transparent look
            }}>
              <Box sx={{ p: 0, height: '100%', overflow: 'auto' }}>
                {renderMessages()}
                
                {/* Active Workflow Visualization */}
                {currentWorkflow && (
                  <Box sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pt: 2, mt: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                      <AccountTree sx={{ color: theme.palette.primary.main }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Active Workflow: {currentWorkflow.name}
                      </Typography>
                      <Chip
                        label={currentWorkflow.status}
                        size="small"
                        color={
                          currentWorkflow.status === 'completed' ? 'success' :
                          currentWorkflow.status === 'error' ? 'error' :
                          currentWorkflow.status === 'processing' ? 'warning' : 'default'
                        }
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {currentWorkflow.steps?.map((step, index) => (
                        <Chip
                          key={index}
                          label={step.agentId}
                          size="small"
                          variant={step.status === 'completed' ? 'filled' : 'outlined'}
                          color={
                            step.status === 'completed' ? 'success' :
                            step.status === 'error' ? 'error' :
                            step.status === 'processing' ? 'warning' : 'default'
                          }
                          icon={
                            step.status === 'completed' ? <CheckCircle /> :
                            step.status === 'processing' ? <AutoAwesome /> :
                            undefined
                          }
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            // Welcome screen when no messages - Show Enterprise Agent Selector
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'flex-start', 
              justifyContent: 'center',
              flexDirection: 'column',
              pt: 4,
              px: 2
            }}>
              <EnterpriseAgentSelector 
                onQuickActionSelect={(action: string, agentType: AgentType) => {
                  // Handle quick action by sending the pre-defined prompt
                  onSendMessage(action, agentType);
                }}
                onAgentSelect={(agentType: AgentType) => {
                  // Handle agent selection by sending a generic greeting to that agent
                  onSendMessage(`Hello! I'd like to get help from the ${agentType} agent.`, agentType);
                }}
              />
            </Box>
          )}
          </Box>
        </Box>

        {/* Input Area */}
        <Box 
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
            {/* Smart Suggestions */}
            <AnimatePresence>
              {showSuggestions && smartSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper 
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      💡 Smart Suggestions
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {smartSuggestions.map((suggestion) => (
                        <Chip
                          key={suggestion.id}
                          icon={suggestion.icon as React.ReactElement}
                          label={suggestion.text}
                          clickable
                          size="small"
                          onClick={() => handleSuggestionClick(suggestion)}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease-in-out'
                          }}
                        />
                      ))}
                    </Stack>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Input Field */}
            <Paper 
              elevation={0} // Remove shadow for lighter look
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, // Lighter border
                overflow: 'hidden',
                background: theme.palette.mode === 'dark' 
                  ? `rgba(30, 30, 30, 0.6)` // More transparent dark
                  : `rgba(255, 255, 255, 0.7)`, // More transparent light
                backdropFilter: 'blur(20px)', // Stronger blur for better text readability
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <Box sx={{ p: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  inputRef={inputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton size="small">
                          <AttachFile fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Voice input">
                          <span>
                            <IconButton size="small" disabled={isLoading}>
                              <Mic />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Send message">
                          <span>
                            <IconButton 
                              onClick={handleSend}
                              disabled={!inputValue.trim() || isLoading}
                              sx={{
                                bgcolor: inputValue.trim() ? theme.palette.primary.main : 'transparent',
                                color: inputValue.trim() ? 'white' : theme.palette.text.disabled,
                                '&:hover': {
                                  bgcolor: inputValue.trim() ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.1)
                                },
                                transition: 'all 0.2s ease-in-out',
                                ml: 1
                              }}
                            >
                              <Send />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
                  <Stack direction="row" spacing={1}>
                    {enterpriseMode && (
                      <>
                        <Chip
                          icon={<SmartToy />}
                          label="AI Agents Ready"
                          size="small"
                          clickable
                          onClick={onNavigateToAgents}
                          sx={{
                            fontSize: '0.7rem',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                          }}
                        />
                        <Chip
                          icon={<AutoAwesome />}
                          label={`${activeWorkflows || 0} Active Workflows`}
                          size="small"
                          clickable
                          onClick={onNavigateToWorkflows}
                          sx={{
                            fontSize: '0.7rem',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                          }}
                        />
                      </>
                    )}
                  </Stack>
                  
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Shift+Enter for new line
                    </Typography>
                    <Tooltip title="Workflow automation enabled">
                      <AccountTree sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            </Paper>

            {/* Quick Actions beneath input */}
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center' }}>
                  Popular Actions
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                {quickActions.slice(0, 4).map((action) => (
                  <Chip
                    key={action.id}
                    icon={action.icon as React.ReactElement}
                    label={action.label}
                    clickable
                    onClick={() => handleQuickAction(action)}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right-hand Automation Drawer */}
      <AnimatePresence>
        {isAutomationDrawerOpen && (
          <Box
            component={motion.div}
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              zIndex: 1000
            }}
          >
            <Paper 
              elevation={8}
              sx={{
                width: 280,
                height: '100%',
                borderRadius: 0,
                borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: theme.palette.mode === 'dark' 
                  ? `linear-gradient(180deg, ${alpha(theme.palette.primary.dark, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 20%, ${alpha(theme.palette.background.paper, 1)} 100%)`
                  : `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 20%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                overflow: 'auto',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? `0 0 25px ${alpha(theme.palette.primary.dark, 0.2)}, inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`
                  : `0 0 25px ${alpha('#000', 0.1)}, inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.05)}`
              }}
            >
              {/* Drawer Header - Redesigned sleeker version */}
              <Box 
                sx={{ 
                  px: 2, 
                  py: 1.5, 
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(90deg, ${alpha(theme.palette.primary.dark, 0.1)}, transparent)`
                    : `linear-gradient(90deg, ${alpha(theme.palette.primary.light, 0.05)}, transparent)`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: 2,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`,
                    opacity: 0.6
                  }
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.dark, 0.8)})`,
                        boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.25)}`,
                        border: `1px solid ${alpha(theme.palette.primary.light, 0.3)}`
                      }}
                    >
                      <AutoAwesome sx={{ fontSize: 15, color: '#fff' }} />
                    </Box>
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem', 
                          letterSpacing: '-0.01em',
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.text.primary})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: `0px 1px 2px ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                      >
                        Automation Hub
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          opacity: 0.7,
                          fontWeight: 500
                        }}
                      >
                        Quick workflows & actions
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={() => setIsAutomationDrawerOpen(false)}
                    sx={{ 
                      color: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      width: 24,
                      height: 24,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      }
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>

              {/* Enterprise Status - More compact */}
              {enterpriseMode && (
                <Box 
                  sx={{ 
                    px: 2, 
                    py: 1.5, 
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.success.main, 0.03)
                      : alpha(theme.palette.success.light, 0.03)
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      <AutoAwesome sx={{ fontSize: 12, color: theme.palette.success.main }} />
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        color: theme.palette.success.main,
                        textShadow: `0 1px 2px ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      Enterprise Mode Active
                    </Typography>
                  </Stack>
                  
                  {(activeWorkflows || 0) > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          backgroundColor: alpha(theme.palette.info.main, 0.08),
                          color: theme.palette.info.main,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                          boxShadow: `0 1px 3px ${alpha(theme.palette.info.main, 0.1)}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.info.main, 0.15),
                            transform: 'translateY(-1px)'
                          }
                        }}
                        onClick={onNavigateToWorkflows}
                      >
                        <AccountTree sx={{ fontSize: 12 }} />
                        <span>{activeWorkflows || 0} Active Workflow{(activeWorkflows || 0) !== 1 && 's'}</span>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Quick Actions in Drawer - Sleeker design */}
              <Box 
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  mt: 0.5
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.7,
                    pl: 0.5,
                    mb: 1.5
                  }}
                >
                  <Box
                    sx={{ 
                      width: 3,
                      height: 16, 
                      borderRadius: 4,
                      background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      opacity: 0.7
                    }}
                  />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      color: alpha(theme.palette.text.primary, 0.7)
                    }}
                  >
                    Quick Actions
                  </Typography>
                </Box>
                
                <Stack spacing={0.7}>
                  {(enterpriseMode ? [...quickActions, ...enterpriseQuickActions] : quickActions).map((action) => (
                    <Paper
                      key={action.id}
                      sx={{
                        p: 1.2,
                        cursor: 'pointer',
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        borderLeft: `3px solid ${action.color || theme.palette.primary.main}`,
                        borderRadius: 1,
                        background: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.background.paper, 0.4) 
                          : alpha(theme.palette.background.paper, 0.7),
                        backdropFilter: 'blur(8px)',
                        '&:hover': {
                          borderColor: action.color || theme.palette.primary.main,
                          bgcolor: alpha(action.color || theme.palette.primary.main, 0.03),
                          transform: 'translateX(2px)',
                          boxShadow: `0 2px 10px ${alpha(action.color || theme.palette.primary.main, 0.1)}`
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onClick={() => handleQuickAction(action)}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1,
                            background: `linear-gradient(135deg, ${alpha(action.color || theme.palette.primary.main, 0.8)}, ${alpha(action.color || theme.palette.primary.dark, 0.5)})`,
                            boxShadow: `0 2px 4px ${alpha(action.color || theme.palette.primary.main, 0.2)}`,
                            transform: 'translateZ(2px)',
                          }}
                        >
                          {React.cloneElement(action.icon, { 
                            fontSize: 'small',
                            sx: { fontSize: 14, color: '#fff' } 
                          })}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: '0.8rem',
                              color: theme.palette.mode === 'dark' 
                                ? lighten(theme.palette.text.primary, 0.1)
                                : theme.palette.text.primary
                            }} 
                            noWrap
                          >
                            {action.label}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <AccessTime sx={{ fontSize: 10, color: theme.palette.text.secondary, opacity: 0.7 }} />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 500,
                                color: theme.palette.text.secondary,
                                opacity: 0.9
                              }} 
                              noWrap
                            >
                              {action.estimatedTime}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ChatInterface;