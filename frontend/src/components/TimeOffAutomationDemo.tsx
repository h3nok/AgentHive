import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  AccessTime,
  CalendarToday,
  CheckCircle,
  Person,
  Description,
  Send,
  SmartToy,
  AutoAwesome,
  Schedule,
  Policy,
  Notifications,
  PlayArrow,
  Pause,
  ThumbUp,
  ThumbDown,
  Info
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface TimeOffRequest {
  startDate: Date | null;
  endDate: Date | null;
  type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity';
  reason: string;
  emergency: boolean;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  agent: string;
  estimatedTime: string;
  progress: number;
  details?: string;
}

const TimeOffAutomationDemo: React.FC = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [request, setRequest] = useState<TimeOffRequest>({
    startDate: null,
    endDate: null,
    type: 'vacation',
    reason: '',
    emergency: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowStarted, setWorkflowStarted] = useState(false);

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'validation',
      name: 'Request Validation',
      description: 'AI validates request details and checks for conflicts',
      status: workflowStarted ? 'completed' : 'pending',
      agent: 'Policy Agent',
      estimatedTime: '30 seconds',
      progress: workflowStarted ? 100 : 0,
      details: workflowStarted ? 'Request validated successfully. No policy violations detected.' : undefined
    },
    {
      id: 'calendar-check',
      name: 'Calendar Analysis',
      description: 'Checking team calendar and coverage requirements',
      status: workflowStarted ? 'in-progress' : 'pending',
      agent: 'Calendar Agent',
      estimatedTime: '1 minute',
      progress: workflowStarted ? 65 : 0,
      details: workflowStarted ? 'Analyzing team availability and critical meetings...' : undefined
    },
    {
      id: 'coverage-plan',
      name: 'Coverage Planning',
      description: 'Creating coverage plan and notifying team members',
      status: 'pending',
      agent: 'HR Agent',
      estimatedTime: '2 minutes',
      progress: 0
    },
    {
      id: 'manager-approval',
      name: 'Manager Approval',
      description: 'Routing to manager for approval with AI-generated summary',
      status: 'pending',
      agent: 'Notification Agent',
      estimatedTime: 'Variable',
      progress: 0
    },
    {
      id: 'system-update',
      name: 'System Updates',
      description: 'Updating all relevant systems and calendars',
      status: 'pending',
      agent: 'Integration Agent',
      estimatedTime: '30 seconds',
      progress: 0
    }
  ];

  const handleInputChange = useCallback((field: keyof TimeOffRequest, value: any) => {
    setRequest(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!request.startDate || !request.endDate || !request.reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    setWorkflowStarted(true);

    // Simulate workflow execution
    setTimeout(() => {
      setActiveStep(1);
      setIsSubmitting(false);
    }, 1000);

    // Simulate step progression
    setTimeout(() => setActiveStep(2), 3000);
    setTimeout(() => setActiveStep(3), 5000);
  }, [request]);

  const getStepIcon = (step: WorkflowStep) => {
    if (step.status === 'completed') return <CheckCircle sx={{ color: theme.palette.success.main }} />;
    if (step.status === 'in-progress') return <AutoAwesome sx={{ color: theme.palette.primary.main }} />;
    if (step.status === 'failed') return <ThumbDown sx={{ color: theme.palette.error.main }} />;
    return <Schedule sx={{ color: theme.palette.text.disabled }} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'in-progress': return theme.palette.primary.main;
      case 'failed': return theme.palette.error.main;
      default: return theme.palette.text.disabled;
    }
  };

  const calculateTotalDays = () => {
    if (!request.startDate || !request.endDate) return 0;
    const diffTime = Math.abs(request.endDate.getTime() - request.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Typography variant="body1" color="text.secondary">
            Intelligent workflow automation for seamless time off management
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
            {/* Request Form */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Avatar 
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main
                      }}
                    >
                      <AccessTime />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        New Time Off Request
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Submit your request and let AI handle the rest
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={3}>
                    {/* Date Selection */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <DatePicker
                        label="Start Date"
                        value={request.startDate}
                        onChange={(date) => handleInputChange('startDate', date)}
                        disabled={workflowStarted}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined'
                          }
                        }}
                      />
                      <DatePicker
                        label="End Date"
                        value={request.endDate}
                        onChange={(date) => handleInputChange('endDate', date)}
                        disabled={workflowStarted}
                        minDate={request.startDate || undefined}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined'
                          }
                        }}
                      />
                    </Stack>

                    {/* Request Type */}
                    <FormControl fullWidth disabled={workflowStarted}>
                      <InputLabel>Type of Leave</InputLabel>
                      <Select
                        value={request.type}
                        label="Type of Leave"
                        onChange={(e) => handleInputChange('type', e.target.value)}
                      >
                        <MenuItem value="vacation">Vacation</MenuItem>
                        <MenuItem value="sick">Sick Leave</MenuItem>
                        <MenuItem value="personal">Personal Time</MenuItem>
                        <MenuItem value="maternity">Maternity Leave</MenuItem>
                        <MenuItem value="paternity">Paternity Leave</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Reason */}
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Reason (Optional)"
                      value={request.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      disabled={workflowStarted}
                      placeholder="Provide additional context for your request..."
                    />

                    {/* Request Summary */}
                    {request.startDate && request.endDate && (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                          <strong>Request Summary:</strong> {calculateTotalDays()} day(s) of {request.type} leave
                          from {request.startDate.toLocaleDateString()} to {request.endDate.toLocaleDateString()}
                        </Typography>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={isSubmitting ? <AutoAwesome /> : <Send />}
                      onClick={handleSubmit}
                      disabled={!request.startDate || !request.endDate || isSubmitting || workflowStarted}
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      }}
                    >
                      {isSubmitting ? 'Starting Workflow...' : 'Submit Request'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* AI Insights */}
              {workflowStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main
                          }}
                        >
                          <SmartToy />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          AI Insights & Recommendations
                        </Typography>
                      </Stack>

                      <Stack spacing={2}>
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                          <Typography variant="body2">
                            ✓ No conflicts detected with critical project deadlines
                          </Typography>
                        </Alert>
                        
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          <Typography variant="body2">
                            💡 Suggested coverage: Sarah Johnson available for client meetings
                          </Typography>
                        </Alert>
                        
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          <Typography variant="body2">
                            ⚠️ Team capacity will be at 75% during requested period
                          </Typography>
                        </Alert>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </Box>

            {/* Workflow Progress */}
            <Box sx={{ flex: { xs: 1, lg: '0 0 400px' } }}>
              <Card sx={{ borderRadius: 2, height: 'fit-content' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Workflow Progress
                  </Typography>

                  <Stepper orientation="vertical" activeStep={activeStep}>
                    {workflowSteps.map((step, index) => (
                      <Step key={step.id}>
                        <StepLabel 
                          icon={getStepIcon(step)}
                          sx={{
                            '& .MuiStepLabel-label': {
                              fontWeight: 600,
                              color: step.status === 'completed' ? theme.palette.success.main : 'inherit'
                            }
                          }}
                        >
                          {step.name}
                        </StepLabel>
                        <StepContent>
                          <Box sx={{ pb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {step.description}
                            </Typography>
                            
                            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                              <Avatar sx={{ width: 24, height: 24 }}>
                                <SmartToy sx={{ fontSize: 14 }} />
                              </Avatar>
                              <Typography variant="caption" color="text.secondary">
                                {step.agent}
                              </Typography>
                              <Chip 
                                label={step.estimatedTime}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Stack>

                            {step.progress > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography variant="caption" color="text.secondary">
                                    Progress
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {step.progress}%
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={step.progress}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: alpha(getStatusColor(step.status), 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      backgroundColor: getStatusColor(step.status)
                                    }
                                  }}
                                />
                              </Box>
                            )}

                            {step.details && (
                              <Typography variant="body2" sx={{ 
                                fontStyle: 'italic',
                                color: theme.palette.text.secondary,
                                bgcolor: alpha(theme.palette.background.default, 0.5),
                                p: 1,
                                borderRadius: 1,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                              }}>
                                {step.details}
                              </Typography>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>

                  {workflowStarted && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Estimated completion: 4-6 minutes
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default TimeOffAutomationDemo;
