import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, CircularProgress, Typography, useTheme, Chip, Fade } from '@mui/material';

interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-reply';
}

const BOT_GREETING = "🍯 Welcome to AgentHive! I'm your Agentic AI Coordinator 🐝 - part of an intelligent swarm that learns, adapts, and collaborates autonomously. Unlike traditional AI assistants, I work with specialized agent teams to solve complex enterprise challenges. Let me show you how agentic AI transforms business operations!";

const QUICK_REPLIES = [
  "What is agentic AI?",
  "Show me agent collaboration", 
  "Autonomous workflow example",
  "Multi-agent problem solving"
];

const DEMO_RESPONSES: Record<string, string> = {
  'agentic': "🍯 **Agentic AI** means autonomous agents that can:\n\n🧠 **Think independently** - Make decisions without constant human oversight\n🤝 **Collaborate with other agents** - Share knowledge and coordinate tasks\n🎯 **Take proactive action** - Identify and solve problems before they escalate\n📈 **Learn and adapt** - Improve performance through experience\n\nUnlike chatbots that just respond, agentic AI agents actively work toward business goals!",
  
  'collaboration': "🐝 **Agent Collaboration Example:**\n\n*Scenario: Customer complaint about delayed shipment*\n\n1. 🎧 **Customer Service Agent** - Receives complaint, analyzes sentiment\n2. 📦 **Logistics Agent** - Checks shipment status, identifies bottleneck\n3. 💬 **Communication Agent** - Crafts personalized response with solutions\n4. 📊 **Analytics Agent** - Updates metrics, prevents future issues\n\nAll agents work together in seconds, not hours!",
  
  'workflow': "⚡ **Autonomous Workflow in Action:**\n\n🍯 **Smart Inventory Management:**\n• AI monitors stock levels across 500+ stores\n• Predicts demand using weather, holidays, trends\n• Automatically generates purchase orders\n• Negotiates with vendor APIs for best prices\n• Schedules optimal delivery times\n• Alerts staff only when human intervention needed\n\n*Result: 40% reduction in stockouts, 25% cost savings*",
  
  'problem solving': "🧩 **Multi-Agent Problem Solving:**\n\n*Challenge: Store experiencing unusual sales drop*\n\n🔍 **Investigation Team:**\n• � **Market Agent** - Analyzes competitor pricing\n• 🌤️ **Weather Agent** - Checks local conditions\n• 👥 **Customer Agent** - Reviews feedback patterns\n• 🛒 **Sales Agent** - Examines purchase behaviors\n\n🎯 **Solution Discovery:**\nAgents identify: Construction blocking parking → Coordinate with city planning → Implement temporary solutions → Sales recover within 3 days",
  
  'help': "🍯 **AgentHive: Enterprise Agentic AI Platform**\n\n**What I can teach you about:**\n\n🧠 **Agentic AI Fundamentals** - How autonomous agents think and act\n🤝 **Swarm Intelligence** - How agents collaborate and share knowledge\n⚡ **Real-time Automation** - Workflows that run without human intervention\n� **Predictive Operations** - AI that anticipates and prevents problems\n� **Continuous Learning** - How the hive gets smarter over time\n\n*Ask me anything about transforming your business with agentic AI!*"
};

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const getResponse = (input: string): string => {
  const lowercaseInput = input.toLowerCase();
  
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (lowercaseInput.includes(key)) {
      return response;
    }
  }
  
  return "🍯 Great question! I'm here to educate you about **Agentic AI** - the future of enterprise automation. Try asking me:\n\n• 'What is agentic AI?' - Learn the fundamentals\n• 'Show me agent collaboration' - See swarm intelligence in action\n• 'Autonomous workflow example' - Discover self-running processes\n• 'Multi-agent problem solving' - Watch AI teams solve complex challenges\n\nAgentic AI isn't just about chat - it's about autonomous agents that think, collaborate, and act to transform your business! 🐝";
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
        ? `
          linear-gradient(180deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%),
          radial-gradient(circle at 30% 70%, rgba(255, 204, 0, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, rgba(255, 193, 7, 0.02) 0%, transparent 50%)
        `
        : `
          linear-gradient(180deg, #fffef9 0%, #fefdf6 50%, #fdfcf3 100%),
          radial-gradient(circle at 30% 70%, rgba(255, 204, 0, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, rgba(255, 193, 7, 0.06) 0%, transparent 50%)
        `,
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
                      ? 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)'
                      : theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 50%, rgba(45, 45, 45, 0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 248, 220, 0.8) 0%, rgba(255, 245, 157, 0.6) 50%, #fffef7 100%)',
                    color: m.from === 'user' 
                      ? '#fff' 
                      : theme.palette.text.primary,
                    fontSize: 14,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    boxShadow: m.from === 'user'
                      ? '0 3px 15px rgba(255, 140, 0, 0.4), 0 1px 5px rgba(255, 165, 0, 0.2)'
                      : theme.palette.mode === 'dark'
                        ? '0 3px 12px rgba(255, 204, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.3)'
                        : '0 3px 12px rgba(255, 204, 0, 0.15), 0 1px 4px rgba(255, 193, 7, 0.1)',
                    border: m.from === 'bot' 
                      ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 193, 7, 0.3)'}` 
                      : 'none',
                    '&::before': m.from === 'user' ? {
                      content: '""',
                      position: 'absolute',
                      right: -1,
                      bottom: -1,
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid #FF8C00',
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
                  ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.12) 0%, rgba(255, 165, 0, 0.08) 50%, rgba(45, 45, 45, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 248, 220, 0.8) 0%, rgba(255, 245, 157, 0.6) 50%, #fffef7 100%)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 193, 7, 0.3)'}`,
              }}>
                <CircularProgress size={16} sx={{ color: '#FFB300' }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  AgentHive is thinking...
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
                Try these agentic AI topics:
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
                      borderColor: '#FFB300',
                      color: '#FF8C00',
                      fontSize: '0.75rem',
                      height: 30,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 248, 220, 0.6) 0%, rgba(255, 245, 157, 0.4) 100%)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 193, 7, 0.15)'
                          : 'rgba(255, 193, 7, 0.1)',
                        borderColor: '#FF8C00',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
                      },
                      transition: 'all 0.2s ease',
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
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.15)' : 'rgba(255, 193, 7, 0.2)'}`,
        background: theme.palette.mode === 'dark'
          ? `
            linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%),
            radial-gradient(circle at 50% 0%, rgba(255, 204, 0, 0.05) 0%, transparent 50%)
          `
          : `
            linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 253, 246, 0.98) 100%),
            radial-gradient(circle at 50% 0%, rgba(255, 204, 0, 0.08) 0%, transparent 50%)
          `,
        backdropFilter: 'blur(10px)',
      }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask me about agentic AI, swarm intelligence, or autonomous workflows..."
          disabled={loading}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 204, 0, 0.05)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 193, 7, 0.3)'}`,
              '&:hover fieldset': {
                borderColor: '#FFB300',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#FF8C00',
                borderWidth: 2,
                boxShadow: '0 0 8px rgba(255, 193, 7, 0.3)',
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
            background: 'linear-gradient(135deg, #FFB300 0%, #FF8C00 100%)',
            color: 'white',
            width: 42,
            height: 42,
            border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.3)' : 'rgba(255, 193, 7, 0.4)'}`,
            '&:hover': {
              background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 100%)',
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(255, 193, 7, 0.4)',
            },
            '&.Mui-disabled': {
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(255, 204, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)' 
                : 'linear-gradient(135deg, rgba(255, 204, 0, 0.2) 0%, rgba(255, 193, 7, 0.1) 100%)',
              color: theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.3)' : 'rgba(255, 193, 7, 0.5)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 204, 0, 0.1)' : 'rgba(255, 193, 7, 0.2)'}`,
            },
            transition: 'all 0.2s ease',
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