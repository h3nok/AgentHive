import React from 'react';
import { Box, Typography, Stack, Chip, Paper, IconButton, alpha, useTheme } from '@mui/material';
import { lighten } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AutoAwesome,
  ChevronRight,
  AccountTree,
  AccessTime,
  Payment,
  PersonAdd,
  CalendarToday,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';

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

export interface AutomationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  enterpriseMode?: boolean;
  activeWorkflows?: number;
  onNavigateToWorkflows?: () => void;
  onQuickAction?: (action: QuickAction) => void;
  children?: React.ReactNode; // For future agentic components
}

const AutomationPanel: React.FC<AutomationPanelProps> = ({
  isOpen,
  onClose,
  enterpriseMode = false,
  activeWorkflows = 0,
  onNavigateToWorkflows,
  onQuickAction,
  children
}) => {
  const theme = useTheme();

  // Quick Actions - Core functionality
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
      agentsRequired: ['Finance Agent', 'Approval Agent'],
      prompt: 'I need to submit an expense report for [expense type] totaling [amount]'
    },
    {
      id: 'onboard-employee',
      label: 'Onboard Employee',
      icon: <PersonAdd />,
      description: 'Start employee onboarding workflow with document preparation',
      category: 'hr',
      estimatedTime: '4-6 hours',
      agentsRequired: ['HR Agent', 'IT Agent', 'Security Agent'],
      prompt: 'I need to onboard a new employee [name] for [position] starting [date]'
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: <CalendarToday />,
      description: 'Find optimal meeting time and send invitations',
      category: 'operations',
      estimatedTime: '30 minutes',
      agentsRequired: ['Calendar Agent', 'Communication Agent'],
      prompt: 'I need to schedule a meeting about [topic] with [attendees] for [duration]'
    }
  ];

  // Enterprise Quick Actions
  const enterpriseQuickActions: QuickAction[] = [
    {
      id: 'quarterly-analysis',
      label: 'Quarterly Analysis',
      icon: <TrendingUp />,
      description: 'Generate comprehensive quarterly performance report',
      category: 'finance',
      color: theme.palette.success.main,
      estimatedTime: '2-3 hours',
      agentsRequired: ['Analytics Agent', 'Finance Agent', 'Report Agent'],
      prompt: 'Generate quarterly analysis for Q[X] [YYYY] including revenue, costs, and KPI trends'
    },
    {
      id: 'compliance-audit',
      label: 'Compliance Audit',
      icon: <CheckCircle />,
      description: 'Conduct automated compliance verification and reporting',
      category: 'operations',
      color: theme.palette.info.main,
      estimatedTime: '3-4 hours',
      agentsRequired: ['Compliance Agent', 'Audit Agent', 'Security Agent'],
      prompt: 'Initiate compliance audit for [department/process] following [regulation] standards'
    }
  ];

  const handleQuickAction = (action: QuickAction) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            {/* Drawer Header */}
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
                  onClick={onClose}
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

            {/* Enterprise Status Section (for future agentic features) */}
            {enterpriseMode && (activeWorkflows > 0) && (
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <span>{activeWorkflows} Active Workflow{activeWorkflows !== 1 ? 's' : ''}</span>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Future Agentic Components Injection Point */}
            {children}

            {/* Quick Actions in Drawer */}
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
  );
};

export default AutomationPanel;
