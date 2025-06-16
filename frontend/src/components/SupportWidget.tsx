import React, { useState, useCallback, useMemo } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Collapse,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  HelpOutline as HelpIcon,
  QuestionAnswer as ChatIcon,
  Assignment as TicketIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import TractorIcon from './icons/TractorIcon';

interface SupportQuery {
  message: string;
  category: string;
  urgency: string;
  email?: string;
  order_id?: string;
}

interface SupportResponse {
  response: string;
  suggested_actions: string[];
  escalation_needed: boolean;
  category: string;
  confidence: number;
  ticket_id?: string;
  estimated_resolution_time?: string;
}

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  helpful_count: number;
}

const SupportWidget: React.FC = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'chat' | 'kb'>('main');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [urgency, setUrgency] = useState('normal');
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<SupportResponse | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [expandedKbItems, setExpandedKbItems] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'general', name: 'General Support', icon: '🤝' },
    { id: 'orders', name: 'Orders & Shipping', icon: '📦' },
    { id: 'returns', name: 'Returns & Exchanges', icon: '↩️' },
    { id: 'warranty', name: 'Warranty & Repairs', icon: '🔧' },
    { id: 'pickup', name: 'Store Pickup', icon: '🏪' },
    { id: 'account', name: 'Account Issues', icon: '👤' },
    { id: 'products', name: 'Product Information', icon: '🛠️' },
  ];

  const urgencyLevels = [
    { id: 'low', name: 'Low Priority', color: '#4caf50' },
    { id: 'normal', name: 'Normal', color: '#2196f3' },
    { id: 'high', name: 'High Priority', color: '#ff9800' },
    { id: 'urgent', name: 'Urgent', color: '#f44336' },
  ];

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (knowledgeBase.length === 0) {
      fetchKnowledgeBase();
    }
  }, [knowledgeBase.length]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCurrentView('main');
    setResponse(null);
  }, []);

  const fetchKnowledgeBase = useCallback(async () => {
    try {
      const response = await fetch('/support/knowledge-base');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBase(data);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge base:', error);
    }
  }, []);

  const handleSubmitQuery = useCallback(async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const query: SupportQuery = {
        message: message.trim(),
        category,
        urgency,
        email: email || undefined,
        order_id: orderId || undefined,
      };

      const response = await fetch('/support/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (response.ok) {
        const data: SupportResponse = await response.json();
        setResponse(data);
        setCurrentView('chat');
      } else {
        console.error('Support query failed');
      }
    } catch (error) {
      console.error('Error submitting support query:', error);
    } finally {
      setIsLoading(false);
    }
  }, [message, category, urgency, email, orderId]);

  const toggleKbItem = useCallback((itemId: string) => {
    setExpandedKbItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const categoryConfig = useMemo(() => 
    categories.find(cat => cat.id === category) || categories[0], 
    [category]
  );

  const urgencyConfig = useMemo(() => 
    urgencyLevels.find(level => level.id === urgency) || urgencyLevels[1], 
    [urgency]
  );

  // Widget button with AutoPilot logo
  const WidgetButton = useMemo(() => (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.6
      }}
    >
      <Fab
        color="primary"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 64,
          height: 64,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.6)}`,
            transform: 'translateY(-2px)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, transparent, ${theme.palette.primary.main})`,
            zIndex: -1,
            animation: 'spin 3s linear infinite',
          },
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      >
        <TractorIcon sx={{ fontSize: 32, color: 'white' }} />
      </Fab>
    </motion.div>
  ), [handleOpen, theme.palette.primary]);

  return (
    <>
      {WidgetButton}
      
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            overflow: 'hidden',
          },
        }}
        TransitionComponent={Slide}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <TractorIcon sx={{ fontSize: 32, color: 'white' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Enterprise Customer Support
            </Typography>
            <Typography variant="caption" color="text.secondary">
              We're here to help with your questions
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <AnimatePresence mode="wait">
            {currentView === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    How can we help you today?
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Describe your question or issue"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{ mb: 3 }}
                    placeholder="For example: I need help tracking my order, or I want to return an item..."
                  />

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        label="Category"
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{cat.icon}</span>
                              {cat.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                        label="Priority"
                      >
                        {urgencyLevels.map((level) => (
                          <MenuItem key={level.id} value={level.id}>
                            <Chip 
                              label={level.name} 
                              size="small" 
                              sx={{ 
                                backgroundColor: alpha(level.color, 0.1),
                                color: level.color,
                                borderColor: level.color,
                              }}
                              variant="outlined"
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                      label="Email (Optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{ flex: 1 }}
                      size="small"
                    />
                    <TextField
                      label="Order ID (Optional)"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      sx={{ flex: 1 }}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      startIcon={<HelpIcon />}
                      onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
                    >
                      Browse Help Articles
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={isLoading ? <CircularProgress size={16} /> : <SendIcon />}
                      onClick={handleSubmitQuery}
                      disabled={!message.trim() || isLoading}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        },
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Get Support'}
                    </Button>
                  </Box>

                  <Collapse in={showKnowledgeBase}>
                    <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Popular Help Articles
                      </Typography>
                      <List dense>
                        {knowledgeBase.slice(0, 4).map((item) => (
                          <ListItemButton 
                            key={item.id} 
                            onClick={() => toggleKbItem(item.id)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon>
                              <HelpIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.title}
                              secondary={expandedKbItems.has(item.id) ? item.content : undefined}
                            />
                            <IconButton size="small">
                              {expandedKbItems.has(item.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </ListItemButton>
                        ))}
                      </List>
                    </Box>
                  </Collapse>
                </Box>
              </motion.div>
            )}

            {currentView === 'chat' && response && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Chip 
                      label={`${categoryConfig.icon} ${categoryConfig.name}`}
                      color="primary" 
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={urgencyConfig.name}
                      size="small"
                      sx={{
                        backgroundColor: alpha(urgencyConfig.color, 0.1),
                        color: urgencyConfig.color,
                        borderColor: urgencyConfig.color,
                      }}
                      variant="outlined"
                    />
                  </Box>

                  <Alert 
                    severity={response.confidence > 0.8 ? "success" : response.confidence > 0.6 ? "info" : "warning"}
                    sx={{ mb: 3 }}
                  >
                    <Typography variant="body1" gutterBottom>
                      {response.response}
                    </Typography>
                    {response.estimated_resolution_time && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
                        Estimated resolution time: {response.estimated_resolution_time}
                      </Typography>
                    )}
                  </Alert>

                  {response.suggested_actions.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Suggested Next Steps:
                      </Typography>
                      <List dense>
                        {response.suggested_actions.map((action, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon>
                              <SpeedIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={action} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {response.ticket_id && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="body2">
                        <strong>Support Ticket Created:</strong> {response.ticket_id}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Our team will follow up with you soon.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.5),
        }}>
          {currentView === 'chat' && (
            <Button onClick={() => setCurrentView('main')} startIcon={<ChatIcon />}>
              Ask Another Question
            </Button>
          )}
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SupportWidget; 