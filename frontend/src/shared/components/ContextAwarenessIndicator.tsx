import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  Paper,
  Stack,
  Tooltip,
  IconButton,
  Collapse,
  alpha,
  useTheme
} from '@mui/material';
import {
  Memory,
  InsertDriveFile,
  History,
  Psychology,
  Link,
  ExpandMore,
  ExpandLess,
  Lightbulb,
  TrendingUp,
  Timeline
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContextItem {
  id: string;
  type: 'file' | 'conversation' | 'knowledge' | 'memory' | 'reference';
  title: string;
  preview: string;
  relevanceScore: number;
  timestamp: string;
  source?: string;
  metadata?: Record<string, any>;
}

interface ContextAwarenessIndicatorProps {
  contexts: ContextItem[];
  activeContexts: string[];
  knowledgeBaseAccess: boolean;
  memoryUtilization: number; // 0-100
  conversationDepth: number;
  onContextToggle?: (contextId: string) => void;
  onViewContext?: (contextId: string) => void;
  showDetails?: boolean;
}

const ContextAwarenessIndicator: React.FC<ContextAwarenessIndicatorProps> = ({
  contexts,
  activeContexts,
  knowledgeBaseAccess,
  memoryUtilization,
  conversationDepth,
  onContextToggle,
  onViewContext,
  showDetails = false
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hoveredContext, setHoveredContext] = useState<string | null>(null);

  const getContextIcon = (type: ContextItem['type']) => {
    switch (type) {
      case 'file': return InsertDriveFile;
      case 'conversation': return History;
      case 'knowledge': return Psychology;
      case 'memory': return Memory;
      case 'reference': return Link;
      default: return Memory;
    }
  };

  const getContextColor = (relevanceScore: number) => {
    if (relevanceScore >= 0.8) return '#4caf50';
    if (relevanceScore >= 0.6) return '#ff9800';
    return '#f44336';
  };

  const getMemoryUtilizationColor = (utilization: number) => {
    if (utilization < 60) return '#4caf50';
    if (utilization < 85) return '#ff9800';
    return '#f44336';
  };

  const formatConversationDepth = (depth: number) => {
    if (depth < 5) return 'Shallow';
    if (depth < 15) return 'Medium';
    if (depth < 30) return 'Deep';
    return 'Very Deep';
  };

  // Sort contexts by relevance score
  const sortedContexts = [...contexts].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topContexts = sortedContexts.slice(0, 3);
  const additionalContexts = sortedContexts.slice(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          mb: 2
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Memory sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            Context Awareness
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={`Memory Utilization: ${memoryUtilization}%`}>
              <Chip
                icon={<Memory />}
                label={`${memoryUtilization}%`}
                size="small"
                sx={{
                  bgcolor: alpha(getMemoryUtilizationColor(memoryUtilization), 0.1),
                  color: getMemoryUtilizationColor(memoryUtilization),
                  fontSize: '0.7rem'
                }}
              />
            </Tooltip>
            
            <Tooltip title={`Conversation Depth: ${formatConversationDepth(conversationDepth)}`}>
              <Chip
                icon={<Timeline />}
                label={formatConversationDepth(conversationDepth)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Tooltip>

            {showDetails && (
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Stack>
        </Stack>

        {/* Quick Status Indicators */}
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          <Chip
            icon={<Psychology />}
            label={knowledgeBaseAccess ? 'Knowledge Base Active' : 'Limited Knowledge'}
            size="small"
            color={knowledgeBaseAccess ? 'success' : 'warning'}
            sx={{ fontSize: '0.7rem' }}
          />
          
          <Chip
            icon={<TrendingUp />}
            label={`${activeContexts.length} Active Contexts`}
            size="small"
            color={activeContexts.length > 0 ? 'info' : 'default'}
            sx={{ fontSize: '0.7rem' }}
          />
          
          {topContexts.length > 0 && (
            <Chip
              icon={<Lightbulb />}
              label={`${topContexts.length} High Relevance`}
              size="small"
              color="primary"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Stack>

        {/* Top Contexts Preview */}
        {topContexts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Most Relevant Contexts
            </Typography>
            <Stack spacing={1}>
              {topContexts.map((context) => {
                const IconComponent = getContextIcon(context.type);
                const isActive = activeContexts.includes(context.id);
                
                return (
                  <motion.div
                    key={context.id}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setHoveredContext(context.id)}
                    onHoverEnd={() => setHoveredContext(null)}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        border: `1px solid ${isActive ? theme.palette.primary.main : alpha(theme.palette.divider, 0.5)}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          borderColor: theme.palette.primary.main
                        }
                      }}
                      onClick={() => onContextToggle?.(context.id)}
                    >
                      <IconComponent 
                        fontSize="small" 
                        sx={{ 
                          mr: 1, 
                          color: getContextColor(context.relevanceScore) 
                        }} 
                      />
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={500} noWrap>
                          {context.title}
                        </Typography>
                        {hoveredContext === context.id && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ display: 'block', fontSize: '0.6rem' }}
                            noWrap
                          >
                            {context.preview}
                          </Typography>
                        )}
                      </Box>
                      
                      <Chip
                        label={`${Math.round(context.relevanceScore * 100)}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(getContextColor(context.relevanceScore), 0.1),
                          color: getContextColor(context.relevanceScore),
                          fontSize: '0.6rem',
                          height: 20,
                          ml: 1
                        }}
                      />
                    </Box>
                  </motion.div>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box sx={{ pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            {/* Additional Contexts */}
            {additionalContexts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Additional Contexts ({additionalContexts.length})
                </Typography>
                <Stack spacing={0.5}>
                  {additionalContexts.map((context) => {
                    const IconComponent = getContextIcon(context.type);
                    const isActive = activeContexts.includes(context.id);
                    
                    return (
                      <Box
                        key={context.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 0.5,
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                        onClick={() => onContextToggle?.(context.id)}
                      >
                        <IconComponent 
                          fontSize="small" 
                          sx={{ 
                            mr: 1, 
                            color: isActive ? theme.palette.primary.main : 'text.secondary',
                            fontSize: '1rem'
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            flex: 1,
                            color: isActive ? theme.palette.primary.main : 'text.secondary'
                          }}
                          noWrap
                        >
                          {context.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(context.relevanceScore * 100)}%
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Context Metrics */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Context Metrics
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">Memory Utilization</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(getMemoryUtilizationColor(memoryUtilization), 0.2)
                      }}
                    >
                      <motion.div
                        style={{
                          height: '100%',
                          backgroundColor: getMemoryUtilizationColor(memoryUtilization),
                          borderRadius: 2
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${memoryUtilization}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </Box>
                    <Typography variant="caption" fontWeight={500}>
                      {memoryUtilization}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">Conversation Turns</Typography>
                  <Typography variant="caption" fontWeight={500}>
                    {conversationDepth}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption">Total Contexts</Typography>
                  <Typography variant="caption" fontWeight={500}>
                    {contexts.length}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </motion.div>
  );
};

export default ContextAwarenessIndicator;
