import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, CircularProgress, Typography, useTheme, Chip, Fade } from '@mui/material';

interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-reply';
}

const BOT_GREETING = "👋 Hi there! I'm your TSC AutoTractor Assistant. I can help you with store operations, HR requests, inventory management, and much more. What can I assist you with today?";

const QUICK_REPLIES = [
  "Check store inventory",
  "Submit time-off request", 
  "Weekly sales report",
  "Update vendor info"
];

const DEMO_RESPONSES: Record<string, string> = {
  'inventory': "📦 I can help you check inventory levels across all stores. For example, Store #1247 currently has 85% stock levels with low inventory alerts for lawn mowers and fertilizer. Would you like me to generate a detailed inventory report?",
  'time off': "🏖️ I can process your time-off request instantly. Based on your current PTO balance of 16 days and store staffing levels, I can approve up to 5 consecutive days. When would you like to take time off?",
  'sales': "📊 Your weekly sales report shows a 12% increase compared to last week. Top performing categories: Garden Center (+18%), Tool Rental (+15%), and Feed & Seed (+9%). Would you like me to generate a detailed breakdown?",
  'vendor': "🤝 I can help update vendor information in our system. Which vendor would you like to update? I can modify contact details, pricing agreements, or delivery schedules instantly.",
  'schedule': "📅 I can help with staff scheduling. Current week shows full coverage with 2 open shifts on weekend. Would you like me to find available team members or post to the internal job board?",
  'help': "I'm here to assist with daily TSC operations! I can help with:\n\n• 📦 Inventory management\n• 👥 HR & scheduling\n• 📊 Reports & analytics\n• 🤝 Vendor coordination\n• 💰 Financial tracking\n• 🛠️ Maintenance requests\n\nJust ask me anything!"
};

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const getResponse = (input: string): string => {
  const lowercaseInput = input.toLowerCase();
  
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (lowercaseInput.includes(key)) {
      return response;
    }
  }
  
  return "I understand you're asking about operations. While I'm in demo mode, I can show you how I'd help with inventory management, HR requests, sales reporting, and vendor coordination. Try asking about 'inventory', 'time off', 'sales report', or 'vendor updates'!";
};

export const SupportWidget: React.FC = () => {
  const theme = useTheme();
  const [msgs, setMsgs] = useState<Message[]>([
    { 
      id: newId(), 
      text: BOT_GREETING, 
      from: 'bot', 
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  useEffect(scrollToBottom, [msgs, loading]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMsgs(prev => [...prev, {
      ...message,
      id: newId(),
      timestamp: new Date()
    }]);
  };

  const handleQuickReply = (reply: string) => {
    setShowQuickReplies(false);
    addMessage({ text: reply, from: 'user' });
    simulateResponse(reply);
  };

  const simulateResponse = async (userInput: string) => {
    setLoading(true);
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const response = getResponse(userInput);
    addMessage({ text: response, from: 'bot' });
    setLoading(false);
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    
    setShowQuickReplies(false);
    addMessage({ text: trimmed, from: 'user' });
    setText('');
    
    simulateResponse(trimmed);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    }}>
      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        pb: 1,
        scrollBehavior: 'smooth',
        '&::-webkit-scrollbar': {
          width: 6,
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          borderRadius: 3,
        },
      }}>
        {msgs.map((m, index) => (
          <Fade in key={m.id} timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
                mb: 0.5,
              }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 1.5,
                    borderRadius: m.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    maxWidth: '85%',
                    position: 'relative',
                    background: m.from === 'user' 
                      ? 'linear-gradient(135deg, #c8102e 0%, #a50d24 100%)'
                      : theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)'
                        : 'linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)',
                    color: m.from === 'user' 
                      ? '#fff' 
                      : theme.palette.text.primary,
                    fontSize: 14,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    boxShadow: m.from === 'user'
                      ? '0 2px 12px rgba(200, 16, 46, 0.3)'
                      : theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: m.from === 'bot' ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` : 'none',
                    '&::before': m.from === 'user' ? {
                      content: '""',
                      position: 'absolute',
                      right: -1,
                      bottom: -1,
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid #c8102e',
                      borderTop: '8px solid transparent',
                    } : {},
                  }}
                >
                  {m.text.split('\n').map((line, i) => (
                    <Typography key={i} component="div" sx={{ fontSize: 'inherit', fontWeight: 400 }}>
                      {line}
                    </Typography>
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ 
                display: 'flex',
                justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
                px: 1,
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                    opacity: 0.7,
                  }}
                >
                  {formatTime(m.timestamp)}
                </Typography>
              </Box>
            </Box>
          </Fade>
        ))}
        
        {loading && (
          <Fade in>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.5,
                borderRadius: '18px 18px 18px 4px',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%)'
                  : 'linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              }}>
                <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  AutoTractor is thinking...
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Quick Replies */}
        {showQuickReplies && !loading && (
          <Fade in timeout={600}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ 
                color: theme.palette.text.secondary, 
                mb: 1.5, 
                display: 'block',
                fontWeight: 500,
              }}>
                Try these common requests:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {QUICK_REPLIES.map((reply) => (
                  <Chip
                    key={reply}
                    label={reply}
                    onClick={() => handleQuickReply(reply)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      fontSize: '0.75rem',
                      height: 28,
                      '&:hover': {
                        backgroundColor: `${theme.palette.primary.main}10`,
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Fade>
        )}
        
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box sx={{ 
        display: 'flex', 
        p: 2, 
        pt: 1,
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        background: theme.palette.mode === 'dark'
          ? 'rgba(26, 26, 26, 0.8)'
          : 'rgba(248, 249, 250, 0.8)',
        backdropFilter: 'blur(10px)',
      }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about inventory, scheduling, reports..."
          disabled={loading}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#ffffff',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
              },
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '0.9rem',
            },
          }}
        />
        <IconButton 
          color="primary" 
          onClick={send} 
          disabled={!text.trim() || loading}
          sx={{ 
            ml: 1,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'currentColor' }} />
          ) : (
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
              →
            </Typography>
          )}
        </IconButton>
      </Box>
    </Box>
  );
}; 