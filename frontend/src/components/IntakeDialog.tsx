import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface IntakeDialogProps {
  open: boolean;
  onClose: () => void;
}

interface IntakeFormData {
  name: string;
  orgUnit: string;
  summary: string;
  deadline: string;
  contact: string;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    backgroundColor: theme.palette.mode === 'dark' 
      ? alpha('#000', 0.95)
      : alpha('#fff', 0.95),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    maxWidth: 480,
    width: '100%',
  },
  '& .MuiDialogTitle-root': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    pb: 2,
  },
  '& .MuiDialogContent-root': {
    pt: 3,
  },
}));

const IntakeDialog: React.FC<IntakeDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  
  const [formData, setFormData] = useState<IntakeFormData>({
    name: '',
    orgUnit: '',
    summary: '',
    deadline: '',
    contact: '',
  });

  const handleChange = (field: keyof IntakeFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.orgUnit || !formData.summary || !formData.contact) {
      setToastMessage('Please fill in all required fields');
      setToastSeverity('error');
      setShowToast(true);
      return;
    }

    setLoading(true);
    
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch('/api/intake-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setToastMessage('Agent request submitted successfully! We\'ll be in touch soon.');
        setToastSeverity('success');
        setShowToast(true);
        
        // Reset form and close after success
        setTimeout(() => {
          setFormData({
            name: '',
            orgUnit: '',
            summary: '',
            deadline: '',
            contact: '',
          });
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      setToastMessage('Failed to submit request. Please try again.');
      setToastSeverity('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <>
      <StyledDialog
        open={open}
        onClose={handleClose}
        aria-labelledby="intake-dialog-title"
        aria-describedby="intake-dialog-description"
      >
        <DialogTitle id="intake-dialog-title">
          <Typography variant="subtitle1" fontWeight={600}>
            Request an Agent
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tell us about your automation needs and we'll build a custom agent for your team.
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="Your Name"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange('name')}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#c8102e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c8102e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#c8102e',
                },
              }}
            />
            
            <TextField
              label="Organization Unit"
              fullWidth
              required
              value={formData.orgUnit}
              onChange={handleChange('orgUnit')}
              disabled={loading}
              placeholder="e.g., Store Operations, HR, Supply Chain"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#c8102e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c8102e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#c8102e',
                },
              }}
            />
            
            <TextField
              label="Agent Summary"
              fullWidth
              required
              multiline
              rows={4}
              value={formData.summary}
              onChange={handleChange('summary')}
              disabled={loading}
              placeholder="Describe what tasks you want the agent to help with..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#c8102e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c8102e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#c8102e',
                },
              }}
            />
            
            <TextField
              label="Desired Deadline"
              fullWidth
              type="date"
              value={formData.deadline}
              onChange={handleChange('deadline')}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#c8102e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c8102e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#c8102e',
                },
              }}
            />
            
            <TextField
              label="Contact Email"
              fullWidth
              required
              type="email"
              value={formData.contact}
              onChange={handleChange('contact')}
              disabled={loading}
              placeholder="your.email@tractorsupply.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#c8102e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c8102e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#c8102e',
                },
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              backgroundColor: '#c8102e',
              color: 'white',
              '&:hover': {
                backgroundColor: '#a50d24',
              },
              '&:disabled': {
                backgroundColor: alpha('#c8102e', 0.6),
              },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </StyledDialog>
      
      <Snackbar
        open={showToast}
        autoHideDuration={6000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowToast(false)}
          severity={toastSeverity}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default IntakeDialog; 