// Enhanced Agent Input with Predictive UI Integration
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  Chip,
  Fade,
  alpha
} from '@mui/material';
import { Send as SendIcon, Psychology as AIIcon } from '@mui/icons-material';
import { useEnterpriseFeatures } from '../hooks/useEnterpriseFeatures';
import { usePredictiveUI } from '../hooks/usePredictiveUI';

interface EnhancedAgentInputProps {
  onSendMessage: (text: string, agent: string) => void;
  isLoading: boolean;
  activeAgent: string;
  predictiveUI?: boolean;
}

const EnhancedAgentInput: React.FC<EnhancedAgentInputProps> = ({
  onSendMessage,
  isLoading,
  activeAgent,
}) => {
  const { features } = useEnterpriseFeatures();
  const [message, setMessage] = useState('');
  const [showPredictions, setShowPredictions] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);

  const { 
    suggestedActions,
    preloadedComponents,
    intentScore,
    nextLikelyInteraction,
    analyzeUserIntent,
    recordInteraction
  } = usePredictiveUI();

  // Update AI context as user types
  useEffect(() => {
    if (features.predictiveUI && message) {
      const timeoutId = setTimeout(() => {
        analyzeUserIntent(message, {
          currentInput: message,
          inputLength: message.length,
          typingPattern: Date.now(),
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [message, features.predictiveUI, analyzeUserIntent]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim(), activeAgent);
      setMessage('');
      setShowPredictions(false);
    }
  }, [message, isLoading, onSendMessage, activeAgent]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Tab' && suggestedActions.length > 0) {
      e.preventDefault();
      setMessage(suggestedActions[0]);
    }
  }, [handleSubmit, suggestedActions]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setMessage(suggestion);
    setShowPredictions(false);
    textFieldRef.current?.focus();
  }, []);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Predictive Suggestions */}
      {features.predictiveUI && showPredictions && suggestedActions.length > 0 && (
        <Fade in timeout={300}>
          <Box sx={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            mb: 1,
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 1,
              color: '#667eea'
            }}>
              <AIIcon sx={{ fontSize: 16 }} />
              <Box sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                AI Suggestions (Confidence: {Math.round(intentScore * 100)}%)
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {suggestedActions.slice(0, 3).map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  size="small"
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    bgcolor: alpha('#667eea', 0.1),
                    color: '#667eea',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    '&:hover': {
                      bgcolor: alpha('#667eea', 0.2),
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
            
            {/* Intent Prediction */}
            {nextLikelyInteraction && (
              <Box sx={{ 
                mt: 1, 
                pt: 1, 
                borderTop: '1px solid rgba(102, 126, 234, 0.1)',
                fontSize: '0.7rem',
                color: 'text.secondary'
              }}>
                💡 Predicted intent: {nextLikelyInteraction}
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Enhanced Input Field */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          position: 'relative',
          ...(features.quantumEnhancement && {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              opacity: message ? 0.3 : 0.1,
              transition: 'opacity 0.3s ease',
              zIndex: -1,
            }
          })
        }}
      >
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => features.predictiveUI && setShowPredictions(true)}
          onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
          placeholder={
            features.predictiveUI && nextLikelyInteraction 
              ? `AI suggests: ${nextLikelyInteraction}...`
              : `Message ${activeAgent} agent...`
          }
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Predictive UI Indicator */}
                  {features.predictiveUI && intentScore > 0.7 && (
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#4CAF50',
                      animation: 'pulse 2s infinite',
                    }} />
                  )}
                  
                  {/* Send Button */}
                  <Box
                    component="button"
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    sx={{
                      border: 'none',
                      background: 'transparent',
                      cursor: message.trim() && !isLoading ? 'pointer' : 'default',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      color: message.trim() && !isLoading ? 'primary.main' : 'text.disabled',
                      transition: 'all 0.2s ease',
                      '&:hover:not(:disabled)': {
                        bgcolor: alpha('#667eea', 0.1),
                        transform: 'scale(1.1)',
                      },
                      ...(features.quantumEnhancement && message.trim() && {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        boxShadow: '0 2px 10px rgba(102, 126, 234, 0.3)',
                        '&:hover:not(:disabled)': {
                          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                          transform: 'scale(1.1)',
                        }
                      })
                    }}
                  >
                    <SendIcon sx={{ fontSize: 20 }} />
                  </Box>
                </Box>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              ...(features.quantumEnhancement && {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                '&:hover': {
                  border: '1px solid rgba(102, 126, 234, 0.4)',
                },
                '&.Mui-focused': {
                  border: '1px solid #667eea',
                  boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                }
              })
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: features.quantumEnhancement ? 'none' : undefined,
              },
            },
            '& .MuiInputBase-input': {
              ...(features.quantumEnhancement && {
                '&::placeholder': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  opacity: 0.7,
                }
              })
            }
          }}
        />
      </Box>

      {/* Context Enhancement Indicators - Coming Soon */}
    </Box>
  );
};

export default EnhancedAgentInput;
