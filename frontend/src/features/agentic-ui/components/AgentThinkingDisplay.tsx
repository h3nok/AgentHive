/**
 * Agent Thinking Display
 * 
 * Real-time visualization of agent reasoning and decision-making process.
 * Shows the agent's internal thought process, tool selection, and planning.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Avatar,
  Fade,
  Slide,
  CircularProgress,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Psychology,
  Build,
  Search,
  Analytics,
  Lightbulb,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Speed,
  Memory,
  AttachMoney,
  Timeline,
  SmartToy
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { AgentPersona } from '../types';

// Animations
const thinkingPulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const typewriterEffect = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const brainWave = keyframes`
  0%, 100% { transform: translateY(0px); }
  25% { transform: translateY(-3px); }
  50% { transform: translateY(0px); }
  75% { transform: translateY(3px); }
`;

// Styled Components
const ThinkingContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(156, 39, 176, 0.05) 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    animation: `${brainWave} 2s infinite`,
  }
}));

const ThinkingBubble = styled(Box)(({ theme }) => ({
  animation: `${thinkingPulse} 2s infinite`,
  padding: theme.spacing(1.5),
  background: theme.palette.background.default,
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(1),
}));

const TypewriterText = styled(Typography)<{ isTyping?: boolean }>(({ theme, isTyping }) => ({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  borderRight: isTyping ? `2px solid ${theme.palette.primary.main}` : 'none',
  animation: isTyping ? `${typewriterEffect} 2s steps(40, end)` : 'none',
  fontFamily: 'monospace',
}));

const ReasoningStep = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  background: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[2],
  }
}));

interface ThoughtProcess {
  id: string;
  type: 'analysis' | 'planning' | 'tool_selection' | 'execution' | 'synthesis';
  content: string;
  timestamp: Date;
  confidence?: number;
  metadata?: {
    toolsConsidered?: string[];
    selectedTool?: string;
    reasoning?: string;
    cost?: number;
    tokensUsed?: number;
  };
}

interface AgentThinkingDisplayProps {
  agent: AgentPersona;
  isThinking?: boolean;
  currentThought?: string;
  thoughtProcess?: ThoughtProcess[];
  onExpand?: () => void;
  compact?: boolean;
}

const AgentThinkingDisplay: React.FC<AgentThinkingDisplayProps> = ({
  agent,
  isThinking = false,
  currentThought = '',
  thoughtProcess = [],
  onExpand,
  compact = false
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(!compact);
  const [displayedThought, setDisplayedThought] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);

  // Simulate typewriter effect for current thought
  useEffect(() => {
    if (isThinking && currentThought) {
      setDisplayedThought('');
      setTypingIndex(0);
      
      const interval = setInterval(() => {
        setTypingIndex(prev => {
          if (prev < currentThought.length) {
            setDisplayedThought(currentThought.slice(0, prev + 1));
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [currentThought, isThinking]);

  // Mock thought process for demo
  const mockThoughtProcess: ThoughtProcess[] = thoughtProcess.length > 0 ? thoughtProcess : [
    {
      id: 'thought-1',
      type: 'analysis',
      content: 'Analyzing user request for employee onboarding data...',
      timestamp: new Date(Date.now() - 30000),
      confidence: 0.95,
      metadata: { tokensUsed: 45 }
    },
    {
      id: 'thought-2',
      type: 'planning',
      content: 'Planning multi-step approach: 1) Fetch data from UKG, 2) Validate compliance, 3) Generate report',
      timestamp: new Date(Date.now() - 25000),
      confidence: 0.92,
      metadata: { tokensUsed: 67 }
    },
    {
      id: 'thought-3',
      type: 'tool_selection',
      content: 'Selecting UKG Connector for employee data retrieval',
      timestamp: new Date(Date.now() - 20000),
      confidence: 0.98,
      metadata: {
        toolsConsidered: ['UKG Connector', 'Database Query', 'File Reader'],
        selectedTool: 'UKG Connector',
        reasoning: 'UKG Connector provides direct API access with proper authentication',
        cost: 0.02
      }
    },
    {
      id: 'thought-4',
      type: 'execution',
      content: 'Executing UKG API call with proper filters and pagination...',
      timestamp: new Date(Date.now() - 15000),
      confidence: 0.89,
      metadata: { tokensUsed: 23, cost: 0.05 }
    }
  ];

  const getThoughtIcon = (type: ThoughtProcess['type']) => {
    switch (type) {
      case 'analysis':
        return <Analytics color="info" />;
      case 'planning':
        return <Psychology color="primary" />;
      case 'tool_selection':
        return <Build color="warning" />;
      case 'execution':
        return <Speed color="success" />;
      case 'synthesis':
        return <Lightbulb color="secondary" />;
      default:
        return <SmartToy />;
    }
  };

  const getThoughtColor = (type: ThoughtProcess['type']) => {
    switch (type) {
      case 'analysis':
        return 'info';
      case 'planning':
        return 'primary';
      case 'tool_selection':
        return 'warning';
      case 'execution':
        return 'success';
      case 'synthesis':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (!isThinking && mockThoughtProcess.length === 0) {
    return null;
  }

  return (
    <Fade in timeout={300}>
      <ThinkingContainer>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
            {agent.avatar}
          </Avatar>
          
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {agent.name} is thinking...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Framework: {agent.framework} • Type: {agent.type}
            </Typography>
          </Box>

          {!compact && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Stack>

        {/* Current Thought */}
        {isThinking && (
          <ThinkingBubble>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={16} />
              <TypewriterText
                variant="body2"
                isTyping={typingIndex < currentThought.length}
              >
                {displayedThought || currentThought || 'Processing your request...'}
              </TypewriterText>
            </Stack>
          </ThinkingBubble>
        )}

        {/* Thought Process History */}
        <Collapse in={expanded} timeout={300}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>
              REASONING PROCESS
            </Typography>
            
            <Stack spacing={1}>
              {mockThoughtProcess.map((thought, index) => (
                <Slide
                  key={thought.id}
                  direction="up"
                  in
                  timeout={300 + index * 100}
                >
                  <ReasoningStep variant="outlined">
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" alignItems="flex-start" spacing={2}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: `${getThoughtColor(thought.type)}.light` }}>
                          {getThoughtIcon(thought.type)}
                        </Avatar>
                        
                        <Box flex={1}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            <Chip
                              label={thought.type.replace('_', ' ')}
                              size="small"
                              color={getThoughtColor(thought.type) as any}
                              variant="outlined"
                            />
                            
                            {thought.confidence && (
                              <Chip
                                label={`${Math.round(thought.confidence * 100)}% confident`}
                                size="small"
                                variant="outlined"
                                color="default"
                              />
                            )}
                            
                            <Typography variant="caption" color="text.secondary">
                              {thought.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Stack>
                          
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {thought.content}
                          </Typography>

                          {/* Metadata */}
                          {thought.metadata && (
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {thought.metadata.tokensUsed && (
                                <Chip
                                  icon={<Memory />}
                                  label={`${thought.metadata.tokensUsed} tokens`}
                                  size="small"
                                  variant="filled"
                                  color="info"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              
                              {thought.metadata.cost && (
                                <Chip
                                  icon={<AttachMoney />}
                                  label={`$${thought.metadata.cost.toFixed(3)}`}
                                  size="small"
                                  variant="filled"
                                  color="warning"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              
                              {thought.metadata.selectedTool && (
                                <Chip
                                  icon={<Build />}
                                  label={thought.metadata.selectedTool}
                                  size="small"
                                  variant="filled"
                                  color="success"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Stack>
                          )}

                          {/* Tool Selection Details */}
                          {thought.metadata?.toolsConsidered && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                TOOLS CONSIDERED:
                              </Typography>
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                {thought.metadata.toolsConsidered.map((tool) => (
                                  <Chip
                                    key={tool}
                                    label={tool}
                                    size="small"
                                    variant={tool === thought.metadata?.selectedTool ? "filled" : "outlined"}
                                    color={tool === thought.metadata?.selectedTool ? "primary" : "default"}
                                  />
                                ))}
                              </Stack>
                              
                              {thought.metadata.reasoning && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Reasoning: {thought.metadata.reasoning}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </ReasoningStep>
                </Slide>
              ))}
            </Stack>
          </Box>
        </Collapse>

        {/* Progress Indicator */}
        {isThinking && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="indeterminate" 
              sx={{ 
                height: 2, 
                borderRadius: 1,
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }
              }} 
            />
          </Box>
        )}
      </ThinkingContainer>
    </Fade>
  );
};

export default AgentThinkingDisplay;
