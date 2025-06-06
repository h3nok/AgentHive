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
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { useDropzone } from 'react-dropzone';
import { useHotkeys } from 'react-hotkeys-hook';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';

// Import custom components
import VoiceBtn from './VoiceBtn';
import TokenRing from './TokenRing';
import ChatRoutingIndicator from './ChatRoutingIndicator';
import RouterControls from './RouterControls';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  selectedModel?: string;
  placeholder?: string;
}

// Slash commands configuration
const SLASH_COMMANDS = [
  { id: 'search', label: 'Search', icon: <SearchIcon />, description: 'Search through knowledge base' },
  { id: 'help', label: 'Help', icon: <HelpOutlineIcon />, description: 'Get help with commands' },
  { id: 'code', label: 'Code', icon: <CodeIcon />, description: 'Generate code snippets' },
  { id: 'summarize', label: 'Summarize', icon: <DescriptionIcon />, description: 'Summarize content' },
];

// Persona quick prompts
const PERSONAS = [
  { id: 'ops', label: 'Ops Strategist', prompt: 'Map the operational implications of automating customer onboarding.' },
  { id: 'automation', label: 'Automation Engineer', prompt: 'Design a multi-system workflow triggered by a new invoice in NetSuite.' },
  { id: 'modeler', label: 'AI Automation Modeler', prompt: 'What ML models could assist in automating customer support routing?' },
  { id: 'scribe', label: 'Compliance Scribe', prompt: 'Write a compliant SOP for automated invoice matching.' },
  { id: 'toolchain', label: 'Toolchain Advisor', prompt: 'Compare Make vs UiPath for mid-sized finance team automation.' },
];

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  selectedModel = "GPT-4",
  placeholder = "Ask anything… / for commands",
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [routingEnabled, setRoutingEnabled] = useState(true);
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock token calculation (replace with actual calculation)
  const estimatedTokens = Math.floor(inputValue.length / 4);
  const maxTokens = 8192;
  const tokenPercentage = (estimatedTokens / maxTokens) * 100;
  const estimatedCost = estimatedTokens * 0.00003; // Mock cost calculation

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      setAttachedFiles([]);
    }
  }, [inputValue, isLoading, onSendMessage]);

  // Handle slash commands
  useEffect(() => {
    if (inputValue.startsWith('/') && inputValue.length > 1) {
      setShowCommands(true);
      setAnchorEl(textareaRef.current);
    } else {
      setShowCommands(false);
    }
  }, [inputValue]);

  // Keyboard navigation for commands
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev + 1) % SLASH_COMMANDS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const selectedCommand = SLASH_COMMANDS[selectedCommandIndex];
        setInputValue(`/${selectedCommand.id} `);
        setShowCommands(false);
      } else if (e.key === 'Escape') {
        setShowCommands(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [showCommands, selectedCommandIndex, handleSend]);

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setAttachedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  // Voice input handling
  const handleVoiceInput = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setInputValue(prev => prev + ' ' + transcript);
    }
  }, []);

  // Keyboard shortcuts
  useHotkeys('meta+enter', () => handleSend(), { enableOnFormTags: ['TEXTAREA'] });
  useHotkeys('meta+k', () => {
    setInputValue('/');
    textareaRef.current?.focus();
  }, { enableOnFormTags: ['TEXTAREA'] });

  // Handle persona chip click
  const handlePersonaClick = useCallback((personaPrompt: string) => {
    setInputValue(personaPrompt);
    textareaRef.current?.focus();
  }, []);

  return (
    <Box
      {...getRootProps()}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 720,
        mx: 'auto',
      }}
    >
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `2px dashed ${theme.palette.primary.main}`,
              borderRadius: '32px',
            }}
          >
            <Typography variant="h6" color="primary">Drop files here</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Personas */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        {PERSONAS.map((persona) => (
          <Chip
            key={persona.id}
            label={persona.label}
            size="small"
            variant="outlined"
            onClick={() => handlePersonaClick(persona.prompt)}
          />
        ))}
      </Box>

      {/* Main Input Container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1.5,
          px: 2,
          py: 1,
          borderRadius: '32px',
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha('#1a1a1a', 0.6)
            : alpha('#fff', 0.7),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
          },
          '&:focus-within': {
            boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.12)}`,
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <IconButton size="small" sx={{ color: theme.palette.primary.main }}>
            <AttachFileIcon />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {attachedFiles.length}
            </Typography>
          </IconButton>
        )}

        {/* Auto-resize Textarea */}
        <TextareaAutosize
          ref={textareaRef}
          minRows={1}
          maxRows={6}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
            lineHeight: '1.5',
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
            padding: '4px 0',
          }}
        />

        {/* Token Progress Ring */}
        {inputValue.length > 0 && (
          <TokenRing 
            progress={tokenPercentage} 
            tokens={estimatedTokens}
            maxTokens={maxTokens}
            costUsd={estimatedCost} 
          />
        )}

        {/* Voice Input Button */}
        <VoiceBtn 
          isRecording={isRecording}
          onRecordingChange={setIsRecording}
          onTranscript={handleVoiceInput}
        />

        {/* Router Controls */}
        <RouterControls 
          onToggle={setRoutingEnabled}
        />

        {/* Send Button */}
        <motion.div
          whileTap={{ rotate: 45, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <IconButton
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="medium"
            sx={{
              width: 36,
              height: 36,
              backgroundColor: '#c8102e',
              color: 'white',
              '&:hover': {
                backgroundColor: '#a50d24',
              },
              '&:disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </motion.div>
      </Box>

      {/* Slash Commands Palette */}
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
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#1a1a1a', 0.95)
              : alpha('#fff', 0.95),
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            minWidth: 300,
          },
        }}
      >
        <List dense>
          {SLASH_COMMANDS.map((command, index) => (
            <ListItemButton
              key={command.id}
              selected={index === selectedCommandIndex}
              onClick={() => {
                setInputValue(`/${command.id} `);
                setShowCommands(false);
                textareaRef.current?.focus();
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {command.icon}
              </ListItemIcon>
              <ListItemText 
                primary={command.label}
                secondary={command.description}
                primaryTypographyProps={{ fontSize: '0.875rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>

      {/* Chat Routing Indicator */}
      {routingEnabled && inputValue.trim() && (
        <ChatRoutingIndicator message={inputValue.trim()} />
      )}

      {/* Model Chip */}
      {selectedModel && (
        <Box
          sx={{
            position: 'absolute',
            top: -40,
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
              height: 24,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ChatInput;