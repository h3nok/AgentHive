import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { QuantumMessageContainer } from './QuantumMessageContainer';
import { AdvancedVoiceInterface } from './AdvancedVoiceInterface';
import { ContextualSmartSuggestions } from './ContextualSmartSuggestions';
import { EnterpriseMonitor } from './EnterpriseMonitor';
import { Chat3DEnvironment } from './Chat3DEnvironment';
import { usePredictiveUI } from '../hooks/usePredictiveUI';
import MarkdownRenderer from './markdown/MarkdownRenderer';
import { preprocessMarkdown } from '../utils/preprocessMarkdown';

// Import your existing quantum CSS enhancements
import '../css/quantumEnhancements.css';

interface EnhancedChatInterfaceProps {
  messages: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    importance?: number;
    sentiment?: number;
    complexity?: number;
  }>;
  currentInput: string;
  onInputChange: (input: string) => void;
  onSendMessage: (message: string) => void;
  userProfile: {
    preferences: string[];
    recentActions: string[];
    expertise: string[];
  };
  enableAdvancedFeatures?: boolean;
  enable3DMode?: boolean;
}

/**
 * Revolutionary enterprise chat interface that integrates all cutting-edge features
 */
export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  messages,
  currentInput,
  onInputChange,
  onSendMessage,
  userProfile,
  enableAdvancedFeatures = true,
  enable3DMode = false,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [contextualData, setContextualData] = useState({
    sentiment: 0,
    importance: 0,
    complexity: 0,
  });

  // Initialize predictive UI system
  const {
    suggestedActions,
    analyzeUserIntent,
    recordInteraction,
    intentScore,
    nextLikelyInteraction,
  } = usePredictiveUI();

  // Analyze message characteristics for quantum visualization
  const analyzeMessageCharacteristics = useCallback((content: string) => {
    // Sentiment analysis (simplified - in production, use proper NLP)
    const sentiment = analyzeSentiment(content);
    
    // Importance detection
    const importance = calculateImportance(content);
    
    // Complexity assessment
    const complexity = assessComplexity(content);

    return { sentiment, importance, complexity };
  }, []);

  const analyzeSentiment = (content: string): number => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'frustrating'];
    
    const words = content.toLowerCase().split(/\W+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / words.length * 10));
  };

  const calculateImportance = (content: string): number => {
    const importantKeywords = ['urgent', 'important', 'critical', 'emergency', 'asap', 'priority'];
    const words = content.toLowerCase().split(/\W+/);
    
    let importance = 0;
    words.forEach(word => {
      if (importantKeywords.includes(word)) importance += 0.3;
    });
    
    // Factor in length, caps, exclamation marks
    if (content.length > 200) importance += 0.2;
    if (content.includes('!')) importance += 0.1;
    if (content === content.toUpperCase() && content.length > 10) importance += 0.3;
    
    return Math.min(1, importance);
  };

  const assessComplexity = (content: string): number => {
    let complexity = 0;
    
    // Technical terms
    const technicalPatterns = [
      /\b(function|class|variable|algorithm|database|API|JSON|XML|HTTP|SQL)\b/gi,
      /\b(implementation|architecture|optimization|configuration|deployment)\b/gi,
      /\b(framework|library|dependency|component|interface|protocol)\b/gi,
    ];
    
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length * 0.1;
    });
    
    // Code blocks
    if (content.includes('```') || content.includes('`')) complexity += 0.3;
    
    // Multiple sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    complexity += sentences.length * 0.05;
    
    // Long words
    const words = content.split(/\W+/);
    const longWords = words.filter(word => word.length > 8);
    complexity += longWords.length * 0.02;
    
    return Math.min(1, complexity);
  };

  // Handle input changes with predictive analysis
  const handleInputChange = useCallback((value: string) => {
    onInputChange(value);
    
    if (enableAdvancedFeatures) {
      // Analyze user intent and update context
      analyzeUserIntent(value, { messages, userProfile });
      
      // Update contextual data for quantum visualization
      const characteristics = analyzeMessageCharacteristics(value);
      setContextualData(characteristics);
    }
  }, [onInputChange, enableAdvancedFeatures, analyzeUserIntent, analyzeMessageCharacteristics, messages, userProfile]);

  // Handle message sending with interaction recording
  const handleSendMessage = useCallback((message: string) => {
    if (enableAdvancedFeatures) {
      recordInteraction('send_message');
    }
    onSendMessage(message);
  }, [onSendMessage, enableAdvancedFeatures, recordInteraction]);

  // Handle smart suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: any) => {
    console.log('Selected suggestion:', suggestion);
    
    if (enableAdvancedFeatures) {
      recordInteraction(`suggestion_${suggestion.type}`);
    }
    
    // Execute suggestion action
    if (suggestion.action) {
      suggestion.action();
    }
  }, [enableAdvancedFeatures, recordInteraction]);

  // Enhanced message rendering with quantum effects
  const renderMessage = (message: any, index: number) => {
    const characteristics = analyzeMessageCharacteristics(message.content);
    
    return (
      <Box
        key={message.id}
        className={`quantum-message-container ${message.isUser ? 'user' : 'assistant'}`}
        data-sentiment={characteristics.sentiment > 0.3 ? 'positive' : characteristics.sentiment < -0.3 ? 'negative' : 'neutral'}
        data-importance={characteristics.importance > 0.7 ? 'high' : characteristics.importance > 0.4 ? 'medium' : 'low'}
        data-complexity={characteristics.complexity > 0.7 ? 'high' : characteristics.complexity > 0.4 ? 'medium' : 'low'}
        onClick={() => setSelectedMessage(message.id)}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        }}
      >
        {enableAdvancedFeatures ? (
          <QuantumMessageContainer
            message={message.content}
            isStreaming={false}
            sentiment={characteristics.sentiment}
            complexity={characteristics.complexity}
            importance={characteristics.importance}
          >
            {message.isUser ? (
              <div className="message-text">{message.content}</div>
            ) : (
              <MarkdownRenderer markdown={preprocessMarkdown(message.content)} />
            )}
            <div className="timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </QuantumMessageContainer>
        ) : (
          <Box>
            {message.isUser ? (
              <div className="message-text">{message.content}</div>
            ) : (
              <MarkdownRenderer markdown={preprocessMarkdown(message.content)} />
            )}
            <div className="timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </Box>
        )}
      </Box>
    );
  };

  if (enable3DMode) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Chat3DEnvironment
          messages={messages.map(msg => ({
            ...msg,
            importance: analyzeMessageCharacteristics(msg.content).importance,
          }))}
          onMessageClick={setSelectedMessage}
        />
        
        {enableAdvancedFeatures && (
          <>
            <AdvancedVoiceInterface />
            <EnterpriseMonitor />
          </>
        )}
      </Box>
    );
  }

  return (
    <Box
      className="enhanced-chat-interface"
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Neural Network Background */}
      {enableAdvancedFeatures && (
        <div className="neural-network-bg">
          {/* Neural nodes and connections would be dynamically generated here */}
        </div>
      )}

      {/* Enhanced Message List */}
      <Box
        className="quantum-scroll-container"
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: 2,
          paddingBottom: 200, // Space for input and suggestions
        }}
      >
        {messages.map((message, index) => renderMessage(message, index))}
      </Box>

      {/* Advanced Voice Interface */}
      {enableAdvancedFeatures && <AdvancedVoiceInterface />}

      {/* Contextual Smart Suggestions */}
      {enableAdvancedFeatures && (
        <ContextualSmartSuggestions
          currentInput={currentInput}
          conversationHistory={messages}
          userProfile={userProfile}
          onSuggestionSelect={handleSuggestionSelect}
        />
      )}

      {/* Enterprise Performance Monitor */}
      {enableAdvancedFeatures && <EnterpriseMonitor />}

      {/* Predictive UI Indicators */}
      {enableAdvancedFeatures && intentScore > 0.7 && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            background: 'rgba(0, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            p: 1,
            fontSize: '0.8rem',
            color: 'var(--quantum-primary)',
          }}
        >
          🧠 AI Prediction: {nextLikelyInteraction} ({(intentScore * 100).toFixed(0)}% confidence)
        </Box>
      )}

      {/* Input Enhancement Overlay */}
      {enableAdvancedFeatures && currentInput && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            p: 1,
            fontSize: '0.7rem',
            display: 'flex',
            gap: 1,
          }}
        >
          <span>Sentiment: {(contextualData.sentiment * 100).toFixed(0)}%</span>
          <span>Importance: {(contextualData.importance * 100).toFixed(0)}%</span>
          <span>Complexity: {(contextualData.complexity * 100).toFixed(0)}%</span>
        </Box>
      )}
    </Box>
  );
};
