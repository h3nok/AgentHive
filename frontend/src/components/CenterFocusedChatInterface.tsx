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
  useTheme,
  Container,
  Grid,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge
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
  Lightbulb,
  TrendingUp,
  CheckCircle,
  AccountTree,
  Hub,
  ElectricBolt,
  Security,
  Assessment,
  ExpandLess,
  ExpandMore,
  Bolt,
  Schedule,
  Analytics,
  Settings,
  Notifications
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
  color?: string;
}

interface AutomationAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'active' | 'inactive' | 'pending';
  usageCount: number;
  lastUsed?: string;
  color: string;
}

export interface CenterFocusedChatInterfaceProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  onWorkflowTrigger?: (workflowId: string, params?: any) => void;
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

const CenterFocusedChatInterface: React.FC<CenterFocusedChatInterfaceProps> = ({
  onSendMessage,
  isLoading = false,
  onWorkflowTrigger,
  enterpriseMode = true,
  activeWorkflows = 0,
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
  
  // Component state
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [automationDrawerOpen, setAutomationDrawerOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'hr': true,
    'finance': true,
    'operations': true,
    'general': true
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages.length]);

  // Quick Actions - positioned below input
  const quickActions: QuickAction[] = [
    {
      id: 'time-off-request',
      label: 'Request Time Off',
      icon: <AccessTime />,
      description: 'Submit vacation, sick leave, or personal time off request',
      category: 'hr',
      estimatedTime: '2-4 hours',
      agentsRequired: ['HR Agent', 'Calendar Agent', 'Policy Agent'],
      prompt: 'I need to request time off from [start date] to [end date] for [reason]',
      color: '#ff7043'
    },
    {
      id: 'expense-report',
      label: 'Submit Expenses',
      icon: <Payment />,
      description: 'Upload receipts and create expense report for approval',
      category: 'finance',
      estimatedTime: '1-2 hours',
      agentsRequired: ['Finance Agent', 'OCR Agent', 'Approval Agent'],
      prompt: 'I need to submit an expense report for business expenses',
      color: '#66bb6a'
    },
    {
      id: 'onboard-employee',
      label: 'Onboard New Employee',
      icon: <PersonAdd />,
      description: 'Complete setup for new hire including accounts and equipment',
      category: 'hr',
      estimatedTime: '4-6 hours',
      agentsRequired: ['HR Agent', 'IT Agent', 'Compliance Agent'],
      prompt: 'I need to onboard a new employee starting [date]',
      color: '#42a5f5'
    },
    {
      id: 'review-contract',
      label: 'Review Contract',
      icon: <Assignment />,
      description: 'AI-powered contract analysis with risk assessment',
      category: 'general',
      estimatedTime: '2-3 hours',
      agentsRequired: ['Legal Agent', 'Compliance Agent'],
      prompt: 'I need help reviewing a contract for potential risks and compliance',
      color: '#ab47bc'
    }
  ];

  // Automation Actions for persistent drawer
  const automationActions: AutomationAction[] = [
    {
      id: 'auto-timeoff',
      title: 'Auto Time-Off Processing',
      description: 'Automatically process and route time-off requests',
      icon: <Schedule />,
      category: 'hr',
      status: 'active',
      usageCount: 247,
      lastUsed: '2 hours ago',
      color: '#ff7043'
    },
    {
      id: 'expense-automation',
      title: 'Expense Report Automation',
      description: 'Smart expense categorization and approval workflows',
      icon: <Analytics />,
      category: 'finance',
      status: 'active',
      usageCount: 189,
      lastUsed: '1 day ago',
      color: '#66bb6a'
    },
    {
      id: 'contract-analysis',
      title: 'Contract Analysis Engine',
      description: 'AI-powered contract review and risk assessment',
      icon: <Security />,
      category: 'general',
      status: 'pending',
      usageCount: 56,
      lastUsed: '3 days ago',
      color: '#ab47bc'
    },
    {
      id: 'workflow-optimizer',
      title: 'Workflow Optimizer',
      description: 'Continuously optimize business processes',
      icon: <TrendingUp />,
      category: 'operations',
      status: 'active',
      usageCount: 312,
      lastUsed: '30 minutes ago',
      color: '#42a5f5'
    }
  ];

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage('');
  }, [message, onSendMessage]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setMessage(action.prompt);
    
    // Trigger the workflow first
    if (onWorkflowTrigger) {
      onWorkflowTrigger(action.id, { prompt: action.prompt });
    }
    
    // Auto-send after brief delay
    setTimeout(() => {
      onSendMessage(action.prompt);
      setMessage('');
    }, 500);
  }, [onSendMessage, onWorkflowTrigger]);

  const handleVoiceRecord = useCallback(() => {
    setIsRecording(!isRecording);
    // Implementation would handle voice recording
  }, [isRecording]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'inactive': return theme.palette.text.disabled;
      default: return theme.palette.text.secondary;
    }
  };

  const automationsByCategory = automationActions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, AutomationAction[]>);

  const hasMessages = sessionMessages.length > 0;

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingRight: automationDrawerOpen ? '320px' : '0px',
        transition: 'padding-right 0.3s ease'
      }}>
        {/* Messages Area - Only show if there are messages */}
        {hasMessages && (
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            px: 3,
            py: 2
          }}>
            <Container maxWidth="md">
              {sessionMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </Container>
          </Box>
        )}

        {/* Center Input Area */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: hasMessages ? '200px' : '60vh',
          px: 3,
          py: 4
        }}>
          <Container maxWidth="md">
            <Stack spacing={4} alignItems="center">
              {/* Welcome Message (only show when no messages) */}
              {!hasMessages && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}>
                      <AutoAwesome sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography variant="h4" fontWeight={600} color="text.primary">
                      {enterpriseMode ? 'Enterprise AI Assistant' : 'AI Assistant'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" maxWidth={600}>
                      Start a conversation with our AI assistant or choose from the quick actions below to automate your workflows.
                    </Typography>
                  </Stack>
                </motion.div>
              )}

              {/* Input Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ width: '100%' }}
              >
                <Paper 
                  elevation={0}
                  sx={{
                    p: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 4,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      ref={inputRef}
                      fullWidth
                      multiline
                      maxRows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask me anything or describe what you'd like to automate..."
                      variant="standard"
                      InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <motion.div
                              animate={isLoading ? { rotate: 360 } : {}}
                              transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: "linear" }}
                            >
                              <Avatar sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main
                              }}>
                                <SmartToy sx={{ fontSize: 18 }} />
                              </Avatar>
                            </motion.div>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: '1.1rem',
                          lineHeight: 1.6,
                          py: 2,
                          px: 2
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Voice Input">
                        <IconButton 
                          onClick={handleVoiceRecord}
                          sx={{ 
                            color: isRecording ? theme.palette.error.main : theme.palette.text.secondary,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                          }}
                        >
                          <Mic />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Attach File">
                        <IconButton sx={{ 
                          color: theme.palette.text.secondary,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}>
                          <AttachFile />
                        </IconButton>
                      </Tooltip>
                      
                      <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isLoading}
                        sx={{
                          minWidth: 'auto',
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                          }
                        }}
                      >
                        <Send sx={{ fontSize: 20 }} />
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </motion.div>

              {/* Quick Actions - Below Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ width: '100%' }}
              >
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={600} textAlign="center" color="text.secondary">
                    Quick Actions
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { 
                        xs: '1fr', 
                        sm: 'repeat(2, 1fr)', 
                        md: 'repeat(4, 1fr)' 
                      }, 
                      gap: 2 
                    }}
                  >
                    {quickActions.map((action, index) => (
                      <Box key={action.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 * index }}
                        >
                          <Card
                            sx={{
                              height: '100%',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              background: alpha(theme.palette.background.paper, 0.7),
                              backdropFilter: 'blur(10px)',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 40px ${alpha(action.color || theme.palette.primary.main, 0.2)}`,
                                borderColor: alpha(action.color || theme.palette.primary.main, 0.3)
                              }
                            }}
                            onClick={() => handleQuickAction(action)}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Avatar sx={{ 
                                    bgcolor: alpha(action.color || theme.palette.primary.main, 0.1),
                                    color: action.color || theme.palette.primary.main,
                                    width: 48,
                                    height: 48
                                  }}>
                                    {action.icon}
                                  </Avatar>
                                  <Chip 
                                    label={action.estimatedTime}
                                    size="small"
                                    sx={{ 
                                      bgcolor: alpha(action.color || theme.palette.primary.main, 0.1),
                                      color: action.color || theme.palette.primary.main,
                                      fontWeight: 600
                                    }}
                                  />
                                </Box>
                                
                                <Typography variant="h6" fontWeight={600} fontSize="1rem">
                                  {action.label}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                  {action.description}
                                </Typography>
                                
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  {action.agentsRequired.slice(0, 2).map((agent) => (
                                    <Chip
                                      key={agent}
                                      label={agent}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        height: 24,
                                        borderColor: alpha(action.color || theme.palette.primary.main, 0.3)
                                      }}
                                    />
                                  ))}
                                  {action.agentsRequired.length > 2 && (
                                    <Chip
                                      label={`+${action.agentsRequired.length - 2}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        height: 24,
                                        borderColor: alpha(action.color || theme.palette.primary.main, 0.3)
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </motion.div>
            </Stack>
          </Container>
        </Box>
      </Box>

      {/* Persistent Automation Drawer */}
      <Drawer
        variant="persistent"
        anchor="right"
        open={automationDrawerOpen}
        sx={{
          width: 320,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 320,
            boxSizing: 'border-box',
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `-4px 0 20px ${alpha(theme.palette.common.black, 0.1)}`,
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Automation Hub
            </Typography>
            <IconButton 
              size="small"
              onClick={() => setAutomationDrawerOpen(false)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <ExpandMore />
            </IconButton>
          </Stack>
          
          <Stack direction="row" spacing={1} mb={2}>
            <Chip
              icon={<Bolt />}
              label={`${automationActions.filter(a => a.status === 'active').length} Active`}
              size="small"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<Schedule />}
              label={`${automationActions.filter(a => a.status === 'pending').length} Pending`}
              size="small"
              color="warning"
              variant="outlined"
            />
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {Object.entries(automationsByCategory).map(([category, actions]) => (
            <Box key={category}>
              <ListItemButton 
                onClick={() => toggleCategory(category)}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText 
                  primary={category.charAt(0).toUpperCase() + category.slice(1)}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                />
                {expandedCategories[category] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedCategories[category]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {actions.map((action) => (
                    <ListItem key={action.id} sx={{ px: 3, py: 1 }}>
                      <Card sx={{ 
                        width: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 16px ${alpha(action.color, 0.2)}`
                        }
                      }}>
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar sx={{ 
                                bgcolor: alpha(action.color, 0.1),
                                color: action.color,
                                width: 36,
                                height: 36
                              }}>
                                {action.icon}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="subtitle2" fontWeight={600} fontSize="0.85rem">
                                  {action.title}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Badge
                                    badgeContent=""
                                    color={action.status === 'active' ? 'success' : action.status === 'pending' ? 'warning' : 'default'}
                                    variant="dot"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {action.status}
                                  </Typography>
                                </Stack>
                              </Box>
                            </Stack>
                            
                            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                              {action.description}
                            </Typography>
                            
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                Used {action.usageCount} times
                              </Typography>
                              {action.lastUsed && (
                                <Typography variant="caption" color="text.secondary">
                                  {action.lastUsed}
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          ))}
        </Box>

        {/* Drawer Footer */}
        <Box sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Settings />}
            onClick={onNavigateToWorkflows}
            sx={{ mb: 1 }}
          >
            Manage Automations
          </Button>
          <Button
            fullWidth
            variant="text"
            startIcon={<Hub />}
            onClick={onNavigateToAgents}
            size="small"
          >
            View Agent Network
          </Button>
        </Box>
      </Drawer>

      {/* Floating Toggle for Automation Drawer */}
      {!automationDrawerOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            position: 'fixed',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1000
          }}
        >
          <IconButton
            onClick={() => setAutomationDrawerOpen(true)}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              width: 56,
              height: 56,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                transform: 'scale(1.1)',
              }
            }}
          >
            <AutoAwesome />
          </IconButton>
        </motion.div>
      )}
    </Box>
  );
};

export default CenterFocusedChatInterface;
