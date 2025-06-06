import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment, 
  useTheme, 
  Tooltip, 
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Collapse,
  Avatar,
  keyframes,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DescriptionIcon from '@mui/icons-material/Description';
import PsychologyIcon from '@mui/icons-material/Psychology';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import AutoMode from '@mui/icons-material/AutoMode';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useDispatch } from 'react-redux';
import { routerTraceReceived } from '../features/routerTrace/routerTraceSlice';
import { v4 as uuidv4 } from 'uuid';
import { addMessage } from '../features/chat/chatSlice';

import AgentMenu from './AgentDrivenChatInput/AgentMenu';
import { classifyAndRoute } from '../utils/router';
import ChartFactory, { getChartConfigForPrompt } from './ChartFactory';

// Types
interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  avatarBg: string;
  emoji: string;
  capabilities: string[];
}

interface Prompt {
  text: string;
  icon: React.ReactNode;
  category: string;
  agent: string;
}

interface AgentDrivenChatInputProps {
  onSendMessage: (text: string, agent: string) => void;
  isLoading: boolean;
  onStopRequest?: () => void;
  activeAgent?: string;
  onAgentChange?: (agentId: string) => void;
  routerSimulationMode?: boolean;
  onToggleRouterSimulation?: () => void;
}

// Agent definitions with expanded capabilities
const agents: Agent[] = [
  {
    id: "lease",
    name: "TSC Lease Document Agent",
    description: "Specialized in TSC lease analysis and document management",
    icon: <InsertDriveFileOutlinedIcon />,
    color: "#c8102e", // TSC Red
    avatarBg: "white",
    emoji: "🚜",
    capabilities: [
      "Document analysis",
      "Contract review",
      "Data extraction",
      "Financial interpretation",
      "Lease comparison"
    ]
  },
  {
    id: "marketing",
    name: "TSC Marketing Expert",
    description: "Expert in marketing strategies, campaigns, and brand management",
    icon: <BarChartIcon />,
    color: "#9c27b0", // Purple
    avatarBg: "white",
    emoji: "🎯",
    capabilities: [
      "Campaign planning",
      "Brand strategy",
      "Market analysis",
      "Content creation",
      "Performance tracking"
    ]
  },
  {
    id: "general",
    name: "TSC General Assistant",
    description: "Can answer questions on a wide range of Tractor Supply topics",
    icon: <SmartToyIcon />,
    color: "#1976d2", // MUI blue
    avatarBg: "white",
    emoji: "🤖",
    capabilities: [
      "Knowledge base",
      "Creative thinking",
      "Problem solving",
      "Research assistance",
      "General guidance"
    ]
  },
  {
    id: "support",
    name: "TSC Customer Support",
    description: "Expert in customer service, product support, and issue resolution",
    icon: <PsychologyIcon />,
    color: "#2e7d32", // Green
    avatarBg: "white",
    emoji: "🛠️",
    capabilities: [
      "Product troubleshooting",
      "Order assistance",
      "Return processing",
      "Account management",
      "Technical support"
    ]
  },
  {
    id: "sales",
    name: "TSC Sales Expert",
    description: "Knowledgeable about products, pricing, and sales strategies",
    icon: <BarChartIcon />,
    color: "#ed6c02", // Orange
    avatarBg: "white",
    emoji: "💰",
    capabilities: [
      "Product recommendations",
      "Pricing information",
      "Inventory checking",
      "Sales analytics",
      "Customer insights"
    ]
  },
  {
    id: "technical",
    name: "TSC Technical Expert",
    description: "Specialized in technical products, equipment, and systems",
    icon: <DescriptionIcon />,
    color: "#6a1b9a", // Purple
    avatarBg: "white",
    emoji: "⚙️",
    capabilities: [
      "Equipment specifications",
      "Installation guidance",
      "Maintenance procedures",
      "Safety protocols",
      "Technical documentation"
    ]
  },
  {
    id: "analytics",
    name: "TSC Data Analyst",
    description: "Expert in data analysis, reporting, and business intelligence",
    icon: <BarChartIcon />,
    color: "#0277bd", // Deep blue
    avatarBg: "white",
    emoji: "📊",
    capabilities: [
      "Data visualization",
      "Performance metrics",
      "Trend analysis",
      "Report generation",
      "Business insights"
    ]
  },
  {
    id: "hr",
    name: "HR Agent",
    description: "Expert in human resources, time-off requests, and employee management",
    icon: <PsychologyIcon />,
    color: "#4caf50", // Green
    avatarBg: "white",
    emoji: "👥",
    capabilities: [
      "Time-off management",
      "Clock in/out tracking",
      "Employee requests",
      "HR policies",
      "Benefits administration"
    ]
  }
];

