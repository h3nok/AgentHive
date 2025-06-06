import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { HRAgentForm } from './HRAgentForm';
import { useUKGDemo } from './hooks';
import { UKG_DEMO_FLOWS } from './types';
import type { ChatMessage } from '../../features/chat/chatSlice';
import MarkdownRenderer from '../markdown/MarkdownRenderer';
import { preprocessMarkdown } from '../../utils/preprocessMarkdown';
import FancyTypingDots from '../FancyTypingDots';

interface UKGChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const UKGChatMessage: React.FC<UKGChatMessageProps> = ({
  message
}) => {
  const { handleFormSubmit, demoState } = useUKGDemo();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isSystem = message.sender === 'system';
  const isHRAgent = message.sender === 'assistant' && message.agent === 'hr';

  // System message styling
  if (isSystem) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 1,
          px: 2
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 3,
            py: 1.5,
            bgcolor: isDark 
              ? 'rgba(25, 118, 210, 0.12)' 
              : 'rgba(25, 118, 210, 0.08)',
            borderRadius: 20,
            border: isDark 
              ? '1px solid rgba(25, 118, 210, 0.3)' 
              : '1px solid rgba(25, 118, 210, 0.2)',
            maxWidth: 400
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              textAlign: 'center',
              fontSize: '0.875rem'
            }}
          >
            <MarkdownRenderer markdown={preprocessMarkdown(message.text)} />
          </Typography>
        </Paper>
      </Box>
    );
  }

  // HR Agent message with optional form
  if (isHRAgent) {
    // Get form fields from the time-off request flow
    const timeOffFlow = UKG_DEMO_FLOWS.find(flow => flow.id === 'time-off-request');
    const formFields = timeOffFlow?.hrAgentResponse.formFields || [];
    let showForm = formFields.length > 0 && !demoState.formData.startDate;

    // Determine if the original user message is date-specific (auto) or generic (form)
    const userMessage = message.text || '';
    const dateRe = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{2,4})\b/g;
    const typeRe = /(personal|vacation|sick|pto|bereavement)/i;
    const dates = userMessage.match(dateRe) || [];
    const typeMatch = userMessage.match(typeRe);
    const shouldAutomate = dates.length >= 2 && typeMatch;

    // If the form would be shown and shouldAutomate, auto-submit with extracted values
    if (showForm && shouldAutomate) {
      const [startDateRaw, endDateRaw] = dates;
      const startDate = startDateRaw || '';
      const endDate = endDateRaw || '';
      const typeMatchStr = typeMatch ? typeMatch[0] : '';
      const timeOffType = typeMatchStr ? typeMatchStr[0].toUpperCase() + typeMatchStr.slice(1).toLowerCase() : '';
      const formData = {
        startDate,
        endDate,
        timeOffType,
        reason: ''
      };
      handleFormSubmit(formData);
      showForm = false;
    }

    // Example data for PTO balance and after-approval
    const ptoBalanceBefore = 5;
    const ptoBalanceAfter = Math.max(0, ptoBalanceBefore - (demoState.formData.startDate && demoState.formData.endDate ? (Math.ceil((new Date(demoState.formData.endDate).getTime() - new Date(demoState.formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1));
    const leaveType = demoState.formData.timeOffType || 'Personal Day';
    const leaveDates = demoState.formData.startDate && demoState.formData.endDate ? `${demoState.formData.startDate} ➔ ${demoState.formData.endDate}` : '';
    const status = 'Awaiting manager approval in UKG';

    // Animated workflow steps (now with more data)
    const workflowSteps = [
      {
        label: `Checking available personal days (Balance: ${ptoBalanceBefore})`,
        icon: '🔍',
      },
      {
        label: leaveDates ? `Request for ${leaveType} (${leaveDates}) logged in UKG` : `Request logged in UKG`,
        icon: '📝',
      },
      {
        label: 'Manager approval pending',
        icon: '⏳',
      },
      {
        label: 'You will receive email and mobile notifications',
        icon: '📧',
      },
      {
        label: 'Request successfully submitted!',
        icon: '✅',
        success: true,
      },
    ];

    // Animate steps in sequence
    const [visibleSteps, setVisibleSteps] = useState(0);
    useEffect(() => {
      if (visibleSteps < workflowSteps.length && !showForm) {
        const t = setTimeout(() => setVisibleSteps(visibleSteps + 1), 900);
        return () => clearTimeout(t);
      }
    }, [visibleSteps, workflowSteps.length, showForm]);

    // LLM summary (after all steps)
    const submitted = !!demoState.formData.startDate;
    const summary = submitted
      ? `**Summary of your time-off request:**\n\n• **Dates:** ${leaveDates}\n• **Type:** ${leaveType}\n• **PTO Balance Before:** ${ptoBalanceBefore}\n• **PTO Balance After:** ${ptoBalanceAfter}\n• **Status:** ${status}`
      : '';

    if (demoState.showTypingIndicator) {
      return <Box sx={{ mx: 6, my: 1 }}><FancyTypingDots /></Box>;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          mb: 2,
          maxWidth: '100%',
          px: { xs: 1, sm: 2 },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: isDark ? '#66bb6a' : '#00897B',
            fontWeight: 600,
            mb: 0.5,
            ml: 0,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            textAlign: 'left',
          }}
        >
          HR Agent
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            maxWidth: '100%',
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'transparent',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
              border: 'none',
            }}
          >
            HR
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'transparent',
                borderRadius: '20px 20px 20px 8px',
                border: 'none',
                position: 'relative',
                maxWidth: '100%',
                boxShadow: 'none',
                textAlign: 'left',
              }}
            >
              {/* Show form if needed */}
              {showForm && (
                <HRAgentForm
                  formFields={formFields}
                  onSubmit={handleFormSubmit}
                  isSubmitting={demoState.isProcessing}
                />
              )}
              {/* Animated workflow steps */}
              {!showForm && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {workflowSteps.slice(0, visibleSteps).map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        px: 2,
                        py: 1.1,
                        borderRadius: 2,
                        bgcolor: step.success
                          ? (isDark ? 'rgba(56, 142, 60, 0.18)' : 'rgba(56, 142, 60, 0.12)')
                          : (isDark ? 'rgba(76, 175, 80, 0.10)' : 'rgba(0, 137, 123, 0.08)'),
                        color: step.success
                          ? (isDark ? '#A5D6A7' : '#388e3c')
                          : (isDark ? '#fff' : '#222'),
                        fontWeight: step.success ? 700 : 500,
                        fontSize: '1rem',
                        boxShadow: step.success
                          ? '0 2px 12px rgba(56,142,60,0.10)'
                          : '0 2px 8px rgba(0,0,0,0.04)',
                        opacity: 0,
                        transform: 'translateY(10px)',
                        animation: `fadeInStep 0.5s ${idx * 0.2}s forwards`,
                        '@keyframes fadeInStep': {
                          'to': { opacity: 1, transform: 'none' },
                        },
                      }}
                    >
                      <span style={{ fontSize: '1.2em' }}>{step.icon}</span>
                      <span>{step.label}</span>
                    </Box>
                  ))}
                </Box>
              )}
              {/* Enhanced summary card after all steps */}
              {!showForm && visibleSteps >= workflowSteps.length && submitted && (
                <Box sx={{ mt: 2, p: 3, borderRadius: 3, bgcolor: isDark ? '#1a237e' : '#e3f2fd', borderLeft: '6px solid #1976d2', boxShadow: '0 2px 12px rgba(25,118,210,0.08)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1976d2' }}>Time-Off Request Summary</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                    <Typography variant="body2"><b>Dates:</b> {leaveDates}</Typography>
                    <Typography variant="body2"><b>Type:</b> {leaveType}</Typography>
                    <Typography variant="body2"><b>PTO Balance Before:</b> {ptoBalanceBefore}</Typography>
                    <Typography variant="body2"><b>PTO Balance After:</b> {ptoBalanceAfter}</Typography>
                    <Typography variant="body2"><b>Status:</b> {status}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, color: isDark ? '#fff' : '#1976d2', fontWeight: 500 }}>
                    ✅ Your request has been submitted and is pending manager approval.
                  </Typography>
                </Box>
              )}
            </Paper>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
                ml: 2,
                fontSize: 11,
                textAlign: 'left',
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Fallback
  return null;
};
