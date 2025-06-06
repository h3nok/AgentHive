import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Stack,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import WelcomeCard from '../components/WelcomeCard';
import ChatInput from '../components/ChatInput';
import TractorIcon from '../components/icons/TractorIcon';

const UIDemo: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<string[]>([]);
  const theme = useTheme();

  const handleSendMessage = (message: string) => {
    setMessages(prev => [...prev, message]);
    if (showWelcome) {
      setShowWelcome(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pt: 4,
        pb: 8,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={6}>
          {/* Header Demo */}
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              📱 Header Component
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Header with TractorIcon logo and live status pill
            </Typography>
            <Header />
          </Paper>

          {/* Status Badge Demo */}
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              🟢 Status Badge Component
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Live status indicators with ping animation
            </Typography>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Online
                </Typography>
                <StatusBadge status="online" size="small" />
              </Box>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Online with Label
                </Typography>
                <StatusBadge status="online" size="medium" showLabel />
              </Box>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Connecting
                </Typography>
                <StatusBadge status="connecting" size="medium" showLabel />
              </Box>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Offline
                </Typography>
                <StatusBadge status="offline" size="medium" showLabel />
              </Box>
            </Stack>
          </Paper>

          {/* TractorIcon Demo */}
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              🚜 TractorIcon Component
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Custom SVG tractor icon in different sizes
            </Typography>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box textAlign="center">
                <TractorIcon sx={{ fontSize: 16, color: '#c8102e' }} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Small (16px)
                </Typography>
              </Box>
              <Box textAlign="center">
                <TractorIcon sx={{ fontSize: 24, color: '#c8102e' }} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Medium (24px)
                </Typography>
              </Box>
              <Box textAlign="center">
                <TractorIcon sx={{ fontSize: 32, color: '#c8102e' }} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Large (32px)
                </Typography>
              </Box>
              <Box textAlign="center">
                <TractorIcon sx={{ fontSize: 48, color: '#c8102e' }} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  XL (48px)
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* WelcomeCard Demo */}
          {showWelcome && (
            <Box>
              <Typography variant="h5" gutterBottom sx={{ px: 2 }}>
                🎉 WelcomeCard Component
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
                Interactive welcome card with suggested prompts (click a prompt to dismiss)
              </Typography>
              <WelcomeCard
                visible={showWelcome}
                onPromptClick={handlePromptClick}
                onDismiss={() => setShowWelcome(false)}
              />
            </Box>
          )}

          {/* ChatInput Demo */}
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              💬 ChatInput Component
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enhanced chat input with glassmorphism, model chip, and animated send button
            </Typography>
            <Box sx={{ px: 2 }}>
              <ChatInput
                onSendMessage={handleSendMessage}
                selectedModel="GPT-4"
                placeholder="Type your message here..."
              />
            </Box>
          </Paper>

          {/* Messages Display */}
          {messages.length > 0 && (
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography variant="h5" gutterBottom>
                📝 Messages Sent
              </Typography>
              <Stack spacing={2}>
                {messages.map((message, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <Typography variant="body2">{message}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Global Styles Info */}
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h5" gutterBottom>
              🎨 Global Styles Applied
            </Typography>
            <Stack spacing={2}>
              <Typography variant="body2">
                ✅ Diagonal grain SVG background overlay
              </Typography>
              <Typography variant="body2">
                ✅ Dark mode support with bg-neutral-900 and text-neutral-200
              </Typography>
              <Typography variant="body2">
                ✅ Motion-safe preference guards
              </Typography>
              <Typography variant="body2">
                ✅ Custom scrollbar styling
              </Typography>
              <Typography variant="body2">
                ✅ Tailwind-like utility classes
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default UIDemo; 