// Predefined prompts
const predefinedPrompts: Prompt[] = [
  // TSC Lease Document Agent prompts
  {
    text: "What is the lease expiration date for each property?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "Who is responsible for roof repair for each property?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "Who is responsible for parking lot maintenance for each property?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "Build a table with 6 columns. The columns should be labeled (1) property name, (2) Monthly Lease $ (3) Lease Start Date, (4) Term of Lease, (5) Parking Lot Responsibility, and (6) Roof Responsibility",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "Can you show me all recurring expense schedules?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "List the alteration covenants along with landlord info for standalone or shopping center properties.",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "Show the options available for our leased store locations, including their expiration dates.",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "Give me current amounts for rent, CAM, tax, and insurance for all active stores.",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "List all leases expiring within the next six months.",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  {
    text: "Show transactions awaiting approval with a status of either 'Review' or 'Hold' specific to the TSC department.",
    icon: <DescriptionIcon fontSize="small" />,
    category: "lease",
    agent: "lease"
  },
  
  // TSC Marketing Expert prompts
  {
    text: "What are our current marketing campaign performance metrics?",
    icon: <BarChartIcon fontSize="small" />,
    category: "marketing",
    agent: "marketing"
  },
  {
    text: "Analyze our social media engagement across different platforms",
    icon: <BarChartIcon fontSize="small" />,
    category: "marketing",
    agent: "marketing"
  },
  {
    text: "What are the key trends in our customer acquisition channels?",
    icon: <BarChartIcon fontSize="small" />,
    category: "marketing",
    agent: "marketing"
  },
  {
    text: "How effective are our current promotional strategies?",
    icon: <BarChartIcon fontSize="small" />,
    category: "marketing",
    agent: "marketing"
  },
  {
    text: "What are our top-performing marketing campaigns this quarter?",
    icon: <BarChartIcon fontSize="small" />,
    category: "marketing",
    agent: "marketing"
  },
  {
    text: "Analyze our email marketing performance and open rates",
    icon: <BarChartIcon fontSize="small" />,
    category: "marketing",
    agent: "marketing"
  },
  
  // TSC General Assistant prompts
  {
    text: "Tell me about Tractor Supply Company's product offerings",
    icon: <SmartToyIcon fontSize="small" />,
    category: "general",
    agent: "general"
  },
  {
    text: "What are TSC's key business locations and distribution centers?",
    icon: <SmartToyIcon fontSize="small" />,
    category: "general",
    agent: "general"
  },
  {
    text: "Explain TSC's approach to customer service and support",
    icon: <SmartToyIcon fontSize="small" />,
    category: "general",
    agent: "general"
  },
  {
    text: "How does TSC manage its supply chain operations?",
    icon: <SmartToyIcon fontSize="small" />,
    category: "general",
    agent: "general"
  },
  
  // TSC Customer Support prompts
  {
    text: "I need help tracking my recent order",
    icon: <PsychologyIcon fontSize="small" />,
    category: "support",
    agent: "support"
  },
  {
    text: "How do I return or exchange a product I purchased?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "support",
    agent: "support"
  },
  {
    text: "My product arrived damaged - what should I do?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "support",
    agent: "support"
  },
  {
    text: "I can't log into my TSC account - can you help?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "support",
    agent: "support"
  },
  {
    text: "When will my Buy Online, Pick Up In Store order be ready?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "support",
    agent: "support"
  },
  {
    text: "I have a warranty claim for equipment I purchased",
    icon: <PsychologyIcon fontSize="small" />,
    category: "support",
    agent: "support"
  },
  
  // TSC Sales Expert prompts
  {
    text: "What are the best-selling products in the farm equipment category?",
    icon: <BarChartIcon fontSize="small" />,
    category: "sales",
    agent: "sales"
  },
  {
    text: "Can you recommend products for a small hobby farm setup?",
    icon: <BarChartIcon fontSize="small" />,
    category: "sales",
    agent: "sales"
  },
  {
    text: "What's the current inventory status for riding mowers?",
    icon: <BarChartIcon fontSize="small" />,
    category: "sales",
    agent: "sales"
  },
  {
    text: "Show me pricing and promotions for feed and animal care products",
    icon: <BarChartIcon fontSize="small" />,
    category: "sales",
    agent: "sales"
  },
  {
    text: "What seasonal products should we feature this quarter?",
    icon: <BarChartIcon fontSize="small" />,
    category: "sales",
    agent: "sales"
  },
  {
    text: "Analyze customer purchasing patterns for livestock supplies",
    icon: <BarChartIcon fontSize="small" />,
    category: "sales",
    agent: "sales"
  },
  
  // TSC Technical Expert prompts
  {
    text: "What are the technical specifications for the latest zero-turn mowers?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "technical",
    agent: "technical"
  },
  {
    text: "How do I properly maintain a diesel tractor engine?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "technical",
    agent: "technical"
  },
  {
    text: "What safety protocols should be followed for welding equipment?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "technical",
    agent: "technical"
  },
  {
    text: "Can you provide installation instructions for electric fence systems?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "technical",
    agent: "technical"
  },
  {
    text: "What are the power requirements for shop equipment and tools?",
    icon: <DescriptionIcon fontSize="small" />,
    category: "technical",
    agent: "technical"
  },
  {
    text: "Troubleshoot common issues with irrigation systems",
    icon: <DescriptionIcon fontSize="small" />,
    category: "technical",
    agent: "technical"
  },
  
  // TSC Data Analyst prompts
  {
    text: "Generate a sales performance report for the last quarter",
    icon: <BarChartIcon fontSize="small" />,
    category: "analytics",
    agent: "analytics"
  },
  {
    text: "Show customer satisfaction trends across all store locations",
    icon: <BarChartIcon fontSize="small" />,
    category: "analytics",
    agent: "analytics"
  },
  {
    text: "Analyze inventory turnover rates by product category",
    icon: <BarChartIcon fontSize="small" />,
    category: "analytics",
    agent: "analytics"
  },
  {
    text: "What are the peak shopping times and seasonal patterns?",
    icon: <BarChartIcon fontSize="small" />,
    category: "analytics",
    agent: "analytics"
  },
  {
    text: "Create a dashboard showing key performance indicators",
    icon: <BarChartIcon fontSize="small" />,
    category: "analytics",
    agent: "analytics"
  },
  {
    text: "Compare regional performance metrics and identify growth opportunities",
    icon: <BarChartIcon fontSize="small" />,
    category: "analytics",
    agent: "analytics"
  },
  
  // TSC HR Agent prompts
  {
    text: "How many vacation days do I have remaining this year?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "I need personal days from 06/03/2025 to 06/05/2025",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "I need to request time off for next week",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "What are the company benefits available to me?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "Can you help me with payroll questions?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "What is the company policy on sick leave?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "How do I check my leave balance in UKG?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "I need help with my employee profile and personal information",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  },
  {
    text: "What are the steps to update my direct deposit information?",
    icon: <PsychologyIcon fontSize="small" />,
    category: "hr",
    agent: "hr"
  }
];

// Define new keyframes for animations
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(var(--agent-color-rgb), 0.15); }
  70% { box-shadow: 0 0 0 4px rgba(var(--agent-color-rgb), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--agent-color-rgb), 0); }
