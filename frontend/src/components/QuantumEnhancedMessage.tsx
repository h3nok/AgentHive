// Enhanced Message Wrapper with Quantum Effects
import React, { useEffect, useState, useRef } from 'react';
import { Box, alpha } from '@mui/material';
import { useEnterpriseFeatures } from '../hooks/useEnterpriseFeatures';

interface QuantumEnhancedMessageProps {
  children: React.ReactNode;
  message?: {
    id?: string;
    text: string;
    sender: 'user' | 'agent' | 'assistant' | 'system';
    timestamp: string;
  };
  isStreaming?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  importance?: 'high' | 'medium' | 'low';
}

const QuantumEnhancedMessage: React.FC<QuantumEnhancedMessageProps> = ({
  children,
  message,
  isStreaming = false,
  sentiment = 'neutral',
  importance = 'medium'
}) => {
  const { features } = useEnterpriseFeatures();
  const [quantumIntensity, setQuantumIntensity] = useState(0);
  const [neuralActivity, setNeuralActivity] = useState(0);
  const messageRef = useRef<HTMLDivElement>(null);

  // Enhanced quantum field calculations
  useEffect(() => {
    if (!features.quantumEnhancement) return;

    const interval = setInterval(() => {
      // Dynamic quantum field based on message properties
      const baseIntensity = isStreaming ? 0.8 : 0.3;
      const sentimentBoost = sentiment === 'positive' ? 0.2 : sentiment === 'negative' ? 0.1 : 0;
      const importanceBoost = importance === 'high' ? 0.3 : importance === 'medium' ? 0.1 : 0;
      
      const newIntensity = baseIntensity + sentimentBoost + importanceBoost + (Math.random() * 0.2);
      setQuantumIntensity(Math.min(newIntensity, 1));
      
      // Neural activity pattern
      setNeuralActivity(Math.sin(Date.now() * 0.003) * 0.5 + 0.5);
    }, 100);

    return () => clearInterval(interval);
  }, [features.quantumEnhancement, isStreaming, sentiment, importance]);

  // Sentiment-based color mapping
  const getSentimentColors = () => {
    switch (sentiment) {
      case 'positive':
        return {
          primary: '#4CAF50',
          secondary: '#81C784',
          glow: 'rgba(76, 175, 80, 0.3)'
        };
      case 'negative':
        return {
          primary: '#f44336',
          secondary: '#e57373',
          glow: 'rgba(244, 67, 54, 0.3)'
        };
      default:
        return {
          primary: '#667eea',
          secondary: '#764ba2',
          glow: 'rgba(102, 126, 234, 0.3)'
        };
    }
  };

  const colors = getSentimentColors();

  if (!features.quantumEnhancement) {
    return <>{children}</>;
  }

  return (
    <Box
      ref={messageRef}
      sx={{
        position: 'relative',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          background: `radial-gradient(circle at ${50 + Math.sin(Date.now() * 0.002) * 20}% ${50 + Math.cos(Date.now() * 0.003) * 20}%, ${colors.glow} 0%, transparent 70%)`,
          opacity: quantumIntensity * 0.6,
          borderRadius: 3,
          animation: isStreaming ? 'quantumFieldPulse 2s ease-in-out infinite' : 'none',
          pointerEvents: 'none',
          zIndex: -1,
        },
        '&::after': importance === 'high' ? {
          content: '""',
          position: 'absolute',
          top: -5,
          left: -5,
          right: -5,
          bottom: -5,
          background: `linear-gradient(45deg, ${colors.primary}40, ${colors.secondary}40)`,
          borderRadius: 2,
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: -1,
          animation: 'importanceGlow 3s ease-in-out infinite',
        } : {},
        // Neural network visualization for streaming messages
        ...(isStreaming && {
          '&': {
            '&::before': {
              background: `
                radial-gradient(circle at 20% 30%, ${colors.primary}30 2px, transparent 2px),
                radial-gradient(circle at 80% 70%, ${colors.secondary}30 2px, transparent 2px),
                radial-gradient(circle at 60% 20%, ${colors.primary}20 1px, transparent 1px),
                radial-gradient(circle at 40% 80%, ${colors.secondary}20 1px, transparent 1px),
                linear-gradient(135deg, ${colors.glow} 0%, transparent 100%)
              `,
              backgroundSize: '100px 100px, 100px 100px, 50px 50px, 50px 50px, 100% 100%',
              animation: 'neuralNetworkPulse 2s ease-in-out infinite, quantumFieldShift 4s ease-in-out infinite',
            }
          }
        }),
        // Enhanced morphing borders for important messages
        ...(importance === 'high' && {
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(colors.primary, 0.05)} 0%, ${alpha(colors.secondary, 0.05)} 100%)`,
          border: `1px solid ${alpha(colors.primary, 0.2)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(colors.primary, 0.4),
            boxShadow: `0 4px 20px ${colors.glow}`,
            transform: 'translateY(-2px)',
          }
        }),
        // Consciousness expansion effect for AI responses
        ...(message?.sender === 'agent' && {
          '&': {
            animation: 'consciousnessExpansion 6s ease-in-out infinite',
            '&::before': {
              background: `
                conic-gradient(from 0deg at 50% 50%, 
                  ${colors.primary}20 0deg, 
                  ${colors.secondary}20 120deg, 
                  ${colors.primary}10 240deg, 
                  ${colors.primary}20 360deg),
                radial-gradient(circle at 50% 50%, ${colors.glow} 0%, transparent 60%)
              `,
              animation: 'holoGraphicShift 4s ease-in-out infinite, quantumFieldPulse 3s ease-in-out infinite',
            }
          }
        }),
      }}
      // Data attributes for CSS targeting
      data-sender={message?.sender}
      data-sentiment={sentiment}
      data-importance={importance}
      data-streaming={isStreaming}
      data-quantum-enhanced="true"
    >
      {children}
    </Box>
  );
};

export default QuantumEnhancedMessage;
