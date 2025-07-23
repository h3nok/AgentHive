import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { setRouterAutoRefresh } from '@/shared/store/slices/uiSlice';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Chip,
  Popover,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Tooltip,
  Stack,
  Fade,
  Avatar,
  Badge,
  alpha,
  useTheme,
  Menu,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { useDropzone } from 'react-dropzone';
import { useHotkeys } from 'react-hotkeys-hook';

// Icons
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import HexagonIcon from '@mui/icons-material/Hexagon';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SupportIcon from '@mui/icons-material/Support';
import BusinessIcon from '@mui/icons-material/Business';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// Enterprise utilities
import { getEnterpriseGradient } from '../utils/enterpriseTheme';

// Agent configuration from agentic chat
const AGENTS = {
  general: { name: 'General AI', icon: SmartToyIcon, color: '#6366f1', description: 'General purpose assistant' },
  technical: { name: 'Tech Expert', icon: EngineeringIcon, color: '#10b981', description: 'Engineering & coding help' },
  support: { name: 'Support Agent', icon: SupportIcon, color: '#f59e0b', description: 'Customer support specialist' },
  business: { name: 'Business Analyst', icon: BusinessIcon, color: '#ef4444', description: 'Business strategy & analysis' },
  data: { name: 'Data Scientist', icon: AnalyticsIcon, color: '#8b5cf6', description: 'Data analysis & insights' },
  psychology: { name: 'AI Psychologist', icon: PsychologyIcon, color: '#ec4899', description: 'Human behavior & psychology' }
};

interface EnhancedEnterpriseInputBarProps {
  onSendMessage: (message: string, agent: string) => void;
  isLoading?: boolean;
  onStopRequest?: () => void;
  selectedModel?: string;
  placeholder?: string;
  onFileUpload?: (files: File[]) => void;
  onVoiceInput?: (transcript: string) => void;
  maxTokens?: number;
  autoRouting?: boolean;
  onAutoRoutingChange?: (enabled: boolean) => void;
  selectedAgent?: string;
  onAgentChange?: (agent: string) => void;
  onAgentSelect?: (agent: string) => void;
  showTypingIndicator?: boolean;
  enableTypingIndicator?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  enableAgentRouting?: boolean;
  enableSmartSuggestions?: boolean;
  enableVoiceInput?: boolean;
  /**
   * External value to control the textarea input. When this changes, the component will sync its
   * internal state and move the caret to the end so that the user can immediately continue typing.
   */
  externalValue?: string;
}

// Enhanced slash commands for enterprise
const ENTERPRISE_COMMANDS = [
  { 
    id: 'search', 
    label: 'Search Knowledge', 
    icon: <SearchIcon />, 
    description: 'Search enterprise knowledge base',
    shortcut: '⌘K'
  },
  { 
    id: 'analyze', 
    label: 'Data Analysis', 
    icon: <CodeIcon />, 
    description: 'Analyze data and generate insights',
    shortcut: '⌘A'
  },
  { 
    id: 'summarize', 
    label: 'Smart Summary', 
    icon: <DescriptionIcon />, 
    description: 'Create intelligent summaries',
    shortcut: '⌘S'
  },
  { 
    id: 'workflow', 
    label: 'Workflow Assistant', 
    icon: <FlashOnIcon />, 
    description: 'Generate workflow automation',
    shortcut: '⌘W'
  },
  { 
    id: 'help', 
    label: 'Enterprise Help', 
    icon: <HelpOutlineIcon />, 
    description: 'Get contextual assistance',
    shortcut: '⌘H'
  },
];

// Quick enterprise prompts
const ENTERPRISE_PROMPTS = [
  { 
    id: 'operations', 
    label: 'Operations', 
    prompt: 'Help me optimize operational processes and identify automation opportunities.',
    color: 'primary' as const
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    prompt: 'Analyze this data and provide actionable business insights.',
    color: 'secondary' as const
  },
  { 
    id: 'compliance', 
    label: 'Compliance', 
    prompt: 'Review for compliance requirements and regulatory considerations.',
    color: 'warning' as const
  },
  { 
    id: 'strategy', 
    label: 'Strategy', 
    prompt: 'Provide strategic recommendations and implementation roadmap.',
    color: 'info' as const
  },
];