`;

const typingAnimation = keyframes`
  0% { transform: translateY(0); }
  25% { transform: translateY(-0.5px); }
  50% { transform: translateY(0); }
`;

const placeholderFade = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.9; }
`;

const ChatInputTokenEstimate = (text: string) => Math.ceil(text.length / 4);

const AgentDrivenChatInput: React.FC<AgentDrivenChatInputProps> = ({ 
  onSendMessage, 
  isLoading,
  onStopRequest = () => {},
  activeAgent,
  onAgentChange,
  routerSimulationMode = true,
  onToggleRouterSimulation
 }) => {
  const [inputValue, setInputValue] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>(activeAgent || "general");
  const [agentMenuAnchor, setAgentMenuAnchor] = useState<null | HTMLElement>(null);
  const [agentCapabilitiesVisible, setAgentCapabilitiesVisible] = useState(false); // Toggle for agent capabilities
  const [showInitAnimation, setShowInitAnimation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [showChartsMenu, setShowChartsMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showPromptsMenu, setShowPromptsMenu] = useState(false);
  const [routingAgent, setRoutingAgent] = useState<string | null>(null);
  const [isRoutingDetecting, setIsRoutingDetecting] = useState(false);
  
  const promptsContainerRef = useRef<HTMLDivElement>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const mode = theme.palette.mode;
  const dispatch = useDispatch();
  
  // Get the current selected agent
  const currentAgent = agents.find(agent => agent.id === selectedAgent) || agents[0];

  // Memoized filtered prompts for performance
  const memoizedFilteredPrompts = useMemo(() => {
    if (!showPrompts || inputValue.length === 0) return [];
    
    const lowerInput = inputValue.toLowerCase();
    const agentPrompts = predefinedPrompts.filter(prompt => 
      prompt.agent === selectedAgent &&
      prompt.text.toLowerCase().includes(lowerInput)
    );
    
    const recentPrompts = recentQueries
      .filter(query => query.toLowerCase().includes(lowerInput))
      .map(query => ({
        text: query,
        icon: <HistoryIcon fontSize="small" />,
        category: 'recent',
        isRecent: true,
        agent: selectedAgent
      }));
    
    return [...agentPrompts, ...recentPrompts];
  }, [showPrompts, inputValue, selectedAgent, recentQueries]);

  // Canvas context to open chart visualization via slash command
  const { openWithMessage } = useCanvas();

  // Get contextual placeholder based on the selected agent
  const getContextualPlaceholder = useCallback(() => {
    if (isLoading) {
      return "Processing your request...";
    }
    
    if (showInitAnimation) {
      return `Initializing ${currentAgent.name}...`;
    }
    
    if (routerSimulationMode) {
      return "Ask anything—I'll pick the best agent for you…";
    }
    
    return `Ask ${currentAgent.name} something...`;
  }, [isLoading, showInitAnimation, currentAgent, routerSimulationMode]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Check for chart command
    if (text.startsWith('/chart')) {
      const chartComponent = handleChartCommand(text);
      if (chartComponent) {
        // Add the chart as a system message
        dispatch(addMessage({
          id: uuidv4(),
          text: text,
          sender: 'system',
          timestamp: new Date().toISOString(),
          chart: chartComponent
        }));
        return;
      }
    }
    
    // Delegates user-message creation to the parent ChatInterface to avoid
    // duplicate bubbles.
    onSendMessage(text, currentAgent.id);
    
    // Save to recent queries
    const updated = [text, ...recentQueries.filter(q => q !== text)].slice(0, 10);
    setRecentQueries(updated);
    localStorage.setItem('recentLeaseAgentQueries', JSON.stringify(updated));
  }, [currentAgent.id, onSendMessage, recentQueries, dispatch]);

  useEffect(() => {
    const stored = localStorage.getItem('recentLeaseAgentQueries');
    if (stored) setRecentQueries(JSON.parse(stored));
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return <>
      {text.slice(0, idx)}
      <span style={{ fontWeight: 700, background: 'rgba(200,16,46,0.12)', borderRadius: 3 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>;
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    setTimeout(() => {
      if (suggestion.trim() !== '' && !isLoading && !showInitAnimation) {
        handleSendMessage(suggestion);
        setInputValue('');
      }
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && allSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, allSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        const selected = allSuggestions[highlightedIndex];
        if (selected) {
          handleSuggestionSelect(selected.text);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Do not send here; letting the natural form submission (or button)
      // handle the send to avoid duplicate user bubbles.
    }
  };

  // Use memoized filtered prompts for better performance
  const filteredPrompts = memoizedFilteredPrompts;

  const allSuggestions = [
    ...filteredPrompts.map(p => ({ text: p.text, icon: p.icon, isRecent: false })),
    ...recentQueries
      .filter(q => !filteredPrompts.some(p => p.text === q) && q.toLowerCase().includes(inputValue.toLowerCase()))
      .map(q => ({ text: q, icon: <HistoryIcon fontSize="small" />, isRecent: true })),
  ];

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (text === '' || isLoading) return;

    // Slash command for chart
    const chartCmdMatch = text.match(/^\/chart\s+(\w+)/i);
    if (chartCmdMatch) {
      const chartType = chartCmdMatch[1].toLowerCase();
      openWithMessage({
        id: `chart-${Date.now()}`,
        text: `#chart:${chartType}`,
        sender: 'system',
        timestamp: new Date().toISOString(),
      });
      setInputValue('');
      return;
    }

    handleSendMessage(text);
    setInputValue('');
  }, [inputValue, isLoading, openWithMessage, handleSendMessage]);
  
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      promptsContainerRef.current && 
      !promptsContainerRef.current.contains(event.target as Node)
    ) {
      setShowPrompts(false);
    }
    if (chartsContainerRef.current && !chartsContainerRef.current.contains(event.target as Node)) {
      setShowChartsMenu(false);
    }
  }, []);

  // Add event listener for clicking outside
  useEffect(() => {
    if (showPrompts) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrompts, handleClickOutside]);

  const togglePrompts = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowPromptsMenu(!showPromptsMenu);
    setShowPrompts(true); // Always show the prompts Paper when menu is toggled
    // Close agent capabilities when showing prompts
    if (!showPromptsMenu) {
      setAgentCapabilitiesVisible(false);
      setShowChartsMenu(false);
    }
  }, [showPromptsMenu]);
  
  const handlePromptClick = useCallback((prompt: string, agent: string) => {
    setInputValue(prompt);
    setSelectedAgent(agent);
    setShowPrompts(false);
    // Close the agent capabilities panel (question modal) when a prompt is selected
    setAgentCapabilitiesVisible(false);
    
    // Immediately send the message after selecting the prompt
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  const toggleAgentSwitcher = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAgentMenuAnchor(event.currentTarget);
  }, []);
  
  const handleAgentMenuClose = useCallback(() => {
    setAgentMenuAnchor(null);
  }, []);
  
  const handleAgentSelect = useCallback((agentId: string) => {
    const previous = selectedAgent;
    setSelectedAgent(agentId);
    handleAgentMenuClose();
    
    // Notify parent component of agent change
    if (onAgentChange) {
      onAgentChange(agentId);
    }
    
    // Only show animation if agent is actually changing
    if (previous !== agentId) {
      // Trigger initializing animation
      setShowInitAnimation(true);
      
      // Hide animation after delay - refined timing
      setTimeout(() => {
        setShowInitAnimation(false);
      }, 1200);
    }
  }, [selectedAgent, onAgentChange, handleAgentMenuClose]);
  
  const toggleAgentCapabilities = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAgentCapabilitiesVisible(!agentCapabilitiesVisible);
    
    // Close prompts when showing capabilities
    if (!agentCapabilitiesVisible) {
      setShowPrompts(false);
    }
  }, [agentCapabilitiesVisible]);

  // Filter prompts by agent
  const filteredPromptsByAgent = useCallback((agentId: string) => {
    return predefinedPrompts.filter(prompt => prompt.agent === agentId);
  }, []);

  // Initialize the agent effect on first render
  useEffect(() => {
    // Show initial animation when component mounts, with a slight delay
    setTimeout(() => {
      setShowInitAnimation(true);
      
      // Hide animation after delay
      setTimeout(() => {
        setShowInitAnimation(false);
      }, 1200);
    }, 300); // Slight delay before starting initial animation
  }, []);

  // Update input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setTokenCount(ChatInputTokenEstimate(value));
    setIsTyping(true);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setIsTyping(false), 1000);

    setShowSuggestions(value.length > 0 && filteredPrompts.length > 0);
    setHighlightedIndex(0);
  }, [filteredPrompts.length]);

  // Update local selectedAgent when activeAgent prop changes
  useEffect(() => {
    if (activeAgent && activeAgent !== selectedAgent) {
      setSelectedAgent(activeAgent);
    }
  }, [activeAgent, selectedAgent]);

  // Chart types array
  const chartTypes = ['bar','stackedBar','line','area','pie','geo','horizontalBar'];

  // Debounce classify input when router simulation mode is on
  useEffect(() => {
    if (!routerSimulationMode) {
      setRoutingAgent(null);
      setIsRoutingDetecting(false);
      return;
    }
    if (!inputValue.trim()) {
      setRoutingAgent(null);
      setIsRoutingDetecting(false);
      return;
    }
    setIsRoutingDetecting(true);
    const t = setTimeout(() => {
      const agents = classifyAndRoute(inputValue.trim());
      setRoutingAgent(agents[0] || null);
      setIsRoutingDetecting(false);
      // Dispatch a dummy router trace so debug UI shows something when backend absent
      if (agents[0]) {
        const now = Date.now();
        dispatch(routerTraceReceived({
          id: `local-${now}`,
          sessionId: 'local',
          query: inputValue.trim(),
          timestamp: new Date().toISOString(),
          totalLatency: 0,
          finalAgent: agents[0],
          finalConfidence: 1,
          steps: [
            {
              id: `step-${now}`,
              timestamp: new Date().toISOString(),
              step: 'local-classify',
              agent: agents[0],
              confidence: 1,
              intent: 'demo',
              method: 'regex',
              latency_ms: 0,
            },
          ],
          success: true,
        }));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [inputValue, routerSimulationMode, dispatch]);

  // Ensure inputRef is defined
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!routerSimulationMode) return;
    if (!isRoutingDetecting) return;
    // Fallback: ensure spinner clears after 2 seconds
    const safety = setTimeout(() => setIsRoutingDetecting(false), 2000);
    return () => clearTimeout(safety);
  }, [isRoutingDetecting, routerSimulationMode]);

  // Add new function after handleAgentSelect
  const handleAgentClickInRouting = (agentId: string) => {
    if (onToggleRouterSimulation) {
      onToggleRouterSimulation(); // Turn off router simulation mode
    }
    handleAgentSelect(agentId);
  };

  // Declare as a function (hoisted) to ensure it is defined before any
  // references (e.g. dependency arrays) are evaluated at runtime.
  function handleChartCommand(text: string) {
    // Parse chart command format: /chart [type] [data]
    const parts = text.split(' ');
    if (parts.length < 2) return null;

    const chartData = parts.slice(2).join(' ');

    // Get chart config based on the prompt
    const chartConfig = getChartConfigForPrompt(chartData);
    if (!chartConfig) return null;

    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <ChartFactory
          type={chartConfig.type}
          options={chartConfig.options}
          series={chartConfig.series}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      maxWidth: { xs: '100%', sm: 600, md: 720 },
      mx: 'auto',
      px: { xs: 1, sm: 2 },
    }}>
      {/* Agent capability display */}
      <Collapse in={agentCapabilitiesVisible}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
            border: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            overflowY: 'hidden'
          }}
        >
          <Box display="flex" alignItems="center" mb={1.5} gap={1}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: currentAgent.color,
                color: '#fff',
                boxShadow: '0 0 0 4px #fff', // Optional: white outline for contrast
                mr: 1,
                fontSize: 22,
                fontWeight: 700,
                transition: 'background 0.2s',
              }}
              variant="circular"
            >
              {currentAgent.icon}
            </Avatar>
            <Typography variant="subtitle1" fontWeight={500}>
              {currentAgent.name}
            </Typography>
            <Chip 
              label={currentAgent.emoji} 
              size="small"
              sx={{ height: 24, minWidth: 32 }}
            />
            <Box flexGrow={1} />
            <IconButton size="small" onClick={toggleAgentCapabilities}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {currentAgent.description}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mt: 1.5, mb: 0.5 }}>
            CAPABILITIES
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
            {currentAgent.capabilities.map((capability, index) => (
              <Chip
                key={index}
                label={capability}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: currentAgent.color + '40',
                  color: mode === 'dark' ? currentAgent.color + 'dd' : currentAgent.color,
                  bgcolor: currentAgent.color + '08',
                  fontWeight: 400,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>
          
          <Box mt={1.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mb: 0.5 }}>
              EXAMPLE PROMPTS
            </Typography>
            <List dense disablePadding>
              {filteredPromptsByAgent(currentAgent.id).slice(0, 5).map((prompt, idx) => (
                <ListItem key={idx} disablePadding dense sx={{ py: 0.25 }}>
                  <ListItemButton
                    sx={{ 
                      py: 0.5, 
                      px: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      }
                    }}
                    onClick={() => handlePromptClick(prompt.text, prompt.agent)}
                  >
                    <ListItemText 
                      primary={prompt.text} 
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontSize: '0.8rem',
                        noWrap: true
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
      </Collapse>
      
      {/* Agent initializing animation overlay - REMOVED */}
      
      {/* Form with input field */}
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ position: 'relative' }}
      >
        {/* Prompts dropdown positioned above the input field */}
        {(showPrompts || showPromptsMenu) && (
          <Paper
            ref={promptsContainerRef}
            elevation={3}
            sx={{
              position: 'absolute',
              zIndex: 100,
              left: 0,
              right: 0,
              top: '64px',
              width: '100%',
              maxHeight: 'calc(50vh - 64px)',
              overflowY: 'auto',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              p: 2,
              mb: 1,
              backdropFilter: 'blur(14px)',
              background: mode === 'dark' ? 'rgba(30,30,30,0.75)' : 'rgba(255,255,255,0.65)',
              border: '1px solid',
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
              borderRadius: '12px 12px 0 0',
              animation: 'slideUp 0.25s ease-out',
              '@keyframes slideUp': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1">Example Prompts</Typography>
              <IconButton size="small" onClick={() => setShowPrompts(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {/* Group prompts by agent */}
            {agents.map((agent) => (
              <Box key={agent.id} mb={2}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: agent.color + '10',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: agent.color,
                      color: 'white',
                      mr: 1,
                      fontSize: '0.8rem'
                    }}
                  >
                    {agent.icon}
                  </Avatar>
                  <Typography variant="subtitle2">{agent.name}</Typography>
                </Box>
                
                <List disablePadding>
                  {filteredPromptsByAgent(agent.id).slice(0, 5).map((prompt, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton
                        onClick={() => handlePromptClick(prompt.text, prompt.agent)}
                        sx={{
                          py: 1,
                          px: 2,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: mode === 'dark' 
                              ? 'rgba(255,255,255,0.05)' 
                              : 'rgba(0,0,0,0.04)',
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {prompt.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={prompt.text} 
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Paper>
        )}
        
        {/* Agent switcher menu */}
        <AgentMenu 
          anchorEl={agentMenuAnchor}
          open={Boolean(agentMenuAnchor)}
          onClose={handleAgentMenuClose}
          agents={agents}
          selectedAgent={selectedAgent}
          onSelect={handleAgentSelect}
          darkMode={mode === 'dark'}
        />
        
        {/* The main input field with token counter wrapper */}
        <Box sx={{ position:'relative' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={getContextualPlaceholder()}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          disabled={isLoading || showInitAnimation}
          multiline
          maxRows={4}
          inputRef={inputRef}
          aria-label={`Message input for ${currentAgent.name}`}
          aria-describedby="input-help-text"
          aria-expanded={showSuggestions}
          aria-haspopup={showSuggestions ? "listbox" : undefined}
          role="combobox"
          autoComplete="off"
          sx={{ 
            '--agent-color-rgb': currentAgent.color.startsWith('#') 
              ? `${parseInt(currentAgent.color.slice(1, 3), 16)}, ${parseInt(currentAgent.color.slice(3, 5), 16)}, ${parseInt(currentAgent.color.slice(5, 7), 16)}`
              : '198, 12, 48', // barnRed enterprise color
            '& .MuiOutlinedInput-root': { 
              borderRadius: 3,
              backgroundColor: mode === 'dark' 
                ? 'rgba(244, 246, 248, 0.02)' // assistantGray subtle background
                : 'rgba(248, 249, 250, 0.8)', // Light assistantGray
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: mode === 'dark'
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(198, 12, 48, 0.08)', // barnRed shadow
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '& fieldset': {
                borderWidth: '1px',
                borderColor: mode === 'dark'
                  ? 'rgba(244, 246, 248, 0.15)' // assistantGray border
                  : 'rgba(198, 12, 48, 0.2)', // barnRed border
              },
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: mode === 'dark'
                  ? '0 6px 16px rgba(0, 0, 0, 0.4)'
                  : '0 4px 12px rgba(198, 12, 48, 0.12)',
                '& fieldset': {
                  borderColor: mode === 'dark' 
                    ? 'rgba(244, 246, 248, 0.25)' 
                    : 'rgba(198, 12, 48, 0.4)',
                }
              },
              '&.Mui-focused': {
                transform: 'translateY(-2px)',
                boxShadow: mode === 'dark'
                  ? '0 8px 20px rgba(0, 0, 0, 0.5)'
                  : '0 6px 16px rgba(198, 12, 48, 0.15)',
                '& fieldset': {
                  borderColor: mode === 'dark' 
                    ? '#F4F6F8' // assistantGray focused
                    : '#C60C30', // barnRed focused
                  borderWidth: '2px',
                }
              },
            },
            '& .MuiOutlinedInput-input': {
              color: mode === 'dark' ? '#FFFFFF' : '#1A1A1A',
              fontWeight: 500,
              fontSize: '0.95rem',
              '&::placeholder': {
                color: mode === 'dark' 
                  ? 'rgba(244, 246, 248, 0.6)' // assistantGray placeholder
                  : 'rgba(198, 12, 48, 0.7)', // barnRed placeholder
                opacity: 1,
                fontStyle: isLoading || showInitAnimation ? 'italic' : 'normal',
                fontWeight: 400,
                animation: showInitAnimation ? `${placeholderFade} 1.5s infinite ease-in-out` : 'none',
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Tooltip title={
                  showInitAnimation 
                    ? `Initializing ${routerSimulationMode ? 'AI Agent' : currentAgent.name}...` 
                    : routerSimulationMode 
                      ? 'Auto-routing active - I\'ll pick the best agent' 
                      : `Switch agent (current: ${currentAgent.name})`
                }>
                  <Box
                    onClick={!showInitAnimation && !routerSimulationMode ? toggleAgentSwitcher : undefined}
                    sx={{
                      cursor: showInitAnimation || routerSimulationMode ? 'default' : 'pointer',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1,
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      ...(showInitAnimation ? {
                        animation: `${pulseGlow} 2s infinite`,
                      } : !routerSimulationMode ? {
                        '&:hover': {
                          transform: 'scale(1.1) rotate(3deg)',
                        },
                        '&:active': {
                          transform: 'scale(0.95)',
                        },
                      } : {}),
                      ...(currentAgent.id === 'lease' && !showInitAnimation && !routerSimulationMode && {
                        animation: `${pulseGlow} 3s infinite`,
                      }),
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        height: 30,
                        width: 30,
                        borderRadius: '8px',
                        background: mode === 'dark'
                          ? routerSimulationMode
                            ? `linear-gradient(135deg, #1976d2 0%, #1565c0 100%)` // Blue gradient for AI
                            : `linear-gradient(135deg, ${currentAgent.color}40 0%, ${currentAgent.color}70 100%)`
                          : routerSimulationMode
                            ? `linear-gradient(135deg, #1976d2 0%, #1565c0 100%)` // Blue gradient for AI
                            : `linear-gradient(135deg, #C60C30 0%, #A50D24 100%)`, // barnRed gradient
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: showInitAnimation 
                          ? routerSimulationMode
                            ? `0 0 12px #1976d250, 0 0 20px #1976d220` // Blue glow for AI
                            : `0 0 12px ${currentAgent.color}50, 0 0 20px ${currentAgent.color}20`
                          : mode === 'dark'
                            ? routerSimulationMode
                              ? `0 0 8px rgba(25, 118, 210, 0.4), 0 0 16px rgba(25, 118, 210, 0.2)` // Blue glow for AI
                              : `0 0 8px rgba(244, 246, 248, 0.3), 0 0 16px rgba(244, 246, 248, 0.1)` // assistantGray glow
                            : routerSimulationMode
                              ? `0 0 8px rgba(25, 118, 210, 0.4), 0 0 16px rgba(25, 118, 210, 0.2)` // Blue glow for AI
                              : `0 0 8px rgba(198, 12, 48, 0.4), 0 0 16px rgba(198, 12, 48, 0.2)`, // barnRed glow
                        border: '2px solid',
                        borderColor: mode === 'dark' 
                          ? routerSimulationMode
                            ? 'rgba(25, 118, 210, 0.3)' // Blue border for AI
                            : 'rgba(244, 246, 248, 0.2)' // assistantGray border
                          : routerSimulationMode
                            ? 'rgba(25, 118, 210, 0.3)' // Blue border for AI
                            : 'rgba(255, 255, 255, 0.8)',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.2) 60%, transparent 70%)`,
                          backgroundSize: '200% 200%',
                          animation: showInitAnimation 
                            ? 'shimmer 2s infinite linear'
                            : 'shimmer 4s infinite linear',
                          opacity: 0.8,
                        },
                        '@keyframes shimmer': {
                          '0%': { backgroundPosition: '200% 0' },
                          '100%': { backgroundPosition: '-200% 0' },
                        },
                        // Add typing animation to the agent emoji
                        ...(isTyping && {
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -1,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '30%',
                            height: 1,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            animation: `${typingAnimation} 1s infinite`,
                          }
                        })
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: 'white',
                          textShadow: '0 0 3px rgba(0,0,0,0.2)',
                          // Add subtle animation to emoji when typing or initializing
                          animation: showInitAnimation 
                            ? `${typingAnimation} 1s infinite`
                            : isTyping 
                              ? `${typingAnimation} 1.2s infinite` 
                              : 'none',
                        }}
                      >
                        {routerSimulationMode ? '🤖' : currentAgent.emoji}
                      </Typography>
                    </Box>
                    
                    {/* Pulsing ring indicator */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: showInitAnimation 
                          ? theme.palette.warning.main
                          : isTyping 
                            ? theme.palette.success.main 
                            : routerSimulationMode 
                              ? theme.palette.primary.main
                              : currentAgent.color,
                        border: '1px solid',
                        borderColor: mode === 'dark' ? '#1c1c1c' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.4s ease',
                        ...(showInitAnimation && {
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 0.6 },
                            '50%': { opacity: 1 },
                            '100%': { opacity: 0.6 },
                          }
                        })
                      }}
                    >
                      <Box sx={{ 
                        fontSize: '0.35rem', 
                        color: '#fff',
                        lineHeight: 1,
                        opacity: 1
                      }}>
                        {routerSimulationMode ? <AutoMode sx={{ fontSize: '0.35rem' }} /> : currentAgent.icon}
                      </Box>
                    </Box>
                  </Box>
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isLoading && (
                  <Tooltip title="Stop generation">
                    <IconButton
                      onClick={onStopRequest}
                      size="medium"
                      sx={{
                        mr: 1,
                        px: 1.5,
                        height: 32,
                        borderRadius: 2,
                        backgroundColor: '#fff',
                        color: '#C8102E',
                        border: '2px solid #C8102E',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        '&:hover': {
                          backgroundColor: '#FFEDEE',
                        },
                      }}
                    >
                      STOP
                    </IconButton>
                  </Tooltip>
                )}
                {showInitAnimation && (
                  <Tooltip title={`Initializing ${currentAgent.name}`}>
                    <AutorenewIcon 
                      fontSize="small"
                      sx={{ 
                        mr: 1,
                        color: currentAgent.color,
                        opacity: 0.6,
                        animation: 'spin 2s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    />
                  </Tooltip>
                )}
                {/* Sophisticated AI-oriented feature buttons */}
                {!isLoading && !showInitAnimation && (
                  <>
                    {/* Router Simulation Toggle */}
                    <Tooltip title={routerSimulationMode ? "Auto-routing active - I'll pick the best agent" : "Manual mode - using selected agent"}>
                      <IconButton
                        onClick={onToggleRouterSimulation}
                        size="small"
                        sx={{
                          mr: 0.5,
                          width: 32,
                          height: 32,
                          color: routerSimulationMode ? 'primary.main' : 'text.secondary',
                          backgroundColor: routerSimulationMode ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                          border: '1px solid',
                          borderColor: routerSimulationMode ? 'primary.main' : 'divider',
                          borderRadius: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: routerSimulationMode ? 'rgba(25, 118, 210, 0.16)' : 'rgba(0, 0, 0, 0.04)',
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <AutoMode fontSize="small" sx={{ fontSize: '1rem' }} color={routerSimulationMode ? 'primary' : 'inherit'} />
                      </IconButton>
                    </Tooltip>

                    {/* Example Prompts Button */}
                    <Tooltip title="Example prompts for current agent">
                      <IconButton
                        onClick={togglePrompts}
                        size="small"
                        sx={{
                          mr: 0.5,
                          width: 32,
                          height: 32,
                          color: showPromptsMenu ? 'secondary.main' : 'text.secondary',
                          backgroundColor: showPromptsMenu ? 'rgba(156, 39, 176, 0.08)' : 'transparent',
                          border: '1px solid',
                          borderColor: showPromptsMenu ? 'secondary.main' : 'divider',
                          borderRadius: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: showPromptsMenu ? 'rgba(156, 39, 176, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <LightbulbOutlinedIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>

                    {/* Agent Capabilities Button */}
                    <Tooltip title="View agent capabilities">
                      <IconButton
                        onClick={toggleAgentCapabilities}
                        size="small"
                        sx={{
                          mr: 1,
                          width: 32,
                          height: 32,
                          color: agentCapabilitiesVisible ? 'success.main' : 'text.secondary',
                          backgroundColor: agentCapabilitiesVisible ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                          border: '1px solid',
                          borderColor: agentCapabilitiesVisible ? 'success.main' : 'divider',
                          borderRadius: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: agentCapabilitiesVisible ? 'rgba(46, 125, 50, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <PsychologyIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                
                <IconButton 
                  type="submit" 
                  disabled={isLoading || showInitAnimation || inputValue.trim() === ''}
                  sx={{
                    bgcolor: mode === 'dark' 
                      ? 'rgba(244, 246, 248, 0.1)' // assistantGray background
                      : '#C60C30', // barnRed background
                    color: mode === 'dark' 
                      ? '#F4F6F8' // assistantGray text
                      : 'white',
                    border: '2px solid',
                    borderColor: mode === 'dark' 
                      ? 'rgba(244, 246, 248, 0.2)' // assistantGray border
                      : '#C60C30', // barnRed border
                    borderRadius: 2,
                    width: 44,
                    height: 44,
                    opacity: showInitAnimation ? 0.5 : 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: isLoading ? 'spin 2s linear infinite' : 'none',
                    '&:hover': {
                      bgcolor: mode === 'dark' 
                        ? 'rgba(244, 246, 248, 0.15)'
                        : '#A50D24', // darker barnRed
                      transform: 'scale(1.05)',
                      boxShadow: mode === 'dark'
                        ? '0 4px 12px rgba(244, 246, 248, 0.2)'
                        : '0 4px 12px rgba(198, 12, 48, 0.3)',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    '&:disabled': {
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                      color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    },
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                >
                  {isLoading ? <AutorenewIcon /> : <SendIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        {/* Hidden accessibility helper text */}
        <Typography 
          id="input-help-text" 
          variant="caption" 
          sx={{ 
            position: 'absolute', 
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        >
          Type your message and press Enter to send. Use arrow keys to navigate suggestions.
        </Typography>
        
        {/* Token counter – hidden per design update */}
        <Typography variant="caption" sx={{ display:'none' }}>
          {tokenCount} tokens
        </Typography>
        </Box>
      </Box>

      {/* Sophisticated Example Prompts Menu */}
      {showPromptsMenu && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            zIndex: 100,
            left: 0,
            right: 0,
            bottom: '100%',
            width: '100%',
            maxHeight: '40vh',
            overflowY: 'auto',
            mb: 1,
            borderRadius: 3,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: mode === 'dark'
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  size="small"
                  onClick={() => setShowPromptsMenu(false)}
                  sx={{ mr: 1 }}
                  aria-label="Back to agent list"
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <LightbulbOutlinedIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="600">
                  {routerSimulationMode ? 'Example Prompts - AI will route to best agent' : `Example Prompts for ${currentAgent.name}`}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setShowPromptsMenu(false)}
                sx={{ color: 'text.secondary' }}
                aria-label="Close prompts"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {routerSimulationMode ? (
              <>
                <Typography variant="subtitle2" mb={1} fontWeight="600">
                  Available Specialist Agents:
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {agents.map((agent, idx) => (
                    <Box 
                      key={idx} 
                      display="flex" 
                      alignItems="center" 
                      gap={1}
                      onClick={() => handleAgentClickInRouting(agent.id)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          background: `linear-gradient(135deg, ${agent.color} 0%, ${agent.color}CC 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          color: 'white'
                        }}
                      >
                        {agent.emoji}
                      </Box>
                      <Typography variant="body2" fontWeight="500">
                        {agent.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {agent.capabilities.slice(0, 2).join(', ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              // Show prompts only for selected agent when manual selection
              <List dense>
                {filteredPromptsByAgent(selectedAgent).slice(0, 5).map((prompt, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setInputValue(prompt.text);
                        setShowPromptsMenu(false);
                        // Do NOT send automatically; user must hit enter/send
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {prompt.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={prompt.text}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          lineHeight: 1.4,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {filteredPromptsByAgent(selectedAgent).length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="No example prompts available for this agent"
                      secondary="Try typing your own question"
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Box>
        </Paper>
      )}

      {/* Router Simulation Indicator */}
      {routerSimulationMode && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: 8,
            zIndex: 50,
          }}
        >
          <Chip
            icon={isRoutingDetecting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <CheckIcon fontSize="small" />
            )}
            label={isRoutingDetecting
              ? `🤖 Routing to: ${routingAgent || '…'}`
              : routingAgent
                ? `🤖 Routing to: ${routingAgent}`
                : '🤖 Routing enabled'}
            size="small"
            sx={{
              bgcolor: '#FFEDEE',
              color: '#C8102E',
              border: '2px solid #C8102E',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: 600,
              px: 1,
              height: 24,
            }}
          />
        </Box>
      )}

      {showChartsMenu && (
        <Paper
          ref={chartsContainerRef}
          elevation={3}
          sx={{
            position:'absolute',zIndex:100,left:0,right:0,bottom:'100%',width:'100%',maxHeight:'30vh',overflowY:'auto',p:2,mb:1,
            background: mode==='dark'? 'rgba(30,30,30,0.75)':'rgba(255,255,255,0.75)',
            border:'1px solid',borderColor: mode==='dark'?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)',borderRadius:2
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1">Insert Demo Chart (for demo purpose only)</Typography>
            <IconButton size="small" onClick={()=>setShowChartsMenu(false)}><CloseIcon fontSize="small"/></IconButton>
          </Box>
          <List dense>
            {chartTypes.map(ct=>(
              <ListItem key={ct} disablePadding>
                <ListItemButton onClick={()=>{
                  openWithMessage({ id:`chart-${Date.now()}`, text:`#chart:${ct}`, sender:'system', timestamp:new Date().toISOString()});
                  setShowChartsMenu(false);
                }}>
                  <ListItemIcon><BarChartIcon fontSize="small"/></ListItemIcon>
                  <ListItemText primary={ct} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {showSuggestions && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            zIndex: 100,
            left: 0,
            right: 0,
            bottom: '100%',
            width: '100%',
            maxHeight: 240,
            overflowY: 'auto',
            mb: 1,
            borderRadius: '12px 12px 0 0',
            background: mode === 'dark'
              ? 'rgba(30, 30, 30, 0.50)'
              : 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid',
            borderColor: mode === 'dark'
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(0,0,0,0.08)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          role="listbox"
        >
          <List>
            {allSuggestions.length === 0 && (
              <ListItemButton disabled>
                <ListItemText primary="No suggestions" />
              </ListItemButton>
            )}
            {allSuggestions.map((suggestion, idx) => (
              <ListItemButton
                key={suggestion.text + (suggestion.isRecent ? '-recent' : '')}
                selected={idx === highlightedIndex}
                onClick={() => handleSuggestionSelect(suggestion.text)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                role="option"
                aria-selected={idx === highlightedIndex}
              >
                <ListItemIcon>{suggestion.icon}</ListItemIcon>
                <ListItemText
                  primary={highlightMatch(suggestion.text, inputValue)}
                  secondary={suggestion.isRecent ? 'Recent' : undefined}
                  secondaryTypographyProps={{ fontSize: '0.7rem', color: mode === 'dark' ? '#aaa' : '#888' }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default React.memo(AgentDrivenChatInput);