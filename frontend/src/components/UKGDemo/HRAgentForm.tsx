import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Send as SendIcon, Event as EventIcon } from '@mui/icons-material';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'time' | 'location';
  options?: string[];
  required?: boolean;
}

interface HRAgentFormProps {
  formFields: FormField[];
  onSubmit: (formData: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export const HRAgentForm: React.FC<HRAgentFormProps> = ({
  formFields,
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    formFields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id].trim() === '')) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    // Additional validation for date fields
    const startDate = formData.startDate;
    const endDate = formData.endDate;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
      
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    } else {
      setFormError('Please complete the highlighted fields');
    }
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.id];
    const errorMessage = errors[field.id];

    switch (field.type) {
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={field.label}
              value={formData[field.id] ? new Date(formData[field.id]) : null}
              onChange={(date) => {
                if (date) {
                  handleFieldChange(field.id, date.toISOString().split('T')[0]);
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: field.required,
                  error: hasError,
                  helperText: errorMessage,
                  variant: 'outlined'
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'select':
        return (
          <FormControl fullWidth variant="outlined" error={hasError}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              label={field.label}
              required={field.required}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {hasError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errorMessage}
              </Typography>
            )}
          </FormControl>
        );

      case 'text':
      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            error={hasError}
            helperText={errorMessage}
            variant="outlined"
            multiline={field.id === 'reason'}
            rows={field.id === 'reason' ? 3 : 1}
          />
        );
    }
  };

  const calculateDays = () => {
    const startDate = formData.startDate;
    const endDate = formData.endDate;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      return diffDays;
    }
    
    return 0;
  };

  const totalDays = calculateDays();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mt: 2,
        mb: 2,
        borderRadius: 3,
        bgcolor: 'transparent',
        border: 'none',
        maxWidth: 500
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <EventIcon sx={{ color: '#C60C30' }} />
        <Typography variant="h6" sx={{ color: '#C60C30', fontWeight: 600 }}>
          Time-Off Request Form
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {formFields.map((field) => (
            <Box key={field.id}>
              {renderField(field)}
            </Box>
          ))}

          {/* Days calculation */}
          {totalDays > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total days requested:
                </Typography>
                <Chip
                  label={`${totalDays} day${totalDays > 1 ? 's' : ''}`}
                  size="small"
                  sx={{
                    bgcolor: '#C60C30',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            disabled={isSubmitting}
            sx={{
              mt: 2,
              bgcolor: '#C60C30',
              color: 'white',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#A60A26'
              },
              '&:disabled': {
                bgcolor: 'rgba(198, 12, 48, 0.3)'
              }
            }}
          >
            {isSubmitting ? 'Submitting Request...' : 'Submit Time-Off Request'}
          </Button>
        </Box>
      </form>

      {/* Footer note */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'block',
          mt: 2,
          textAlign: 'center',
          fontStyle: 'italic'
        }}
      >
        Your manager will receive this request for approval
      </Typography>

      {/* Validation error snackbar */}
      <Snackbar
        open={!!formError}
        autoHideDuration={3000}
        onClose={() => setFormError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      </Snackbar>
    </Paper>
  );
};