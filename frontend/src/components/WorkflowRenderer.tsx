import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Fade,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { motion, AnimatePresence } from 'framer-motion';
import { HRAgentForm } from './UKGDemo/HRAgentForm';
import { workflowService } from '../services/workflowService';

interface WorkflowStep {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  data?: any;
}

interface WorkflowRendererProps {
  steps: WorkflowStep[];
  summary?: {
    message?: string;
    context?: Record<string, any>;
    form_required?: boolean;
    form?: any;
    step_id?: string;
  };
  workflowId?: string;
  session?: Record<string, any>;
  onWorkflowUpdate?: (result: any) => void;
}

const WorkflowRenderer: React.FC<WorkflowRendererProps> = ({ steps, summary, workflowId, session, onWorkflowUpdate }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formSchema, setFormSchema] = useState<any>(null);
  const [formStepId, setFormStepId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [localSummary, setLocalSummary] = useState<any>(summary);

  // Detect if a form step is required
  useEffect(() => {
    if (summary && summary.form_required && summary.form) {
      setShowForm(true);
      setFormSchema(summary.form);
      setFormStepId(summary.step_id);
    } else {
      setShowForm(false);
      setFormSchema(null);
      setFormStepId(null);
    }
    setLocalSummary(summary);
  }, [summary]);

  useEffect(() => {
    if (!showForm && currentStepIndex < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, steps.length, showForm]);

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'running':
        return <CircularProgress size={20} />;
      default:
        return null;
    }
  };

  const handleFormSubmit = async (formData: Record<string, string>) => {
    if (!workflowId || !formStepId || !session) return;
    setFormSubmitting(true);
    setFormError(null);
    try {
      const result = await workflowService.resumeWorkflowForm(workflowId, {
        workflow_id: workflowId,
        step_id: formStepId,
        form_data: formData,
        session,
      });
      setShowForm(false);
      setFormSchema(null);
      setFormStepId(null);
      setLocalSummary(result);
      if (onWorkflowUpdate) onWorkflowUpdate(result);
    } catch (err) {
      setFormError('Failed to submit form. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', my: 2 }}>
      {showForm && formSchema ? (
        <HRAgentForm
          formFields={formSchema.fields}
          onSubmit={handleFormSubmit}
          isSubmitting={formSubmitting}
        />
      ) : (
        <>
          <AnimatePresence>
            {steps.slice(0, currentStepIndex + 1).map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  {getStepIcon(step.status)}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.primary">
                      {step.type}
                    </Typography>
                    {step.message && (
                      <Typography variant="body2" color="text.secondary">
                        {step.message}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={step.status}
                    size="small"
                    color={
                      step.status === 'completed'
                        ? 'success'
                        : step.status === 'error'
                        ? 'error'
                        : 'default'
                    }
                  />
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>

          {localSummary && localSummary.message && currentStepIndex === steps.length && (
            <Fade in timeout={500}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mt: 2,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body1">{localSummary.message}</Typography>
                {localSummary.context &&
                  Object.entries(localSummary.context).map(([key, value]) => (
                    <Box key={key} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="inherit">
                        {key}:
                      </Typography>
                      <Typography variant="body2" color="inherit">
                        {JSON.stringify(value)}
                      </Typography>
                    </Box>
                  ))}
              </Paper>
            </Fade>
          )}
        </>
      )}
      {formError && (
        <Typography color="error" sx={{ mt: 2 }}>{formError}</Typography>
      )}
    </Box>
  );
};

export default WorkflowRenderer; 