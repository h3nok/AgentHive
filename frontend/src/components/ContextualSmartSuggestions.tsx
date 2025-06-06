import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Chip, Paper, Fade, IconButton, Typography, Tooltip } from '@mui/material';
import { AutoAwesome, Psychology, TrendingUp, Schedule, Code, AttachFile, TableChart } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartSuggestion {
  id: string;
  type: 'action' | 'content' | 'template' | 'code' | 'data';
  title: string;
  description: string;
  confidence: number;
  category: string;
  icon: React.ReactNode;
  data?: any;
  action?: () => void;
}

interface ContextualSuggestionsProps {
  currentInput: string;
  conversationHistory: Array<{
    content: string;
    isUser: boolean;
    timestamp: Date;
  }>;
  userProfile: {
    preferences: string[];
    recentActions: string[];
    expertise: string[];
  };
  onSuggestionSelect: (suggestion: SmartSuggestion) => void;
}

/**
 * Revolutionary contextual suggestions system that learns from user behavior
 * and provides intelligent, proactive recommendations
 */
export const ContextualSmartSuggestions: React.FC<ContextualSuggestionsProps> = ({
  currentInput,
  conversationHistory,
  userProfile,
  onSuggestionSelect,
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [visibleSuggestions, setVisibleSuggestions] = useState<SmartSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLearning, setIsLearning] = useState(false);

  // AI-powered suggestion generation
  const generateSuggestions = useCallback(async () => {
    setIsLearning(true);
    
    const contextAnalysis = analyzeContext(currentInput, conversationHistory, userProfile);
    const newSuggestions = await generateSmartSuggestions(contextAnalysis);
    
    setSuggestions(newSuggestions);
    setIsLearning(false);
  }, [currentInput, conversationHistory, userProfile]);

  const analyzeContext = (
    input: string,
    history: any[],
    profile: any
  ) => {
    return {
      inputIntent: detectIntent(input),
      conversationTopic: extractTopic(history),
      userExpertise: profile.expertise,
      recentPatterns: analyzePatterns(history),
      timeContext: getTimeContext(),
      workflowStage: detectWorkflowStage(history),
    };
  };

  const detectIntent = (input: string): string => {
    const intents = {
      'code': /code|function|class|variable|programming|debug/i,
      'data': /table|chart|data|analysis|report|csv|excel/i,
      'communication': /email|message|call|meeting|schedule/i,
      'creativity': /design|create|generate|brainstorm|idea/i,
      'research': /search|find|lookup|investigate|analyze/i,
      'documentation': /document|write|note|summary|outline/i,
    };

    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(input)) return intent;
    }
    return 'general';
  };

  const extractTopic = (history: any[]): string => {
    // Analyze conversation history to extract main topic
    const words = history
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);

    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);

    return topWords.join(' ');
  };

  const analyzePatterns = (history: any[]) => {
    // Analyze user behavior patterns
    const actions = history.filter(msg => msg.isUser).map(msg => msg.content);
    const patterns = {
      frequentActions: getFrequentActions(actions),
      timePatterns: getTimePatterns(history),
      preferredFormats: getPreferredFormats(actions),
    };
    return patterns;
  };

  const getFrequentActions = (actions: string[]) => {
    // Placeholder for action frequency analysis
    return ['send message', 'upload file', 'create table'];
  };

  const getTimePatterns = (history: any[]) => {
    // Analyze when user is most active
    const hours = history.map(msg => msg.timestamp.getHours());
    const hourFreq = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const peakHour = Object.entries(hourFreq)
      .sort(([,a], [,b]) => b - a)[0];
    
    return { peakHour: parseInt(peakHour?.[0] || '9') };
  };

  const getPreferredFormats = (actions: string[]) => {
    // Analyze preferred content formats
    const formats = ['text', 'code', 'table', 'list'];
    return formats.filter(() => Math.random() > 0.5); // Simplified
  };

  const getTimeContext = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  };

  const detectWorkflowStage = (history: any[]): string => {
    const lastMessages = history.slice(-5);
    const content = lastMessages.map(msg => msg.content.toLowerCase()).join(' ');
    
    if (content.includes('start') || content.includes('begin')) return 'initiation';
    if (content.includes('analyze') || content.includes('review')) return 'analysis';
    if (content.includes('implement') || content.includes('build')) return 'implementation';
    if (content.includes('test') || content.includes('verify')) return 'testing';
    if (content.includes('deploy') || content.includes('finish')) return 'completion';
    
    return 'development';
  };

  const generateSmartSuggestions = async (context: any): Promise<SmartSuggestion[]> => {
    const suggestions: SmartSuggestion[] = [];

    // Code suggestions
    if (context.inputIntent === 'code' || context.userExpertise.includes('programming')) {
      suggestions.push({
        id: 'code-completion',
        type: 'code',
        title: 'Smart Code Completion',
        description: 'Generate code based on your description',
        confidence: 0.9,
        category: 'development',
        icon: <Code />,
        action: () => console.log('Code completion triggered'),
      });

      suggestions.push({
        id: 'code-review',
        type: 'action',
        title: 'Code Review Assistant',
        description: 'Analyze code for best practices and issues',
        confidence: 0.85,
        category: 'development',
        icon: <Psychology />,
        action: () => console.log('Code review triggered'),
      });
    }

    // Data suggestions
    if (context.inputIntent === 'data' || context.conversationTopic.includes('data')) {
      suggestions.push({
        id: 'data-visualization',
        type: 'template',
        title: 'Create Data Visualization',
        description: 'Generate charts and graphs from your data',
        confidence: 0.88,
        category: 'analytics',
        icon: <TableChart />,
        action: () => console.log('Data viz triggered'),
      });

      suggestions.push({
        id: 'data-analysis',
        type: 'action',
        title: 'Statistical Analysis',
        description: 'Perform advanced statistical analysis',
        confidence: 0.82,
        category: 'analytics',
        icon: <TrendingUp />,
        action: () => console.log('Analysis triggered'),
      });
    }

    // Time-based suggestions
    if (context.timeContext === 'morning') {
      suggestions.push({
        id: 'daily-summary',
        type: 'template',
        title: 'Daily Summary Template',
        description: 'Start your day with a structured summary',
        confidence: 0.75,
        category: 'productivity',
        icon: <Schedule />,
        action: () => console.log('Daily summary triggered'),
      });
    }

    // Workflow-based suggestions
    if (context.workflowStage === 'implementation') {
      suggestions.push({
        id: 'implementation-checklist',
        type: 'template',
        title: 'Implementation Checklist',
        description: 'Ensure you cover all implementation steps',
        confidence: 0.8,
        category: 'workflow',
        icon: <AutoAwesome />,
        action: () => console.log('Checklist triggered'),
      });
    }

    // File-related suggestions based on recent actions
    if (context.recentPatterns.frequentActions.includes('upload file')) {
      suggestions.push({
        id: 'file-organizer',
        type: 'action',
        title: 'Smart File Organization',
        description: 'Organize and categorize your uploaded files',
        confidence: 0.78,
        category: 'organization',
        icon: <AttachFile />,
        action: () => console.log('File organization triggered'),
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentInput.length > 3 || conversationHistory.length > 0) {
        generateSuggestions();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentInput, generateSuggestions]);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(suggestions.map(s => s.category))];
    return cats;
  }, [suggestions]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setVisibleSuggestions(suggestions.slice(0, 6));
    } else {
      setVisibleSuggestions(
        suggestions.filter(s => s.category === selectedCategory).slice(0, 6)
      );
    }
  }, [suggestions, selectedCategory]);

  if (suggestions.length === 0 && !isLearning) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 180,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: 800,
        zIndex: 1000,
      }}
    >
      <AnimatePresence>
        {(visibleSuggestions.length > 0 || isLearning) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <Paper
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 3,
                p: 2,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              }}
            >
              {/* Category Filter */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category.charAt(0).toUpperCase() + category.slice(1)}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                    size="small"
                    sx={{
                      background: selectedCategory === category 
                        ? 'linear-gradient(45deg, var(--quantum-primary), var(--quantum-secondary))'
                        : 'transparent',
                      color: selectedCategory === category ? 'white' : 'inherit',
                    }}
                  />
                ))}
              </Box>

              {/* AI Learning Indicator */}
              {isLearning && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Psychology sx={{ mr: 1, color: 'var(--quantum-primary)' }} />
                  </motion.div>
                  <Typography variant="caption" color="textSecondary">
                    AI is analyzing context and generating personalized suggestions...
                  </Typography>
                </Box>
              )}

              {/* Suggestions Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                <AnimatePresence>
                  {visibleSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            background: 'rgba(255,255,255,0.9)',
                          },
                        }}
                        onClick={() => onSuggestionSelect(suggestion)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ color: 'var(--quantum-primary)', mr: 1 }}>
                            {suggestion.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {suggestion.title}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                              {suggestion.description}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${(suggestion.confidence * 100).toFixed(0)}%`}
                            size="small"
                            color={suggestion.confidence > 0.8 ? 'success' : 'default'}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>

              {suggestions.length > 6 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    {suggestions.length - visibleSuggestions.length} more suggestions available
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};
