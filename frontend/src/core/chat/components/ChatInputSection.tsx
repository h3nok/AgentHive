import React, { useState } from 'react';
import { Box, Typography, Stack, Chip, Paper, alpha, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { AutoAwesome, AccessTime, Payment, PersonAdd, CalendarToday, TrendingUp, CheckCircle } from '@mui/icons-material';
import EnhancedEnterpriseInputBar from '../../../shared/components/EnhancedEnterpriseInputBar';

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

interface CurrentAgent {
  id: string;
  name: string;
  status: string;
}

export interface ChatInputSectionProps {
  onSendMessage: (message: string, agent?: string, workflow?: string) => void;
  isLoading?: boolean;
  inputValue: string;
  showSuggestions: boolean;
  currentAgent?: CurrentAgent;
  onQuickAction?: (action: QuickAction) => void;
  onSuggestionClick?: (suggestion: SmartSuggestion) => void;
  enterpriseMode?: boolean;
}

const ChatInputSection: React.FC<ChatInputSectionProps> = ({
  onSendMessage,
  isLoading = false,
  inputValue,
  showSuggestions,
  currentAgent,
  onQuickAction,
  onSuggestionClick,
  enterpriseMode = false
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

  // Smart Suggestions
  const smartSuggestions: SmartSuggestion[] = [
    {
      id: 'productivity-tip',
      text: 'Check team productivity metrics',
      confidence: 0.85,
      type: 'workflow',
      icon: <TrendingUp sx={{ fontSize: 14 }} />,
      context: 'Based on recent activity patterns'
    },
    {
      id: 'schedule-optimization',
      text: 'Optimize your schedule for tomorrow',
      confidence: 0.78,
      type: 'action',
      icon: <CalendarToday sx={{ fontSize: 14 }} />,
      context: 'Calendar analysis suggests improvements'
    },
    {
      id: 'expense-reminder',
      text: 'Submit pending expense reports',
      confidence: 0.92,
      type: 'workflow',
      icon: <Payment sx={{ fontSize: 14 }} />,
      context: 'You have 3 pending expense items'
    }
  ];

  const handleQuickAction = (action: QuickAction) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
    // Also send the prompt as a message
    onSendMessage(action.prompt, currentAgent?.id);
  };

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
    // Send suggestion text as message
    onSendMessage(suggestion.text, currentAgent?.id);
  };

  return (
    <Box>
      {/* Smart Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
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

      {/* Modern Input Bar */}
      <Box sx={{ mt: 2 }}>
        <EnhancedEnterpriseInputBar
          onSendMessage={(msg: string, agent?: string) => onSendMessage(msg, agent)}
          isLoading={isLoading}
          selectedAgent={currentAgent?.id || 'general'}
          enableVoiceInput
          externalValue={inputValue}
        />
      </Box>

      {/* Quick Actions beneath input */}
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Popular Actions
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
          {(enterpriseMode 
            ? [...quickActions.slice(0, 2), ...enterpriseQuickActions.slice(0, 2)]
            : quickActions.slice(0, 4)
          ).map((action) => (
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
  );
};

export default ChatInputSection;
