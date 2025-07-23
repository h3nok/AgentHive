import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Chip, alpha, useTheme, keyframes } from '@mui/material';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Psychology, 
  AutoAwesome, 
  TrendingUp, 
  Lightbulb,
  Speed,
  CheckCircle,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';

interface ThoughtNode {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  type: 'analysis' | 'decision' | 'question' | 'insight' | 'warning' | 'error';
  confidence: number; // 0-1
  timestamp: Date;
  duration: number; // milliseconds the thought was active
  dependencies?: string[]; // other thought IDs this depends on
  metadata?: {
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    reasoning?: string;
  };
}

interface ThoughtStream {
  agentId: string;
  thoughts: ThoughtNode[];
  isActive: boolean;
  streamIntensity: number; // 0-1, how fast thoughts are flowing
  currentFocus?: string; // current thought being processed
}

export interface RealTimeThinkingStreamProps {
  streams: ThoughtStream[];
  width: number;
  height: number;
  onThoughtClick?: (thought: ThoughtNode) => void;
  onStreamClick?: (agentId: string) => void;
  showConfidenceLevels?: boolean;
  maxVisibleThoughts?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  layout: 'vertical' | 'horizontal' | 'radial';
}

// Keyframes for thinking stream animations
const thoughtFlow = keyframes`
  0% { opacity: 0; transform: translateY(20px) scale(0.8); }
  20% { opacity: 1; transform: translateY(0) scale(1); }
  80% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-20px) scale(0.8); }
`;

const streamPulse = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const confidenceGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.3); }
  50% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.6); }
  100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.3); }