const EnhancedEnterpriseInputBar: React.FC<EnhancedEnterpriseInputBarProps> = ({
  onSendMessage,
  isLoading = false,
  onStopRequest,
  selectedModel = "Enterprise AI",
  placeholder = "Ask your enterprise assistant...",
  onFileUpload,
  onVoiceInput,
  maxTokens = 8192,
  autoRouting,
  onAutoRoutingChange,
  selectedAgent = 'general',
  onAgentChange,
  onAgentSelect,
  showTypingIndicator = false,
  enableTypingIndicator = true,
  onTypingStart,
  onTypingStop,
  enableAgentRouting = true,
  enableSmartSuggestions = true,
  enableVoiceInput = true,
  externalValue,
}) => {
  const dispatch = useAppDispatch();
  const globalAutoRouting = useAppSelector(state => (state.ui as any)?.routerAutoRefresh ?? false);
  // Determine which autoRouting value to use (prop overrides global)
  const effectiveAutoRouting = autoRouting ?? globalAutoRouting;

  // Handler uses prop callback if provided, otherwise dispatches to Redux
  const handleAutoRoutingChange = useCallback((enabled: boolean) => {
    if (onAutoRoutingChange) {
      onAutoRoutingChange(enabled);
    } else {
      dispatch(setRouterAutoRefresh(enabled));
    }
  }, [onAutoRoutingChange, dispatch]);
  const [inputValue, setInputValue] = useState('');

  // Sync externalValue -> internal state
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== inputValue) {
      setInputValue(externalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [agentMenuAnchor, setAgentMenuAnchor] = useState<HTMLElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Token estimation
  const estimatedTokens = Math.ceil(inputValue.length / 3.5);
  const tokenPercentage = Math.min((estimatedTokens / maxTokens) * 100, 100);
  const isNearLimit = tokenPercentage > 80;

  // Smart agent routing logic
  const determineAgent = useCallback((message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('code') || lower.includes('bug') || lower.includes('technical')) return 'technical';
    if (lower.includes('business') || lower.includes('strategy') || lower.includes('market')) return 'business';
    if (lower.includes('data') || lower.includes('analyze') || lower.includes('chart')) return 'data';
    if (lower.includes('help') || lower.includes('support') || lower.includes('problem')) return 'support';
    if (lower.includes('behavior') || lower.includes('psychology') || lower.includes('emotion')) return 'psychology';
    return 'general';
  }, []);

  // File drop functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachedFiles(prev => [...prev, ...acceptedFiles]);
      onFileUpload?.(acceptedFiles);
    },
    noClick: true,
    accept: {
      'text/*': ['.txt', '.md', '.csv'],
      'application/*': ['.pdf', '.json', '.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.();
    }, 2000);
  }, [isTyping, onTypingStart, onTypingStop]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    handleTypingStart();
  }, [handleTypingStart]);

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      const finalAgent = effectiveAutoRouting ? determineAgent(inputValue.trim()) : (selectedAgent || 'general');
      onSendMessage(inputValue.trim(), finalAgent);
      setInputValue('');
      setAttachedFiles([]);
      
      // Stop typing indicator
      setIsTyping(false);
      onTypingStop?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [inputValue, isLoading, onSendMessage, autoRouting, determineAgent, selectedAgent, onTypingStop]);

  const handleVoiceToggle = useCallback(() => {
    setIsRecording(!isRecording);
    if (!isRecording && onVoiceInput) {
      setTimeout(() => {
        onVoiceInput("Voice input received");
        setIsRecording(false);
      }, 2000);
    }
  }, [isRecording, onVoiceInput]);

  // Enhanced slash commands
  useEffect(() => {
    if (inputValue.startsWith('/') && inputValue.length > 1) {
      setShowCommands(true);
      setAnchorEl(textareaRef.current);
    } else {
      setShowCommands(false);
    }
  }, [inputValue]);

  // Keyboard shortcuts
  useHotkeys('meta+k', () => setInputValue('/search '), { preventDefault: true });
  useHotkeys('meta+enter', handleSend, { enableOnFormTags: true });
  useHotkeys('escape', () => {
    setShowCommands(false);
    setAgentMenuAnchor(null);
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < ENTERPRISE_COMMANDS.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : ENTERPRISE_COMMANDS.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = ENTERPRISE_COMMANDS[selectedCommandIndex];
        setInputValue(`/${command.id} `);
        setShowCommands(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [showCommands, selectedCommandIndex, handleSend]);

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Current agent info
  const currentAgent = AGENTS[selectedAgent as keyof typeof AGENTS] || AGENTS.general;

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box
      {...getRootProps()}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 800,
        mx: 'auto',
        mb: 2,
      }}
    >
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      <AnimatePresence>
        {(isDragActive || isDragOver) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.1)})`,
              border: `2px dashed ${theme.palette.primary.main}`,
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              Drop files to attach
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Selection & Auto-routing Controls */}
      {enableAgentRouting && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* Current Agent Display */}
          <Tooltip title={effectiveAutoRouting ? "Auto-routing enabled - agent will be selected automatically" : "Click to change agent"}>
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: currentAgent.color, width: 24, height: 24 }}>
                  {React.createElement(currentAgent.icon, { fontSize: 'small', sx: { color: 'white' } })}
                </Avatar>
              }
              label={effectiveAutoRouting ? "Auto-Route" : currentAgent.name}
              onClick={!effectiveAutoRouting ? (e) => setAgentMenuAnchor(e.currentTarget) : undefined}
              sx={{
                backgroundColor: alpha(currentAgent.color, 0.1),
                color: currentAgent.color,
                borderColor: alpha(currentAgent.color, 0.3),
                cursor: effectiveAutoRouting ? 'default' : 'pointer',
                '&:hover': !effectiveAutoRouting ? {
                  backgroundColor: alpha(currentAgent.color, 0.2),
                } : {},
              }}
            />
          </Tooltip>

          {/* Auto-routing Toggle */}
          <Tooltip title={effectiveAutoRouting ? "Disable auto-routing to manually select agents" : "Enable auto-routing for smart agent selection"}>
            <Chip
              icon={<AutoModeIcon />}
              label={effectiveAutoRouting ? "Auto" : "Manual"}
              onClick={() => handleAutoRoutingChange(!effectiveAutoRouting)}
              color={effectiveAutoRouting ? "primary" : "default"}
              variant={effectiveAutoRouting ? "filled" : "outlined"}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            />
          </Tooltip>
        </Box>
      )}

      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {/* Typing Indicator */}
        <AnimatePresence>
          {enableTypingIndicator && (isTyping || showTypingIndicator) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Chip
                icon={<CircularProgress size={12} />}
                label="Typing..."
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.main,
                  fontSize: '0.7rem',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Quick Prompts Bar */}
      {enableSmartSuggestions && (
        <Fade in={inputValue.length === 0}>
          <Box sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
              {ENTERPRISE_PROMPTS.map((prompt) => (
                <Chip
                  key={prompt.id}
                  label={prompt.label}
                  size="small"
                  onClick={() => setInputValue(prompt.prompt)}
                  sx={{
                    backgroundColor: alpha(theme.palette[prompt.color].main, 0.1),
                    color: theme.palette[prompt.color].main,
                    borderColor: alpha(theme.palette[prompt.color].main, 0.3),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette[prompt.color].main, 0.2),
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Fade>
      )}

      {/* Attached Files */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {attachedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    size="small"
                    onDelete={() => removeFile(index)}
                    icon={<AttachFileIcon />}
                    sx={{
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 3,
          py: 2,
          borderRadius: 24,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha('#1a1a1a', 0.8)} 0%, ${alpha('#2a2a2a', 0.6)} 100%)`
            : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8f9fa', 0.8)} 100%)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}, 0 2px 8px ${alpha('#000', 0.3)}`
            : `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}, 0 2px 8px ${alpha('#000', 0.05)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}, 0 4px 12px ${alpha('#000', 0.4)}`
              : `0 6px 24px ${alpha(theme.palette.primary.main, 0.12)}, 0 4px 12px ${alpha('#000', 0.08)}`,
            transform: 'translateY(-1px)',
          },
          '&:focus-within': {
            boxShadow: theme.palette.mode === 'dark'
              ? `0 16px 48px ${alpha(theme.palette.primary.main, 0.25)}, 0 0 0 2px ${alpha(theme.palette.primary.main, 0.4)}`
              : `0 8px 28px ${alpha(theme.palette.primary.main, 0.15)}, 0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Hexagon pattern background */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            right: 20,
            transform: 'translateY(-50%)',
            opacity: 0.1,
            color: currentAgent.color,
            pointerEvents: 'none',
          }}
        >
          <HexagonIcon sx={{ fontSize: 40 }} />
        </Box>

        {/* Auto-resize Textarea */}
        <TextareaAutosize
          ref={textareaRef}
          minRows={1}
          maxRows={8}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          style={{
            flex: 1,
            resize: 'none',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            lineHeight: '1.6',
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
            padding: '8px 0',
            fontWeight: 500,
          }}
        />

        {/* Token Counter */}
        {inputValue.length > 0 && (
          <Tooltip title={`${estimatedTokens}/${maxTokens} tokens`}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: alpha(
                  isNearLimit ? theme.palette.warning.main : theme.palette.primary.main, 
                  0.1
                ),
                color: isNearLimit ? theme.palette.warning.main : theme.palette.primary.main,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                {estimatedTokens}
              </Typography>
              <Box
                sx={{
                  width: 24,
                  height: 4,
                  backgroundColor: alpha(theme.palette.divider, 0.3),
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${tokenPercentage}%`,
                    height: '100%',
                    backgroundColor: isNearLimit ? theme.palette.warning.main : theme.palette.primary.main,
                    transition: 'all 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          </Tooltip>
        )}

        {/* Voice Input Button */}
        {enableVoiceInput && (
          <Tooltip title={isRecording ? "Stop recording" : "Voice input"}>
            <IconButton
              onClick={handleVoiceToggle}
              size="small"
              sx={{
                width: 36,
                height: 36,
                backgroundColor: isRecording 
                  ? alpha(theme.palette.error.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.1),
                color: isRecording ? theme.palette.error.main : theme.palette.primary.main,
                border: `1px solid ${alpha(
                  isRecording ? theme.palette.error.main : theme.palette.primary.main, 
                  0.3
                )}`,
                '&:hover': {
                  backgroundColor: isRecording 
                    ? alpha(theme.palette.error.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.05)',
              },
            }}
          >
            {isRecording ? <MicOffIcon sx={{ fontSize: 18 }} /> : <MicIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
        )}

        {/* Attach File Button */}
        <Tooltip title="Attach files">
          <IconButton
            component="label"
            size="small"
            sx={{
              width: 36,
              height: 36,
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              color: theme.palette.secondary.main,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                transform: 'scale(1.05)',
              },
            }}
          >
            <AttachFileIcon sx={{ fontSize: 18 }} />
            <input
              type="file"
              hidden
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachedFiles(prev => [...prev, ...files]);
                onFileUpload?.(files);
              }}
            />
          </IconButton>
        </Tooltip>

        {/* Send Button - Enterprise Style */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <IconButton
            onClick={isLoading ? onStopRequest : handleSend}
            disabled={(!inputValue.trim() && attachedFiles.length === 0) && !isLoading}
            size="medium"
            sx={{
              width: 44,
              height: 44,
              background: isLoading 
                ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                : getEnterpriseGradient('primary', theme),
              color: theme.palette.primary.contrastText,
              border: `1px solid ${alpha(
                isLoading ? theme.palette.error.main : theme.palette.primary.main, 
                0.3
              )}`,
              boxShadow: `0 4px 12px ${alpha(
                isLoading ? theme.palette.error.main : theme.palette.primary.main, 
                0.3
              )}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha(
                  isLoading ? theme.palette.error.main : theme.palette.primary.main, 
                  0.4
                )}`,
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                backgroundColor: alpha(theme.palette.action.disabledBackground, 0.6),
                color: theme.palette.action.disabled,
                boxShadow: 'none',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <StopIcon sx={{ fontSize: 20 }} />
            ) : (
              <SendIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </motion.div>
      </Box>

      {/* Enhanced Slash Commands Palette */}
      <Popover
        open={showCommands}
        anchorEl={anchorEl}
        onClose={() => setShowCommands(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: -1,
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${alpha('#1a1a1a', 0.95)} 0%, ${alpha('#2a2a2a', 0.9)} 100%)`
              : `linear-gradient(135deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f8f9fa', 0.9)} 100%)`,
            backdropFilter: 'blur(20px)',
            borderRadius: 12,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            minWidth: 320,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
          },
        }}
      >
        <List dense sx={{ py: 1 }}>
          {ENTERPRISE_COMMANDS.map((command, index) => (
            <ListItemButton
              key={command.id}
              selected={index === selectedCommandIndex}
              onClick={() => {
                setInputValue(`/${command.id} `);
                setShowCommands(false);
                textareaRef.current?.focus();
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
                {command.icon}
              </ListItemIcon>
              <ListItemText 
                primary={command.label}
                secondary={command.description}
                primaryTypographyProps={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{ 
                  fontSize: '0.75rem',
                  color: theme.palette.text.secondary,
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {command.shortcut}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      </Popover>

      {/* Agent Selection Menu */}
      <Menu
        anchorEl={agentMenuAnchor}
        open={Boolean(agentMenuAnchor)}
        onClose={() => setAgentMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${alpha('#1a1a1a', 0.95)} 0%, ${alpha('#2a2a2a', 0.9)} 100%)`
              : `linear-gradient(135deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f8f9fa', 0.9)} 100%)`,
            backdropFilter: 'blur(20px)',
            borderRadius: 12,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            minWidth: 280,
          },
        }}
      >
        {Object.entries(AGENTS).map(([key, agent]) => (
          <MenuItem
            key={key}
            onClick={() => {
              onAgentChange?.(key);
              onAgentSelect?.(key);
              setAgentMenuAnchor(null);
            }}
            selected={selectedAgent === key}
            sx={{
              mx: 1,
              borderRadius: 2,
              '&.Mui-selected': {
                backgroundColor: alpha(agent.color, 0.15),
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Avatar sx={{ bgcolor: agent.color, width: 32, height: 32 }}>
                {React.createElement(agent.icon, { fontSize: 'small', sx: { color: 'white' } })}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {agent.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {agent.description}
                </Typography>
              </Box>
            </Stack>
          </MenuItem>
        ))}
      </Menu>

      {/* Model Indicator */}
      {false && (
        <Box
          sx={{
            position: 'absolute',
            top: -36,
            right: 0,
          }}
        >
          <Chip
            icon={<SmartToyIcon />}
            label={selectedModel}
            size="small"
            sx={{
              backgroundColor: alpha(currentAgent.color, 0.1),
              color: currentAgent.color,
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              border: `1px solid ${alpha(currentAgent.color, 0.2)}`,
              '& .MuiChip-icon': {
                color: currentAgent.color,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default EnhancedEnterpriseInputBar;
