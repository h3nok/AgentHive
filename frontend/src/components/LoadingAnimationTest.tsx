import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  setProcessingStatus, 
  clearProcessingStatus, 
  assistantRequestStarted, 
  assistantResponseFinished,
  addMessage
} from '../features/chat/chatSlice';

const blinkDot = `
  @keyframes blinkDot {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }
`;

const LoadingAnimationTest: React.FC = () => {
  const dispatch = useDispatch();
  const { isLoading, processingStatus, currentAssistantMessageId } = useSelector((state: RootState) => state.chat);
  const [testMessageId] = useState(`test-msg-${Date.now()}`);

  const startLoadingTest = () => {
    // Add a test message
    dispatch(addMessage({
      id: testMessageId,
      text: '',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      temp: true
    }));
    
    // Start loading state
    dispatch(assistantRequestStarted({ assistantMessageId: testMessageId }));
    dispatch(setProcessingStatus('🧪 Testing loading animation...'));
  };

  const stopLoadingTest = () => {
    dispatch(clearProcessingStatus());
    dispatch(assistantResponseFinished());
  };

  const setConnectingStatus = () => {
    dispatch(setProcessingStatus('📡 Connecting to model…'));
  };

  const setThinkingStatus = () => {
    dispatch(setProcessingStatus('🤔 Processing your request...'));
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2, m: 2 }}>
      <style>{blinkDot}</style>
      <Typography variant="h6" gutterBottom>
        Loading Animation Test Panel
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          Current State: isLoading={String(isLoading)}, processingStatus="{processingStatus}", currentAssistantMessageId={currentAssistantMessageId}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={startLoadingTest}>
          Start Loading Test
        </Button>
        <Button variant="outlined" onClick={setConnectingStatus}>
          Set Connecting Status
        </Button>
        <Button variant="outlined" onClick={setThinkingStatus}>
          Set Thinking Status
        </Button>
        <Button variant="contained" color="secondary" onClick={stopLoadingTest}>
          Stop Loading Test
        </Button>
      </Box>

      {/* Test Animation Display */}
      <Box sx={{ border: '1px solid #eee', p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Animation Preview:
        </Typography>
        
        {/* Processing Status Animation */}
        {processingStatus && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={12} thickness={5} />
            <Typography variant="caption">
              {processingStatus}
            </Typography>
          </Box>
        )}
        
        {/* Streaming Dots Animation */}
        {isLoading && !processingStatus && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            {[0, 1, 2].map((dot) => (
              <Box
                key={dot}
                component="span"
                sx={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#1976d2',
                  opacity: 0.7,
                  animation: `blinkDot 1.4s ease-in-out ${dot * 0.2}s infinite`,
                }}
              />
            ))}
          </Box>
        )}
        
        {!isLoading && !processingStatus && (
          <Typography variant="body2" color="text.secondary">
            No loading animation active
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoadingAnimationTest;