`;

const RealTimeThinkingStream: React.FC<RealTimeThinkingStreamProps> = ({
  streams,
  width,
  height,
  onThoughtClick,
  onStreamClick,
  showConfidenceLevels = true,
  maxVisibleThoughts = 5,
  animationSpeed = 'normal',
  layout = 'vertical'
}) => {
  const theme = useTheme();
  const [visibleThoughts, setVisibleThoughts] = useState<Map<string, ThoughtNode[]>>(new Map());
  const [highlightedAgent, setHighlightedAgent] = useState<string | null>(null);

  // Animation duration based on speed
  const animationDuration = {
    slow: 4000,
    normal: 2500,
    fast: 1500
  }[animationSpeed];

  // Manage visible thoughts for each stream
  useEffect(() => {
    const interval = setInterval(() => {
      const newVisibleThoughts = new Map<string, ThoughtNode[]>();
      
      streams.forEach(stream => {
        if (!stream.isActive) return;
        
        const currentTime = Date.now();
        const recentThoughts = stream.thoughts
          .filter(thought => currentTime - thought.timestamp.getTime() < animationDuration)
          .slice(-maxVisibleThoughts)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        newVisibleThoughts.set(stream.agentId, recentThoughts);
      });
      
      setVisibleThoughts(newVisibleThoughts);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [streams, animationDuration, maxVisibleThoughts]);

  // Get thought type icon and color
  const getThoughtTypeConfig = (type: ThoughtNode['type']) => {
    switch (type) {
      case 'analysis':
        return { icon: <TrendingUp />, color: theme.palette.info.main };
      case 'decision':
        return { icon: <CheckCircle />, color: theme.palette.success.main };
      case 'question':
        return { icon: <Psychology />, color: theme.palette.warning.main };
      case 'insight':
        return { icon: <Lightbulb />, color: theme.palette.secondary.main };
      case 'warning':
        return { icon: <Warning />, color: theme.palette.warning.main };
      case 'error':
        return { icon: <ErrorIcon />, color: theme.palette.error.main };
      default:
        return { icon: <AutoAwesome />, color: theme.palette.primary.main };
    }
  };

  // Calculate stream layout positions
  const getStreamPosition = useCallback((streamIndex: number, totalStreams: number) => {
    switch (layout) {
      case 'horizontal':
        return {
          x: (width / totalStreams) * streamIndex + (width / totalStreams / 2),
          y: height / 2,
          direction: 'horizontal'
        };
      case 'radial':
        const angle = (streamIndex / totalStreams) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.3;
        return {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          direction: 'radial'
        };
      default: // vertical
        return {
          x: (width / totalStreams) * streamIndex + (width / totalStreams / 2),
          y: height * 0.8,
          direction: 'vertical'
        };
    }
  }, [layout, width, height]);

  // Thought bubble variants for animations
  const thoughtVariants: Variants = {
    initial: { 
      opacity: 0, 
      scale: 0.5, 
      y: layout === 'vertical' ? 50 : 0,
      x: layout === 'horizontal' ? -50 : 0
    },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: layout === 'vertical' ? -50 : 0,
      x: layout === 'horizontal' ? 50 : 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius: 2,
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha('#0a0a0a', 0.9)}, ${alpha('#1a1a1a', 0.95)})`
          : `linear-gradient(135deg, ${alpha('#f8f9fa', 0.9)}, ${alpha('#ffffff', 0.95)})`,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      {/* Background Thinking Effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(-45deg, 
              ${alpha(theme.palette.primary.main, 0.02)}, 
              ${alpha(theme.palette.secondary.main, 0.02)}, 
              ${alpha(theme.palette.info.main, 0.02)}, 
              ${alpha(theme.palette.success.main, 0.02)}
            )
          `,
          backgroundSize: '400% 400%',
          animation: `${streamPulse} 8s ease infinite`,
        }}
      />

      {/* Thinking Streams */}
      <AnimatePresence>
        {streams.map((stream, streamIndex) => {
          const streamPosition = getStreamPosition(streamIndex, streams.length);
          const streamThoughts = visibleThoughts.get(stream.agentId) || [];
          
          if (!stream.isActive) return null;

          return (
            <Box
              key={stream.agentId}
              sx={{
                position: 'absolute',
                left: streamPosition.x - 100,
                top: streamPosition.y - 200,
                width: 200,
                height: 400,
              }}
            >
              {/* Stream Header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Paper
                  sx={{
                    p: 1,
                    mb: 1,
                    background: alpha(theme.palette.background.paper, 0.9),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transform: highlightedAgent === stream.agentId ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                  onClick={() => {
                    setHighlightedAgent(stream.agentId === highlightedAgent ? null : stream.agentId);
                    onStreamClick?.(stream.agentId);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Psychology 
                        sx={{ 
                          fontSize: 16, 
                          color: theme.palette.primary.main,
                          animation: stream.isActive ? `${thoughtFlow} 2s ease-in-out infinite` : 'none'
                        }} 
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.7rem',
                          color: theme.palette.text.primary 
                        }}
                      >
                        {stream.agentId}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.success.main,
                        animation: stream.streamIntensity > 0.7 
                          ? `${confidenceGlow} 1s ease-in-out infinite` 
                          : 'none',
                      }}
                    />
                  </Box>
                  
                  {/* Stream Intensity Bar */}
                  <Box
                    sx={{
                      mt: 0.5,
                      height: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <motion.div
                      style={{
                        height: '100%',
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 1,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${stream.streamIntensity * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </Box>
                </Paper>
              </motion.div>

              {/* Floating Thoughts */}
              <Box sx={{ position: 'relative', height: '100%' }}>
                <AnimatePresence mode="popLayout">
                  {streamThoughts.map((thought, thoughtIndex) => {
                    const typeConfig = getThoughtTypeConfig(thought.type);
                    const isHighlighted = highlightedAgent === stream.agentId;
                    
                    return (
                      <motion.div
                        key={thought.id}
                        variants={thoughtVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                        style={{
                          position: 'absolute',
                          bottom: thoughtIndex * 80,
                          left: 0,
                          right: 0,
                          zIndex: streamThoughts.length - thoughtIndex,
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1.5,
                            background: alpha(theme.palette.background.paper, 0.95),
                            border: `1px solid ${alpha(typeConfig.color, 0.3)}`,
                            borderLeft: `3px solid ${typeConfig.color}`,
                            borderRadius: 2,
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            opacity: isHighlighted ? 1 : 0.8,
                            transform: isHighlighted ? 'scale(1)' : 'scale(0.95)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              borderColor: typeConfig.color,
                              boxShadow: `0 4px 12px ${alpha(typeConfig.color, 0.2)}`
                            }
                          }}
                          onClick={() => onThoughtClick?.(thought)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 20,
                                height: 20,
                                borderRadius: 1,
                                backgroundColor: alpha(typeConfig.color, 0.1),
                                flexShrink: 0,
                                mt: 0.2
                              }}
                            >
                              {React.cloneElement(typeConfig.icon, { 
                                fontSize: 'small',
                                sx: { fontSize: 12, color: typeConfig.color }
                              })}
                            </Box>
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.75rem',
                                  lineHeight: 1.3,
                                  color: theme.palette.text.primary,
                                  mb: 0.5,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {thought.content}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                  label={thought.type}
                                  size="small"
                                  sx={{
                                    fontSize: '0.6rem',
                                    height: 16,
                                    backgroundColor: alpha(typeConfig.color, 0.1),
                                    color: typeConfig.color,
                                    border: `1px solid ${alpha(typeConfig.color, 0.3)}`,
                                    '& .MuiChip-label': { px: 0.5 }
                                  }}
                                />
                                
                                {showConfidenceLevels && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '0.6rem',
                                      color: theme.palette.text.secondary,
                                      ml: 0.5
                                    }}
                                  >
                                    {Math.round(thought.confidence * 100)}%
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Box>
            </Box>
          );
        })}
      </AnimatePresence>

      {/* Global Thinking Activity Indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Paper
          sx={{
            p: 1.5,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesome sx={{ fontSize: 14, color: theme.palette.primary.main }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
              Collective Intelligence
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${streams.filter(s => s.isActive).length} Active`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
            <Chip 
              label={`${streams.reduce((sum, s) => sum + s.thoughts.length, 0)} Thoughts`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 16 }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RealTimeThinkingStream;
