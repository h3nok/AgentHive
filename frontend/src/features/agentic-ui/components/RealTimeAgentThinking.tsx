/**
 * Real-Time Agent Thinking Display Component
 * 
 * Advanced real-time visualization of agent reasoning, tool selection,
 * and decision-making processes with streaming animations.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Avatar,
  LinearProgress,
  Fade,
  Slide,
  Collapse,
  IconButton,
  Tooltip,
  keyframes,
  styled,
  useTheme
} from '@mui/material';
import {
  Psychology,
  Build,
  Lightbulb,
  Search,
  Analytics,
  Speed,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  Memory
} from '@mui/icons-material';

// Keyframe animations for thinking states
const typewriter = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const brainPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const reasoningFlow = keyframes`
  0% { transform: translateY(10px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(-10px); opacity: 0; }
`;

const confidenceGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.3); }
  50% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.6); }
  100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.3); }
`;

// Styled components
const ThinkingContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}05)`,
  border: `1px solid ${theme.palette.primary.light}40`,
}));

const TypewriterText = styled(Typography)(({ isTyping }: { isTyping: boolean }) => ({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  borderRight: isTyping ? '2px solid' : 'none',
  animation: isTyping ? `${typewriter} 3s steps(40, end)` : 'none',
}));

const BrainIcon = styled(Psychology)(({ isActive }: { isActive: boolean }) => ({
  animation: isActive ? `${brainPulse} 2s ease-in-out infinite` : 'none',
}));

const ReasoningStep = styled(Box)(({ theme, delay }: { theme: any; delay: number }) => ({
  animation: `${reasoningFlow} 4s ease-in-out infinite`,
  animationDelay: `${delay}s`,
}));

const ConfidenceBar = styled(LinearProgress)(({ theme, confidence }: { theme: any; confidence: number }) => ({
  height: 8,
  borderRadius: 4,
  animation: confidence > 0.8 ? `${confidenceGlow} 2s ease-in-out infinite` : 'none',
  '& .MuiLinearProgress-bar': {
    background: confidence > 0.8 
      ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
      : confidence > 0.6
      ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`
      : `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
  },
}));

// Component interfaces
interface AgentThought {
  id: string;
  text: string;
  timestamp: Date;
  confidence: number;
  type: 'reasoning' | 'tool_selection' | 'decision' | 'reflection';
}

interface ToolUsage {
  name: string;
  purpose: string;
  confidence: number;
  status: 'considering' | 'selected' | 'executing' | 'completed';
}

interface AgentMetrics {
  tokensUsed: number;
  cost: number;
  responseTime: number;
  memoryUsage: number;
}

interface RealTimeAgentThinkingProps {
  agentName: string;
  agentAvatar?: string;
  currentThought?: string;
  thoughts: AgentThought[];
  tools: ToolUsage[];
  metrics: AgentMetrics;
  isThinking: boolean;
  confidence: number;
  onExpand?: () => void;
  expanded?: boolean;
}

const RealTimeAgentThinking: React.FC<RealTimeAgentThinkingProps> = ({
  agentName,
  agentAvatar = '🤖',
  currentThought = '',
  thoughts,
  tools,
  metrics,
  isThinking,
  confidence,
  onExpand,
  expanded = false
}) => {
  const theme = useTheme();
  const [typingThought, setTypingThought] = useState('');
  const [showDetails, setShowDetails] = useState(expanded);
  const thoughtRef = useRef<string>('');

  // Simulate typewriter effect for current thought
  useEffect(() => {
    if (currentThought && isThinking) {
      thoughtRef.current = currentThought;
      setTypingThought('');
      
      let index = 0;
      const timer = setInterval(() => {
        if (index < currentThought.length) {
          setTypingThought(currentThought.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
        }
      }, 50);

      return () => clearInterval(timer);
    } else {
      setTypingThought(currentThought);
    }
  }, [currentThought, isThinking]);

  const getToolStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'executing': return 'primary';
      case 'selected': return 'warning';
      default: return 'default';
    }
  };

  const getThoughtIcon = (type: string) => {
    switch (type) {
      case 'reasoning': return <Lightbulb fontSize="small" />;
      case 'tool_selection': return <Build fontSize="small" />;
      case 'decision': return <TrendingUp fontSize="small" />;
      case 'reflection': return <Search fontSize="small" />;
      default: return <Psychology fontSize="small" />;
    }
  };

  return (
    <ThinkingContainer sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Agent Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.light' }}>
              <BrainIcon isActive={isThinking} color="primary" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {agentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isThinking ? 'Thinking...' : 'Ready'}
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={`Confidence: ${Math.round(confidence * 100)}%`}>
              <Chip
                label={`${Math.round(confidence * 100)}%`}
                size="small"
                color={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
                variant="outlined"
              />
            </Tooltip>
            
            {onExpand && (
              <IconButton
                onClick={() => {
                  setShowDetails(!showDetails);
                  onExpand();
                }}
                size="small"
              >
                {showDetails ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Stack>
        </Stack>

        {/* Current Thought */}
        {currentThought && (
          <Fade in={!!currentThought}>
            <Paper sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={1}>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  Current Thought:
                </Typography>
                <TypewriterText
                  variant="body1"
                  isTyping={isThinking}
                  sx={{ minHeight: '1.5em' }}
                >
                  {typingThought}
                </TypewriterText>
              </Stack>
            </Paper>
          </Fade>
        )}

        {/* Confidence Bar */}
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Confidence Level
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(confidence * 100)}%
            </Typography>
          </Stack>
          <ConfidenceBar
            variant="determinate"
            value={confidence * 100}
            confidence={confidence}
          />
        </Box>

        {/* Tools in Use */}
        {tools.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tools & Capabilities:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tools.map((tool, index) => (
                <Slide
                  key={tool.name}
                  in={true}
                  direction="up"
                  timeout={300}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <Chip
                    icon={<Build fontSize="small" />}
                    label={`${tool.name} (${Math.round(tool.confidence * 100)}%)`}
                    size="small"
                    color={getToolStatusColor(tool.status) as any}
                    variant={tool.status === 'executing' ? 'filled' : 'outlined'}
                  />
                </Slide>
              ))}
            </Stack>
          </Box>
        )}

        {/* Detailed View */}
        <Collapse in={showDetails}>
          <Stack spacing={2}>
            {/* Recent Thoughts */}
            {thoughts.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Reasoning History:
                </Typography>
                <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {thoughts.slice(-5).map((thought, index) => (
                    <ReasoningStep
                      key={thought.id}
                      delay={index * 0.2}
                    >
                      <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <Stack direction="row" alignItems="flex-start" spacing={1}>
                          {getThoughtIcon(thought.type)}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2">
                              {thought.text}
                            </Typography>
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {thought.timestamp.toLocaleTimeString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {Math.round(thought.confidence * 100)}% confident
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                      </Paper>
                    </ReasoningStep>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Performance Metrics */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Performance Metrics:
              </Typography>
              <Stack direction="row" spacing={3}>
                <Stack alignItems="center">
                  <Typography variant="h6" color="primary">
                    {metrics.tokensUsed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tokens
                  </Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h6" color="primary">
                    ${metrics.cost.toFixed(4)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cost
                  </Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h6" color="primary">
                    {metrics.responseTime}ms
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Response
                  </Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h6" color="primary">
                    {metrics.memoryUsage}MB
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Memory
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Collapse>
      </Stack>
    </ThinkingContainer>
  );
};

export default RealTimeAgentThinking;
