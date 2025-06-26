import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  Avatar,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  SmartToy, 
  Psychology, 
  Analytics, 
  Support, 
  AutoMode,
  PlayArrow,
  TrendingUp,
  Business,
  Code,
  Description,
  Lightbulb,
  History
} from '@mui/icons-material';

interface EmptyStateProps {
  message?: string;
  onQuickStart?: (action: string, agent?: string) => void;
  onAgentSelect?: (agent: string) => void;
  recentConversations?: Array<{
    id: string;
    title: string;
    agent: string;
    timestamp: string;
  }>;
}

// Available agents with enhanced capabilities
const AGENTS = [
  {
    id: 'general',
    name: 'General Assistant', 
    icon: SmartToy,
    color: '#667eea',
    description: 'Multi-purpose AI for general queries and creative tasks',
    capabilities: ['Knowledge base', 'Creative thinking', 'Problem solving', 'Research'],
    confidence: 95
  },
  {
    id: 'technical',
    name: 'Technical Expert',
    icon: Code,
    color: '#10b981', 
    description: 'Specialized in coding, engineering, and technical solutions',
    capabilities: ['Code review', 'Architecture design', 'Debugging', 'Documentation'],
    confidence: 92
  },
  {
    id: 'business',
    name: 'Business Analyst',
    icon: Business,
    color: '#f59e0b',
    description: 'Expert in business strategy, analysis, and operations',
    capabilities: ['Strategy planning', 'Data analysis', 'Market research', 'Reporting'],
    confidence: 88
  },
  {
    id: 'support',
    name: 'Support Agent',
    icon: Support,
    color: '#ef4444',
    description: 'Customer service and troubleshooting specialist',
    capabilities: ['Issue resolution', 'User guidance', 'Documentation', 'Training'],
    confidence: 90
  }
];

// Quick start actions
const QUICK_ACTIONS = [
  { label: 'Upload & Analyze Document', action: 'upload_document', icon: Description, agent: 'technical' },
  { label: 'Get Business Insights', action: 'business_analysis', icon: TrendingUp, agent: 'business' },
  { label: 'Code Review & Optimization', action: 'code_review', icon: Code, agent: 'technical' },
  { label: 'Creative Problem Solving', action: 'creative_thinking', icon: Lightbulb, agent: 'general' },
  { label: 'Customer Support Query', action: 'support_request', icon: Support, agent: 'support' },
  { label: 'Data Analysis & Visualization', action: 'data_analysis', icon: Analytics, agent: 'business' }
];

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "Welcome to your AI-powered workspace! Choose an agent or action to get started.",
  onQuickStart,
  onAgentSelect,
  recentConversations = []
}) => {
  const theme = useTheme();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const handleQuickStart = useCallback((action: string, agent?: string) => {
    if (onQuickStart) {
      onQuickStart(action, agent);
    }
  }, [onQuickStart]);

  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgent(agentId);
    if (onAgentSelect) {
      onAgentSelect(agentId);
    }
  }, [onAgentSelect]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
        gap: 4,
        p: 3,
        overflowY: 'auto',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '1200px' }}
      >
        /* Enhanced Header with Improved Visual Hierarchy */
        <Box
          sx={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            mx: 'auto',
            position: 'relative',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c)',
              borderRadius: '26px',
              zIndex: -1,
              opacity: 0.8,
              backgroundSize: '400% 400%',
              animation: 'gradientShift 4s ease infinite',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%)',
              borderRadius: '24px',
              pointerEvents: 'none',
            },
            '@keyframes gradientShift': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            },
          }}
        >
          <Box
            component={motion.div}
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            🤖
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '3px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '2px',
              opacity: 0.6,
            },
          }}
        >
          AI Agent Hub
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 4,
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          {message}
        </Typography>

        {/* AI Agent Showcase */}
        <Typography variant="h6" sx={{ mb: 3, color: theme.palette.text.primary, fontWeight: 500 }}>
          Available AI Agents
        </Typography>

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 2, 
            mb: 4, 
            maxWidth: '800px', 
            mx: 'auto' 
          }}
        >
          {AGENTS.map((agent, index) => {
            const IconComponent = agent.icon;
            return (
              <Box key={agent.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card
                    onClick={() => handleAgentSelect(agent.id)}
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      background: selectedAgent === agent.id 
                        ? `linear-gradient(135deg, ${agent.color}20 0%, ${agent.color}10 100%)`
                        : 'rgba(255,255,255,0.8)',
                      border: selectedAgent === agent.id ? `2px solid ${agent.color}` : '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px rgba(0,0,0,0.15)`,
                        background: `linear-gradient(135deg, ${agent.color}15 0%, ${agent.color}05 100%)`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          bgcolor: agent.color,
                          mb: 1.5,
                          mx: 'auto',
                          width: 48,
                          height: 48
                        }}
                      >
                        <IconComponent />
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {agent.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {agent.description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`${agent.confidence}% Ready`} 
                          size="small" 
                          color={agent.confidence > 90 ? 'success' : 'warning'}
                          sx={{ fontSize: '0.6rem' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            );
          })}
        </Box>

        {/* Quick Actions */}
        <Typography variant="h6" sx={{ mb: 3, color: theme.palette.text.primary, fontWeight: 500 }}>
          Quick Start Actions
        </Typography>

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 2, 
            mb: { xs: 12, md: 8 }, // Extra bottom margin to prevent input overlap
            maxWidth: '900px', 
            mx: 'auto' 
          }}
        >
          {QUICK_ACTIONS.map((action, index) => {
            const IconComponent = action.icon;
            const agent = AGENTS.find(a => a.id === action.agent);
            return (
              <Box key={action.action}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleQuickStart(action.action, action.agent)}
                    startIcon={<IconComponent />}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: 2,
                      textTransform: 'none',
                      justifyContent: 'flex-start',
                      borderColor: agent?.color || theme.palette.divider,
                      color: agent?.color || theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: `${agent?.color || theme.palette.primary.main}10`,
                        borderColor: agent?.color || theme.palette.primary.main,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${agent?.color || theme.palette.primary.main}25`
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {action.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        via {agent?.name}
                      </Typography>
                    </Box>
                  </Button>
                </motion.div>
              </Box>
            );
          })}
        </Box>

        {/* Recent Conversations Preview */}
        {recentConversations.length > 0 && (
          <>
            <Divider sx={{ my: 3, width: '100%', maxWidth: '600px', mx: 'auto' }} />
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 500 }}>
              <History sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Conversations
            </Typography>
            <Stack spacing={1} sx={{ maxWidth: '600px', mx: 'auto' }}>
              {recentConversations.slice(0, 3).map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.6 }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {conversation.title}
                      </Typography>
                      <Chip label={conversation.agent} size="small" color="primary" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {conversation.timestamp}
                    </Typography>
                  </Paper>
                </motion.div>
              ))}
            </Stack>
          </>
        )}

        {/* Agent Status Footer */}
        <Box sx={{ 
          mt: 4, 
          mb: { xs: 10, md: 6 }, // Extra bottom margin for input bar clearance
          p: 2, 
          backgroundColor: 'rgba(102, 126, 234, 0.05)', 
          borderRadius: 2 
        }}>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Chip icon={<AutoMode />} label="Intelligent Routing Active" color="success" size="small" />
            <Chip icon={<SmartToy />} label="4 Agents Online" color="primary" size="small" />
            <Chip icon={<Psychology />} label="Context Awareness Enabled" color="info" size="small" />
          </Stack>
        </Box>
      </motion.div>
    </Box>
  );
};

export default EmptyState; 