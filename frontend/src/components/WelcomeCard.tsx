import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  useTheme, 
  alpha,
  keyframes,
  Fade,
  Zoom
} from '@mui/material';
import { motion } from 'framer-motion';
import TractorIcon from './icons/TractorIcon';
import { AutoAwesome, Lightbulb, TrendingUp } from '@mui/icons-material';

interface WelcomeCardProps {
  onPromptClick: (prompt: string) => void;
  onDismiss: () => void;
  visible: boolean;
}

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const suggestedPrompts = [
  {
    text: "What is the lease expiration date for each property?",
    icon: <AutoAwesome />,
    category: "Lease Analysis"
  },
  {
    text: "Show me sales performance for the last quarter",
    icon: <TrendingUp />,
    category: "Business Intelligence" 
  },
  {
    text: "Help me track my recent order status",
    icon: <Lightbulb />,
    category: "Customer Support"
  }
];

const WelcomeCard: React.FC<WelcomeCardProps> = ({ 
  onPromptClick, 
  onDismiss, 
  visible 
}) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Fade in={visible} timeout={800}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 800,
          mx: 'auto',
          mb: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.23, 1, 0.320, 1] // easeOutExpo
          }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.9)} 0%, 
                ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-200px',
                width: '200px',
                height: '100%',
                background: `linear-gradient(90deg, 
                  transparent, 
                  ${alpha(theme.palette.primary.main, 0.1)}, 
                  transparent)`,
                animation: `${shimmer} 3s ease-in-out infinite`,
              },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
              transition: 'all 0.4s cubic-bezier(0.23, 1, 0.320, 1)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  gap: 2,
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, #c8102e)`,
                      animation: `${float} 6s ease-in-out infinite`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TractorIcon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                </motion.div>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="h4" 
                    component="h1"
                    sx={{ 
                      fontWeight: 700,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, #c8102e)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    Welcome to AutoPilot
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                    }}
                  >
                    🚜 TRACTOR SUPPLY COMPANY - INTELLIGENT OPERATIONS PLATFORM
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              <Typography
                variant="body1"
                align="center"
                color="text.secondary"
                sx={{ mb: 4, lineHeight: 1.6 }}
              >
                Your AI-powered assistant for lease management, customer support, and business intelligence.
                Get started with one of these popular queries:
              </Typography>

              {/* Suggested Prompts */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 2,
                  mb: 3,
                }}
              >
                {suggestedPrompts.map((prompt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => onPromptClick(prompt.text)}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        p: 2,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        textAlign: 'center',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box
                        sx={{
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {prompt.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ 
                            fontWeight: 600, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {prompt.category}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ 
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          {prompt.text}
                        </Typography>
                      </Box>
                    </Button>
                  </motion.div>
                ))}
              </Box>

              {/* Footer */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ opacity: 0.7 }}
                >
                  Start typing your question or click a suggestion above
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Fade>
  );
};

export default WelcomeCard; 