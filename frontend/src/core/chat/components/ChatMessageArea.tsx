import React, { useRef, useEffect } from 'react';
import { Box, Typography, Stack, Chip, alpha, useTheme } from '@mui/material';
import { AccountTree } from '@mui/icons-material';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ChatMessage from '../ChatMessage';
import type { Message as ChatMessageType } from '../../../shared/store/slices/entitiesSlice';

interface WorkflowStep {
  agentId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface CurrentWorkflow {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  steps?: WorkflowStep[];
}

export interface ChatMessageAreaProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  currentWorkflow?: CurrentWorkflow;
}

const messageVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      mass: 1,
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  messages,
  isLoading = false,
  currentWorkflow
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          textAlign: 'center',
          py: 8 
        }}>
          <Typography variant="h6" sx={{ mb: 1, opacity: 0.8 }}>
            Welcome to AgentHive
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Start a conversation with our AI agents!
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%' }}>
        <AnimatePresence>
          {messages.map((msg: ChatMessageType, index: number) => (
            <Box
              key={msg.id || `msg-${index}`}
              component={motion.div}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              sx={{ 
                width: '100%', 
                mb: 2,
                '&:last-child': { mb: 0 }
              }}
            >
              <ChatMessage 
                message={msg} 
                isStreaming={isLoading && index === messages.length - 1}
              />
            </Box>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Box>
    );
  };

  return (
    <Box sx={{ 
      flex: 1, 
      overflow: 'auto', 
      display: 'flex', 
      flexDirection: 'column',
      px: 3,
      pt: { xs: 10, sm: 12 }, // Increased padding to properly clear the fixed transparent nav
      pb: 2,
      bgcolor: 'transparent',
    }}>
      <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
        {/* Messages Container */}
        {messages.length > 0 ? (
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
          }}>
            <Box sx={{ p: 0, height: '100%', overflow: 'auto' }}>
              {renderMessages()}
              
              {/* Active Workflow Visualization */}
              {currentWorkflow && (
                <Box sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pt: 2, mt: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <AccountTree sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Active Workflow: {currentWorkflow.name}
                    </Typography>
                    <Chip
                      label={currentWorkflow.status}
                      size="small"
                      color={
                        currentWorkflow.status === 'completed' ? 'success' :
                        currentWorkflow.status === 'error' ? 'error' :
                        currentWorkflow.status === 'processing' ? 'warning' : 'default'
                      }
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {currentWorkflow.steps?.map((step, index) => (
                      <Chip
                        key={index}
                        label={step.agentId}
                        size="small"
                        variant={step.status === 'completed' ? 'filled' : 'outlined'}
                        color={
                          step.status === 'completed' ? 'success' :
                          step.status === 'error' ? 'error' :
                          step.status === 'processing' ? 'warning' : 'default'
                        }
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          renderMessages()
        )}
      </Box>
    </Box>
  );
};

export default ChatMessageArea;
