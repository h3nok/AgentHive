import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Chip, 
  useTheme, 
  alpha,
  Typography,
  Popover,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Tooltip,
  Stack,
  Fade,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { useDropzone } from 'react-dropzone';
import { useHotkeys } from 'react-hotkeys-hook';

// Icons
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AddIcon from '@mui/icons-material/Add';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import HexagonIcon from '@mui/icons-material/Hexagon';

// Enterprise utilities
import { getEnterpriseGradient, getEnterpriseButtonStyles } from '../utils/enterpriseTheme';

interface EnterpriseInputBarProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  selectedModel?: string;
  placeholder?: string;
  onFileUpload?: (files: File[]) => void;
  onVoiceInput?: (transcript: string) => void;
  maxTokens?: number;
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

const EnterpriseInputBar: React.FC<EnterpriseInputBarProps> = ({
  onSendMessage,
  isLoading = false,
  selectedModel = "Enterprise AI",
  placeholder = "Ask your enterprise assistant...",
  onFileUpload,
  onVoiceInput,
  maxTokens = 8192,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Token estimation (enterprise-grade calculation)
  const estimatedTokens = Math.ceil(inputValue.length / 3.5); // More accurate estimation
  const tokenPercentage = Math.min((estimatedTokens / maxTokens) * 100, 100);
  const isNearLimit = tokenPercentage > 80;

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

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      setAttachedFiles([]);
    }
  }, [inputValue, isLoading, onSendMessage]);

  const handleVoiceToggle = useCallback(() => {
    setIsRecording(!isRecording);
    // Voice input simulation
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
    setShowPrompts(false);
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

      {/* Quick Prompts Bar */}
      <Fade in={inputValue.length === 0}>
        <Box sx={{ mb: 1.5 }}>
          <Stack 
            direction="row" 
            spacing={1.5} 
            sx={{ 
              overflowX: 'auto', 
              pb: 1,
              pt: 0.5,
              px: 0.5,
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: '10px',
              },
            }}
          >
            {ENTERPRISE_PROMPTS.map((prompt) => (
              <Chip
                key={prompt.id}
                label={prompt.label}
                size="medium"
                onClick={() => setInputValue(prompt.prompt)}
                sx={{
                  height: 'auto',
                  py: 0.8,
                  px: 0.5,
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette[prompt.color].dark, 0.4)}, ${alpha(theme.palette[prompt.color].main, 0.2)})`
                    : `linear-gradient(135deg, ${alpha(theme.palette[prompt.color].light, 0.25)}, ${alpha(theme.palette[prompt.color].main, 0.08)})`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: theme.palette[prompt.color].main,
                  border: `1px solid ${alpha(theme.palette[prompt.color].main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                  boxShadow: `0 2px 8px ${alpha(theme.palette[prompt.color].main, 0.1)}`,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transformStyle: 'preserve-3d',
                  transform: 'perspective(800px) translateZ(0)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${alpha(theme.palette[prompt.color].dark, 0.5)}, ${alpha(theme.palette[prompt.color].main, 0.3)})`
                      : `linear-gradient(135deg, ${alpha(theme.palette[prompt.color].light, 0.35)}, ${alpha(theme.palette[prompt.color].main, 0.15)})`,
                    transform: 'perspective(800px) translateZ(8px) translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette[prompt.color].main, 0.2)}`,
                  },
                  '&:active': {
                    transform: 'perspective(800px) translateZ(4px) translateY(-1px)',
                  },
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha('#fff', 0.2)}, transparent 80%)`,
                    borderRadius: 'inherit',
                    opacity: 0.6,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      </Fade>

      {/* Attached Files */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ px: 0.5 }}>
                {attachedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    size="medium"
                    onDelete={() => removeFile(index)}
                    icon={<AttachFileIcon />}
                    sx={{
                      height: 'auto',
                      py: 0.6,
                      px: 0.5,
                      my: 0.5,
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.dark, 0.4)}, ${alpha(theme.palette.secondary.main, 0.2)})`
                        : `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.25)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      color: theme.palette.secondary.main,
                      border: `1px solid ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.1)}`,
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      transformStyle: 'preserve-3d',
                      transform: 'perspective(800px) translateZ(0)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.dark, 0.5)}, ${alpha(theme.palette.secondary.main, 0.3)})`
                          : `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.35)}, ${alpha(theme.palette.secondary.main, 0.15)})`,
                        transform: 'perspective(800px) translateZ(4px) translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
                      },
                      '& .MuiChip-label': {
                        px: 1,
                      },
                      '& .MuiChip-icon': {
                        color: theme.palette.secondary.main,
                      },
                      '& .MuiChip-deleteIcon': {
                        color: alpha(theme.palette.secondary.main, 0.7),
                        '&:hover': {
                          color: theme.palette.secondary.main,
                        },
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(135deg, ${alpha('#fff', 0.2)}, transparent 80%)`,
                        borderRadius: 'inherit',
                        opacity: 0.5,
                      },
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
            ? `linear-gradient(135deg, ${alpha('#1a1a1a', 0.7)} 0%, ${alpha('#2a2a2a', 0.5)} 100%)`
            : `linear-gradient(135deg, ${alpha('#ffffff', 0.8)} 0%, ${alpha('#f8f9fa', 0.6)} 100%)`,
          backdropFilter: 'blur(45px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(45px) saturate(1.5)',
          boxShadow: theme.palette.mode === 'dark'
            ? `0 12px 36px ${alpha(theme.palette.primary.main, 0.2)}, 
               0 4px 16px ${alpha('#000', 0.4)}, 
               inset 0 0 0 1px ${alpha('#fff', 0.1)}`
            : `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}, 
               0 4px 16px ${alpha('#000', 0.06)}, 
               inset 0 0 0 1px ${alpha('#fff', 0.5)}`,
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? alpha(theme.palette.primary.main, 0.25) 
            : alpha('#fff', 0.8)}`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transformStyle: 'preserve-3d',
          transform: 'perspective(1000px) translateZ(0)',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? `0 16px 48px ${alpha(theme.palette.primary.main, 0.25)}, 
                 0 6px 20px ${alpha('#000', 0.45)},
                 inset 0 0 0 1px ${alpha('#fff', 0.15)}`
              : `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}, 
                 0 6px 20px ${alpha('#000', 0.1)},
                 inset 0 0 0 1px ${alpha('#fff', 0.7)}`,
            transform: 'perspective(1000px) translateZ(4px) translateY(-2px)',
          },
          '&:focus-within': {
            boxShadow: theme.palette.mode === 'dark'
              ? `0 20px 56px ${alpha(theme.palette.primary.main, 0.3)}, 
                 0 0 0 2px ${alpha(theme.palette.primary.main, 0.4)},
                 inset 0 0 0 1px ${alpha('#fff', 0.2)}`
              : `0 16px 48px ${alpha(theme.palette.primary.main, 0.2)}, 
                 0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)},
                 inset 0 0 0 1px ${alpha('#fff', 0.8)}`,
            transform: 'perspective(1000px) translateZ(8px) translateY(-3px)',
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.warning.main, 0.05)})`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover:before': {
            opacity: 1,
          },
          // Edge highlight for glassmorphism
          '&:after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
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
            color: theme.palette.primary.main,
            pointerEvents: 'none',
          }}
        >
          <HexagonIcon sx={{ fontSize: 40 }} />
        </Box>

        {/* Auto-resize Textarea */}
        <Box sx={{ 
          flex: 1, 
          position: 'relative', 
          zIndex: 2,
          '&::before': inputValue.length === 0 && !isFocused ? {
            content: '"' + placeholder + '"',
            position: 'absolute',
            top: '8px',
            left: 0,
            pointerEvents: 'none',
            color: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.text.primary, 0.6)
              : alpha(theme.palette.text.secondary, 0.7),
            backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.warning.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            fontWeight: 500,
            opacity: 0.8,
          } : {}
        }}>
          <TextareaAutosize
            ref={textareaRef}
            minRows={1}
            maxRows={8}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder=""
            disabled={isLoading}
            style={{
              width: '100%',
              resize: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              lineHeight: '1.6',
              color: theme.palette.text.primary,
              fontFamily: theme.typography.fontFamily,
              padding: '8px 0',
              fontWeight: 500,
              position: 'relative',
              zIndex: 2,
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              caretColor: theme.palette.primary.main,
            }}
          />
        </Box>

        {/* Token Counter */}
        {inputValue.length > 0 && (
          <Tooltip title={`${estimatedTokens}/${maxTokens} tokens`}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(isNearLimit ? theme.palette.warning.dark : theme.palette.primary.dark, 0.6)}, ${alpha(isNearLimit ? theme.palette.warning.main : theme.palette.primary.main, 0.3)})`
                  : `linear-gradient(135deg, ${alpha(isNearLimit ? theme.palette.warning.light : theme.palette.primary.light, 0.2)}, ${alpha(isNearLimit ? theme.palette.warning.main : theme.palette.primary.main, 0.1)})`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: `1px solid ${alpha(isNearLimit ? theme.palette.warning.main : theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                boxShadow: `0 2px 8px ${alpha(isNearLimit ? theme.palette.warning.main : theme.palette.primary.main, 0.15)}`,
                color: isNearLimit ? theme.palette.warning.main : theme.palette.primary.main,
                transform: 'translateZ(5px)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateZ(8px) translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(isNearLimit ? theme.palette.warning.main : theme.palette.primary.main, 0.25)}`,
                }
              }}
            >
              <Typography variant="caption" sx={{ 
                fontWeight: 600, 
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                letterSpacing: '0.5px' 
              }}>
                {estimatedTokens}
              </Typography>
              <Box
                sx={{
                  width: 32,
                  height: 5,
                  backgroundColor: alpha(theme.palette.mode === 'dark' ? '#ffffff' : '#000000', 0.1),
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <Box
                  sx={{
                    width: `${tokenPercentage}%`,
                    height: '100%',
                    background: isNearLimit 
                      ? `linear-gradient(90deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`
                      : `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    boxShadow: isNearLimit 
                      ? '0 0 8px rgba(255,152,0,0.5)' 
                      : '0 0 8px rgba(33,150,243,0.3)',
                  }}
                />
              </Box>
            </Box>
          </Tooltip>
        )}

        {/* Voice Input Button */}
        <Tooltip title={isRecording ? "Stop recording" : "Voice input"}>
          <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }}>
            <IconButton
              onClick={handleVoiceToggle}
              size="small"
              sx={{
                width: 40,
                height: 40,
                background: theme.palette.mode === 'dark'
                  ? isRecording
                    ? `linear-gradient(135deg, ${alpha(theme.palette.error.dark, 0.7)}, ${alpha(theme.palette.error.main, 0.4)})`
                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.6)}, ${alpha(theme.palette.primary.main, 0.3)})`
                  : isRecording
                    ? `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.3)}, ${alpha(theme.palette.error.main, 0.15)})`
                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: isRecording ? theme.palette.error.main : theme.palette.primary.main,
                border: `1px solid ${alpha(
                  isRecording ? theme.palette.error.main : theme.palette.primary.main, 
                  theme.palette.mode === 'dark' ? 0.3 : 0.2
                )}`,
                boxShadow: `0 2px 8px ${alpha(
                  isRecording ? theme.palette.error.main : theme.palette.primary.main, 
                  0.15
                )}`,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transform: 'perspective(800px) translateZ(0)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? isRecording
                      ? `linear-gradient(135deg, ${alpha(theme.palette.error.dark, 0.8)}, ${alpha(theme.palette.error.main, 0.5)})`
                      : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.7)}, ${alpha(theme.palette.primary.main, 0.4)})`
                    : isRecording
                      ? `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.4)}, ${alpha(theme.palette.error.main, 0.2)})`
                      : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.3)}, ${alpha(theme.palette.primary.main, 0.15)})`,
                  boxShadow: `0 4px 12px ${alpha(
                    isRecording ? theme.palette.error.main : theme.palette.primary.main, 
                    0.25
                  )}`,
                  transform: 'perspective(800px) translateZ(5px) translateY(-1px)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha('#fff', 0.2)}, transparent 80%)`,
                  opacity: 0.5,
                  zIndex: 0,
                },
              }}
            >
              {isRecording ? (
                <MicOffIcon sx={{ fontSize: 18, position: 'relative', zIndex: 1 }} />
              ) : (
                <MicIcon sx={{ fontSize: 18, position: 'relative', zIndex: 1 }} />
              )}
            </IconButton>
          </motion.div>
        </Tooltip>

        {/* Attach File Button */}
        <Tooltip title="Attach files">
          <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }}>
            <IconButton
              component="label"
              size="small"
              sx={{
                width: 40,
                height: 40,
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.dark, 0.6)}, ${alpha(theme.palette.secondary.main, 0.3)})`
                  : `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.2)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: theme.palette.secondary.main,
                border: `1px solid ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transform: 'perspective(800px) translateZ(0)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.dark, 0.7)}, ${alpha(theme.palette.secondary.main, 0.4)})`
                    : `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.3)}, ${alpha(theme.palette.secondary.main, 0.15)})`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.25)}`,
                  transform: 'perspective(800px) translateZ(5px) translateY(-1px)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha('#fff', 0.2)}, transparent 80%)`,
                  opacity: 0.5,
                  zIndex: 0,
                },
              }}
            >
              <AttachFileIcon sx={{ fontSize: 18, position: 'relative', zIndex: 1 }} />
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
          </motion.div>
        </Tooltip>

        {/* Send Button - Premium Glassmorphic Style */}
        <motion.div
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05, rotate: 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <IconButton
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="medium"
            sx={{
              width: 48,
              height: 48,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.85)} 0%, ${alpha(theme.palette.primary.dark, 0.95)} 100%)`,
              color: '#ffffff',
              border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.4 : 0.6)}`,
              boxShadow: `
                0 6px 16px ${alpha(theme.palette.primary.main, 0.4)},
                0 2px 4px ${alpha(theme.palette.primary.main, 0.3)},
                inset 0 0 0 1px ${alpha('#fff', 0.1)}
              `,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              position: 'relative',
              overflow: 'hidden',
              transformStyle: 'preserve-3d',
              transform: 'perspective(800px) translateZ(0)',
              '&:hover': {
                boxShadow: `
                  0 8px 20px ${alpha(theme.palette.primary.main, 0.5)},
                  0 4px 8px ${alpha(theme.palette.primary.main, 0.4)},
                  inset 0 0 0 1px ${alpha('#fff', 0.2)}
                `,
                transform: 'perspective(800px) translateZ(10px) translateY(-2px)',
              },
              '&:disabled': {
                backgroundColor: alpha(theme.palette.action.disabledBackground, 0.6),
                color: theme.palette.action.disabled,
                boxShadow: 'none',
                transform: 'none',
              },
              '&:active': {
                transform: 'perspective(800px) translateZ(5px) scale(0.95)',
              },
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              // Light effect overlay
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -10,
                left: -10,
                width: 'calc(100% + 20px)',
                height: 'calc(100% + 20px)',
                background: `linear-gradient(135deg, ${alpha('#fff', 0.2)}, transparent 80%)`,
                opacity: 0.5,
                zIndex: 0,
                transition: 'opacity 0.3s ease',
                borderRadius: '50%',
              },
              '&:hover::before': {
                opacity: 0.8,
              },
            }}
          >
            {isLoading ? (
              <CircularProgress 
                size={22} 
                thickness={4}
                sx={{ 
                  color: '#fff',
                  position: 'relative',
                  zIndex: 1
                }} 
              />
            ) : (
              <SendIcon sx={{ fontSize: 20, position: 'relative', zIndex: 1 }} />
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

      {/* Model Indicator */}
      {selectedModel && (
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
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              '& .MuiChip-icon': {
                color: theme.palette.primary.main,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default EnterpriseInputBar;
