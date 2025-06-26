import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { 
  useRecordFeedbackMutation,
  useRecordSatisfactionMutation 
} from '../../../routing/router/routerAnalyticsApi';

interface FeedbackData {
  sessionId: string;
  routingQuality: number;
  responseAccuracy: number;
  contextUnderstanding: number;
  overallSatisfaction: number;
  category: string;
  comments: string;
}

const FeedbackCollector: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    sessionId: '',
    routingQuality: 0,
    responseAccuracy: 0,
    contextUnderstanding: 0,
    overallSatisfaction: 0,
    category: '',
    comments: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const [submitFeedback, { isLoading: isSubmittingFeedback }] = useRecordFeedbackMutation();
  const [recordSatisfaction, { isLoading: isRecordingSatisfaction }] = useRecordSatisfactionMutation();

  // Mock recent feedback statistics
  const feedbackStats = {
    totalFeedback: 1247,
    averageRating: 4.2,
    positivePercentage: 78,
    recentTrends: {
      routingQuality: { current: 4.1, change: +0.3 },
      responseAccuracy: { current: 4.3, change: +0.1 },
      contextUnderstanding: { current: 3.9, change: +0.2 },
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await submitFeedback({
        decision_id: feedback.sessionId || `decision_${Date.now()}`,
        feedback_type: 'user_satisfaction',
        feedback_value: {
          routing_quality: feedback.routingQuality,
          response_accuracy: feedback.responseAccuracy,
          context_understanding: feedback.contextUnderstanding,
          overall_satisfaction: feedback.overallSatisfaction,
          category: feedback.category,
          comments: feedback.comments,
        },
        session_id: feedback.sessionId || `session_${Date.now()}`,
      }).unwrap();

      // Also record satisfaction score
      await recordSatisfaction({
        agent_type: feedback.category || 'general',
        satisfaction_score: feedback.overallSatisfaction,
        session_id: feedback.sessionId || `session_${Date.now()}`,
        comment: feedback.comments,
      }).unwrap();

      setSuccessMessage('Thank you for your feedback! It helps us improve the router performance.');
      
      // Reset form
      setFeedback({
        sessionId: '',
        routingQuality: 0,
        responseAccuracy: 0,
        contextUnderstanding: 0,
        overallSatisfaction: 0,
        category: '',
        comments: '',
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const isFormValid = feedback.overallSatisfaction > 0 && feedback.category;

  return (
    <Box>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '1fr 2fr' 
        }, 
        gap: 3 
      }}>
        {/* Feedback Statistics */}
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Feedback Overview
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Feedback Received
                </Typography>
                <Typography variant="h4">
                  {feedbackStats.totalFeedback.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={feedbackStats.averageRating} readOnly precision={0.1} />
                  <Typography variant="h6">
                    {feedbackStats.averageRating}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Positive Feedback
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={feedbackStats.positivePercentage} 
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {feedbackStats.positivePercentage}%
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Recent Trends
              </Typography>
              {Object.entries(feedbackStats.recentTrends).map(([key, trend]) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {trend.current}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${trend.change > 0 ? '+' : ''}${trend.change}`}
                      color={trend.change > 0 ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>

        {/* Feedback Form */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submit Router Feedback
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: '1fr 1fr' 
                }, 
                gap: 2 
              }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Session ID (Optional)"
                    value={feedback.sessionId}
                    onChange={(e) => setFeedback({ ...feedback, sessionId: e.target.value })}
                    placeholder="Leave empty for anonymous feedback"
                    size="small"
                  />
                </Box>

                <Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Feedback Category *</InputLabel>
                    <Select
                      value={feedback.category}
                      label="Feedback Category *"
                      onChange={(e) => setFeedback({ ...feedback, category: e.target.value })}
                    >
                      <MenuItem value="routing_accuracy">Routing Accuracy</MenuItem>
                      <MenuItem value="response_quality">Response Quality</MenuItem>
                      <MenuItem value="context_understanding">Context Understanding</MenuItem>
                      <MenuItem value="performance">Performance</MenuItem>
                      <MenuItem value="user_experience">User Experience</MenuItem>
                      <MenuItem value="feature_request">Feature Request</MenuItem>
                      <MenuItem value="bug_report">Bug Report</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
                    Routing Quality
                  </Typography>
                  <Rating
                    value={feedback.routingQuality}
                    onChange={(event: React.SyntheticEvent, value: number | null) => setFeedback({ ...feedback, routingQuality: value || 0 })}
                  />
                </Box>

                <Box>
                  <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
                    Response Accuracy
                  </Typography>
                  <Rating
                    value={feedback.responseAccuracy}
                    onChange={(event: React.SyntheticEvent, value: number | null) => setFeedback({ ...feedback, responseAccuracy: value || 0 })}
                  />
                </Box>

                <Box>
                  <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
                    Context Understanding
                  </Typography>
                  <Rating
                    value={feedback.contextUnderstanding}
                    onChange={(event: React.SyntheticEvent, value: number | null) => setFeedback({ ...feedback, contextUnderstanding: value || 0 })}
                  />
                </Box>

                <Box>
                  <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
                    Overall Satisfaction *
                  </Typography>
                  <Rating
                    value={feedback.overallSatisfaction}
                    onChange={(event: React.SyntheticEvent, value: number | null) => setFeedback({ ...feedback, overallSatisfaction: value || 0 })}
                  />
                </Box>

              </Box>

              {/* Comments section - full width */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Comments"
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                  placeholder="Share your thoughts on router performance, accuracy, or suggestions for improvement..."
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmitFeedback}
                  disabled={!isFormValid || isSubmittingFeedback || isRecordingSatisfaction}
                >
                  {isSubmittingFeedback || isRecordingSatisfaction ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default FeedbackCollector;
