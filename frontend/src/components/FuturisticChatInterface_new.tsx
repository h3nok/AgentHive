import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectMessagesBySessionId } from '../features/chat/chatSlice';
import ChatMessage from './ChatMessage';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Send,
  Mic,
  AttachFile,
  SmartToy,
  AutoAwesome,
  Psychology,
  Assignment,
  AccessTime,
  Payment,
  PersonAdd,
  CalendarToday,
  ExpandLess,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  AccountTree,
  Hub,
  ElectricBolt,
  Security,
  Assessment
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'hr' | 'finance' | 'operations' | 'general';
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

// Enhanced props interface for enterprise integration
export interface FuturisticChatInterfaceProps {
  onSendMessage: (message: string, agent?: string, workflow?: string) => void;
  isLoading?: boolean;
  onStopRequest?: () => void;
  onWorkflowTrigger?: (workflowId: string, params?: any) => void;
  // New enterprise integration props
  enterpriseMode?: boolean;
  activeWorkflows?: number;
  onNavigateToWorkflows?: () => void;
  onNavigateToAgents?: () => void;
  currentAgent?: {
    id: string;
    name: string;
    status: string;
  };
}

const FuturisticChatInterface: React.FC<FuturisticChatInterfaceProps> = ({
  onSendMessage,
  isLoading = false,
  onStopRequest,
  onWorkflowTrigger,
  enterpriseMode,
  activeWorkflows,
  onNavigateToWorkflows,
  onNavigateToAgents,
  currentAgent
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Redux state
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  const sessionMessages = useSelector(selectMessagesBySessionId(activeSessionId));
  const activeSession = useSelector((state: RootState) => 
    state.chat.sessions.find(s => s.id === activeSessionId)
  );
  const currentWorkflow = activeSession?.workflow;
  
  const [message, setMessage] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages.length]);

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
      prompt: 'Start onboarding process for new employee [name] in [department] starting [date]'
    },
    {
      id: 'contract-review',
      label: 'Review Contract',
      icon: <Assignment />,
      description: 'AI-powered contract analysis with risk assessment',
      category: 'finance',
      estimatedTime: '2-3 hours',
      agentsRequired: ['Legal Agent', 'Risk Agent', 'Document Agent'],
      prompt: 'Please review this contract for [type] with [vendor/client]'
    },
    {
      id: 'performance-analysis',
      label: 'Performance Report',
      icon: <TrendingUp />,
      description: 'Generate comprehensive performance analytics',
      category: 'general',
      estimatedTime: '1 hour',
      agentsRequired: ['Analytics Agent', 'Data Agent'],
      prompt: 'Generate a performance report for [department/individual] covering [timeframe]'
    }
  ];

  // Enhanced quick actions for enterprise mode
  const enterpriseQuickActions: QuickAction[] = [
    {
      id: 'workflow-status',
      label: 'Check Workflow Status',
      icon: <TrendingUp />,
      description: 'View status of all active enterprise workflows',
      category: 'operations',
      estimatedTime: 'Instant',
      agentsRequired: ['Workflow Orchestrator', 'Status Monitor'],
      prompt: 'Show me the status of all my current workflows and any pending approvals'
    },
    {
      id: 'emergency-escalation',
      label: 'Emergency Escalation',
      icon: <Security />,
      description: 'Escalate urgent matters to leadership with priority routing',
      category: 'operations',
      estimatedTime: '5-10 minutes',
      agentsRequired: ['Communication Agent', 'Escalation Manager', 'Alert System'],
      prompt: 'I need to escalate an urgent issue: [description] with priority level [high/critical]'
    },
    {
      id: 'resource-allocation',
      label: 'Resource Allocation',
      icon: <Assessment />,
      description: 'Optimize resource distribution across departments',
      category: 'operations',
      estimatedTime: '30-60 minutes',
      agentsRequired: ['Resource Manager', 'Analytics Agent', 'Planning Agent'],
      prompt: 'Help me allocate resources for [project/department] with budget of [amount]'
    },
    {
      id: 'compliance-check',
      label: 'Compliance Review',
      icon: <Security />,
      description: 'Comprehensive compliance and risk assessment',
      category: 'finance',
      estimatedTime: '1-3 hours',
      agentsRequired: ['Compliance Agent', 'Risk Assessment', 'Legal Agent'],
      prompt: 'Perform a compliance review for [department/process] focusing on [regulations]'
    }
  ];

  // Smart suggestions based on context
  const smartSuggestions: SmartSuggestion[] = [
    {
      id: 'suggest-workflow',
      text: 'Set up automated invoice processing workflow',
      confidence: 92,
      type: 'workflow',
      icon: <Psychology />,
      context: 'Based on your recent finance queries'
    },
    {
      id: 'suggest-meeting',
      text: 'Schedule quarterly review meeting',
      confidence: 87,
      type: 'action',
      icon: <CalendarToday />,
      context: 'It\'s been 3 months since last review'
    },
    {
      id: 'suggest-report',
      text: 'Generate team productivity report',
      confidence: 78,
      type: 'query',
      icon: <Assessment />,
      context: 'Monthly reporting cycle due soon'
    }
  ];

  const handleSendMessage = useCallback(() => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      setShowSuggestions(false);
    }
  }, [message, onSendMessage, isLoading]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setMessage(action.prompt);
    
    // Trigger the workflow first
    if (onWorkflowTrigger) {
      onWorkflowTrigger(action.id, { prompt: action.prompt });
    }
    
    // Auto-send the message after a brief delay to allow workflow setup
    setTimeout(() => {
      onSendMessage(action.prompt, 'workflow-orchestrator');
      setMessage(''); // Clear the input after sending
    }, 500);
    
    // Auto-focus input after selecting quick action
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onWorkflowTrigger, onSendMessage]);

  const handleSuggestionClick = useCallback((suggestion: SmartSuggestion) => {
    setMessage(suggestion.text);
    setShowSuggestions(false);
    // Auto-send for high confidence suggestions
    if (suggestion.confidence > 85) {
      setTimeout(() => handleSendMessage(), 500);
    }
  }, [handleSendMessage]);

  const handleVoiceRecord = useCallback(() => {
    setIsRecording(!isRecording);
    // Implementation would handle voice recording
  }, [isRecording]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return theme.palette.success.main;
      case 'busy': return theme.palette.warning.main;
      case 'offline': return theme.palette.text.disabled;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', position: 'relative' }}>
      {/* Automation Drawer */}
      <Paper 
        elevation={2}
        sx={{ 
          width: 320,
          height: '100%',
          borderRadius: 0,
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          overflow: 'auto'
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 32, height: 32 }}>
              <AutoAwesome sx={{ fontSize: 18, color: theme.palette.primary.main }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Automation Hub
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quick actions & workflows
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Enterprise Status */}
        {enterpriseMode && (
          <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack spacing={1}>
              <Chip
                icon={<AutoAwesome />}
                label="Enterprise Mode"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                }}
              />
              {(activeWorkflows || 0) > 0 && (
                <Chip
                  icon={<AccountTree />}
                  label={`${activeWorkflows || 0} Active Workflows`}
                  size="small"
                  clickable
                  onClick={onNavigateToWorkflows}
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.info.main, 0.2)
                    }
                  }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Quick Actions in Drawer */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Quick Actions
          </Typography>
          <Stack spacing={1}>
            {(enterpriseMode ? [...quickActions, ...enterpriseQuickActions] : quickActions).map((action) => (
              <Paper
                key={action.id}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2]
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => handleQuickAction(action)}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar 
                    sx={{ 
                      width: 28, 
                      height: 28,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}
                  >
                    {action.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }} noWrap>
                      {action.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                      {action.estimatedTime}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            borderRadius: 0,
            background: enterpriseMode 
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {enterpriseMode ? 'Enterprise AI Assistant' : 'Autonomous Enterprise Assistant'}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {enterpriseMode 
                  ? 'Integrated with your enterprise workflows • Multi-agent coordination enabled'
                  : 'Powered by specialized AI agents • Natural language workflow automation'
                }
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              {enterpriseMode && (
                <>
                  <Tooltip title="Navigate to Agent Network">
                    <IconButton
                      onClick={onNavigateToAgents}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.2)
                        }
                      }}
                    >
                      <Hub />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Navigate to Workflow Hub">
                    <IconButton
                      onClick={onNavigateToWorkflows}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.secondary.main, 0.2)
                        }
                      }}
                    >
                      <AutoAwesome />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Chat Messages Area */}
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Messages */}
          {(sessionMessages.length > 0 || currentWorkflow) && (
            <Card sx={{ m: 3, borderRadius: 2, maxHeight: '60vh', overflow: 'auto' }}>
              <CardContent sx={{ p: 0 }}>
                {/* Chat Messages */}
                <Box sx={{ p: 2 }}>
                  {sessionMessages.map((msg, index) => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      isStreaming={isLoading && index === sessionMessages.length - 1}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </Box>
                
                {/* Active Workflow Visualization */}
                {currentWorkflow && (
                  <Box sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, p: 2 }}>
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
                          label={step.title || step.description}
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
              </CardContent>
            </Card>
          )}

          {/* Centered Input Area */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: sessionMessages.length === 0 ? '60vh' : 'auto',
              px: 3,
              pb: 3
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 800 }}>
              {/* Smart Suggestions */}
              <AnimatePresence>
                {showSuggestions && smartSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card sx={{ mb: 2, borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                          Smart Suggestions
                        </Typography>
                        <Stack spacing={1}>
                          {smartSuggestions.map((suggestion) => (
                            <Paper
                              key={suggestion.id}
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                                }
                              }}
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar 
                                  sx={{ 
                                    width: 24, 
                                    height: 24,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main
                                  }}
                                >
                                  {suggestion.icon}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {suggestion.text}
                                  </Typography>
                                  {suggestion.context && (
                                    <Typography variant="caption" color="text.secondary">
                                      {suggestion.context}
                                    </Typography>
                                  )}
                                </Box>
                                <Chip
                                  label={`${suggestion.confidence}%`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    color: theme.palette.success.main
                                  }}
                                />
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Input Field */}
              <Paper 
                elevation={3}
                sx={{ 
                  borderRadius: 3,
                  background: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                      },
                      '&:focus-within': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}
                  >
                    <TextField
                      ref={inputRef}
                      fullWidth
                      multiline
                      maxRows={4}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        setShowSuggestions(e.target.value.length > 2);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="✨ Describe your enterprise workflow or ask me anything..."
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <motion.div
                              animate={isLoading ? { rotate: 360 } : {}}
                              transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: "linear" }}
                            >
                              <Avatar 
                                sx={{ 
                                  width: 28, 
                                  height: 28,
                                  bgcolor: alpha(getStatusColor(currentAgent?.status || 'available'), 0.15),
                                  color: getStatusColor(currentAgent?.status || 'available'),
                                  border: `2px solid ${alpha(getStatusColor(currentAgent?.status || 'available'), 0.2)}`
                                }}
                              >
                                <SmartToy sx={{ fontSize: 16 }} />
                              </Avatar>
                            </motion.div>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Voice Input">
                                <IconButton 
                                  onClick={handleVoiceRecord}
                                  size="small"
                                  sx={{ 
                                    color: isRecording ? theme.palette.error.main : theme.palette.text.secondary,
                                    '&:hover': {
                                      bgcolor: alpha(isRecording ? theme.palette.error.main : theme.palette.action.hover, 0.1)
                                    }
                                  }}
                                >
                                  <Mic sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Attach File">
                                <IconButton 
                                  size="small"
                                  sx={{ 
                                    color: theme.palette.text.secondary,
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.action.hover, 0.1)
                                    }
                                  }}
                                >
                                  <AttachFile sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Tooltip title={message.trim() ? "Send Message" : "Type a message to send"}>
                                  <span>
                                    <IconButton 
                                      onClick={handleSendMessage}
                                      disabled={!message.trim() || isLoading}
                                      size="medium"
                                      sx={{ 
                                        ml: 0.5,
                                        bgcolor: message.trim() ? theme.palette.primary.main : alpha(theme.palette.action.disabled, 0.1),
                                        color: message.trim() ? theme.palette.primary.contrastText : theme.palette.text.disabled,
                                        border: `2px solid ${message.trim() ? theme.palette.primary.main : 'transparent'}`,
                                        '&:hover': {
                                          bgcolor: message.trim() ? theme.palette.primary.dark : alpha(theme.palette.action.disabled, 0.2),
                                          transform: 'scale(1.05)'
                                        },
                                        '&:disabled': {
                                          bgcolor: alpha(theme.palette.action.disabled, 0.05),
                                          color: theme.palette.text.disabled
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                      }}
                                    >
                                      <Send sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </motion.div>
                            </Stack>
                          </InputAdornment>
                        ),
                        sx: {
                          border: 'none',
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          },
                          fontSize: '1rem',
                          py: 0.5
                        }
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          fontWeight: 400,
                          lineHeight: 1.5,
                          '&::placeholder': {
                            color: alpha(theme.palette.text.secondary, 0.7),
                            fontStyle: 'italic'
                          }
                        }
                      }}
                    />
                  </Box>

                  {/* Status Indicator */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <motion.div
                        animate={isLoading ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
                      >
                        <ElectricBolt 
                          sx={{ 
                            fontSize: 16, 
                            color: isLoading ? theme.palette.warning.main : theme.palette.success.main 
                          }} 
                        />
                      </motion.div>
                      <Typography variant="caption" color="text.secondary">
                        {isLoading ? 'Agent is thinking...' : 'Ready to assist'}
                      </Typography>
                      
                      {enterpriseMode && (
                        <>
                          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                          <Chip
                            icon={<Hub />}
                            label="Multi-Agent System"
                            size="small"
                            variant="outlined"
                            clickable
                            onClick={onNavigateToAgents}
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
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, textAlign: 'center' }}>
                  Popular Actions
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                  {quickActions.slice(0, 4).map((action) => (
                    <Chip
                      key={action.id}
                      icon={action.icon}
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
      </Box>
    </Box>
  );
};

export default FuturisticChatInterface;
