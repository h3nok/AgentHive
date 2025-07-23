import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, alpha, useTheme, keyframes } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Psychology, AutoAwesome, Speed, TrendingUp } from '@mui/icons-material';

interface AgentConsciousnessData {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'processing' | 'responding' | 'error';
  confidence: number; // 0-1
  currentTask?: string;
  thinkingStream?: string[];
  specialization: string;
  workload: number; // 0-1
  connections?: string[]; // Connected agent IDs
  position?: { x: number; y: number }; // Spatial positioning
}

export interface AgentConsciousnessOrbProps {
  agent: AgentConsciousnessData;
  onClick?: (agent: AgentConsciousnessData) => void;
  onHover?: (agent: AgentConsciousnessData | null) => void;
  showThinkingStream?: boolean;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

// Keyframe animations for consciousness effects
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 193, 7, 0.6), 0 0 60px rgba(255, 193, 7, 0.3); }
  100% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.3); }
`;

const thinkingPulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const consciousnessFlow = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  33% { transform: rotate(120deg) scale(1.1); }
  66% { transform: rotate(240deg) scale(0.9); }
  100% { transform: rotate(360deg) scale(1); }
`;

const AgentConsciousnessOrb: React.FC<AgentConsciousnessOrbProps> = ({
  agent,
  onClick,
  onHover,
  showThinkingStream = false,
  size = 'medium',
  interactive = true
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [currentThought, setCurrentThought] = useState(0);

  // Cycle through thinking stream
  useEffect(() => {
    if (agent.thinkingStream && agent.thinkingStream.length > 0 && agent.status === 'thinking') {
      const interval = setInterval(() => {
        setCurrentThought(prev => (prev + 1) % agent.thinkingStream!.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [agent.thinkingStream, agent.status]);

  // Size configurations
  const sizeConfig = {
    small: { width: 60, height: 60, fontSize: 20 },
    medium: { width: 80, height: 80, fontSize: 24 },
    large: { width: 120, height: 120, fontSize: 32 }
  };

  // Status color mapping
  const getStatusColor = () => {
    switch (agent.status) {
      case 'thinking': return theme.palette.warning.main;
      case 'processing': return theme.palette.info.main;
      case 'responding': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.grey[400];
    }
  };

  // Confidence-based opacity and glow intensity
  const confidenceOpacity = 0.4 + (agent.confidence * 0.6);
  const glowIntensity = agent.confidence;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      whileHover={interactive ? { scale: 1.1 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          position: 'relative',
          width: sizeConfig[size].width,
          height: sizeConfig[size].height,
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => interactive && onClick?.(agent)}
        onMouseEnter={() => {
          if (interactive) {
            setIsHovered(true);
            onHover?.(agent);
          }
        }}
        onMouseLeave={() => {
          if (interactive) {
            setIsHovered(false);
            onHover?.(null);
          }
        }}
      >
        {/* Main Consciousness Orb */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, 
              ${alpha(getStatusColor(), 0.8)}, 
              ${alpha(getStatusColor(), 0.4)}, 
              ${alpha(getStatusColor(), 0.1)}
            )`,
            border: `2px solid ${alpha(getStatusColor(), 0.6)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            opacity: confidenceOpacity,
            // Dynamic animations based on status
            animation: agent.status === 'thinking' 
              ? `${thinkingPulse} 1.5s ease-in-out infinite`
              : agent.status === 'processing'
              ? `${consciousnessFlow} 3s linear infinite`
              : agent.status === 'responding'
              ? `${pulseGlow} 2s ease-in-out infinite`
              : 'none',
            // Enhanced glow effect
            boxShadow: agent.status !== 'idle' 
              ? `0 0 ${20 * glowIntensity}px ${alpha(getStatusColor(), glowIntensity * 0.6)},
                 0 0 ${40 * glowIntensity}px ${alpha(getStatusColor(), glowIntensity * 0.3)},
                 inset 0 0 ${10 * glowIntensity}px ${alpha(getStatusColor(), glowIntensity * 0.2)}`
              : `0 4px 12px ${alpha(getStatusColor(), 0.2)}`,
            transition: 'all 0.3s ease',
            // Hover enhancement
            ...(isHovered && {
              transform: 'scale(1.05)',
              boxShadow: `0 0 ${30 * glowIntensity}px ${alpha(getStatusColor(), glowIntensity * 0.8)},
                         0 0 ${60 * glowIntensity}px ${alpha(getStatusColor(), glowIntensity * 0.4)}`
            })
          }}
        >
          {/* Agent Icon */}
          <Psychology 
            sx={{ 
              fontSize: sizeConfig[size].fontSize, 
              color: '#fff',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }} 
          />

          {/* Consciousness Activity Rings */}
          {agent.status !== 'idle' && (
            <>
              {/* Inner activity ring */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '120%',
                  height: '120%',
                  borderRadius: '50%',
                  border: `1px solid ${alpha(getStatusColor(), 0.4)}`,
                  animation: `${consciousnessFlow} 4s linear infinite reverse`,
                }}
              />
              {/* Outer activity ring */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '140%',
                  height: '140%',
                  borderRadius: '50%',
                  border: `1px solid ${alpha(getStatusColor(), 0.2)}`,
                  animation: `${consciousnessFlow} 6s linear infinite`,
                }}
              />
            </>
          )}
        </Box>

        {/* Agent Name & Status */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            minWidth: 100,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: theme.palette.text.primary,
              textShadow: `0 1px 2px ${alpha('#000', 0.3)}`,
              display: 'block',
              mb: 0.5
            }}
          >
            {agent.name}
          </Typography>
          <Chip
            label={agent.status}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 16,
              backgroundColor: alpha(getStatusColor(), 0.1),
              color: getStatusColor(),
              border: `1px solid ${alpha(getStatusColor(), 0.3)}`,
              '& .MuiChip-label': { px: 0.5 }
            }}
          />
        </Box>

        {/* Confidence Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `linear-gradient(45deg, 
              ${alpha(theme.palette.success.main, agent.confidence)}, 
              ${alpha(theme.palette.warning.main, 1 - agent.confidence)}
            )`,
            border: `1px solid ${alpha('#fff', 0.8)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.5rem',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: `0 1px 1px ${alpha('#000', 0.5)}`
            }}
          >
            {Math.round(agent.confidence * 100)}
          </Typography>
        </Box>

        {/* Real-time Thinking Stream */}
        <AnimatePresence>
          {showThinkingStream && agent.status === 'thinking' && agent.thinkingStream && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'absolute',
                bottom: -60,
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: 200,
                maxWidth: 300,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.background.paper, 0.95)}, 
                    ${alpha(theme.palette.background.paper, 0.85)}
                  )`,
                  border: `1px solid ${alpha(getStatusColor(), 0.3)}`,
                  boxShadow: `0 4px 12px ${alpha('#000', 0.15)}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AutoAwesome sx={{ fontSize: 12, mr: 0.5, color: getStatusColor() }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: getStatusColor(),
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Thinking
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.75rem',
                    color: theme.palette.text.primary,
                    fontStyle: 'italic',
                    minHeight: 20,
                  }}
                >
                  {agent.thinkingStream[currentThought]}
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
};

export default AgentConsciousnessOrb;
