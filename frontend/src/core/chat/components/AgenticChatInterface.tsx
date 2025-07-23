import React, { useState, useMemo, useCallback } from 'react';
import { Box, Paper, IconButton, Tooltip, Typography, Chip, alpha, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Visibility,
  VisibilityOff,
  AccountTree,
  Psychology,
  Speed,
  Fullscreen,
  FullscreenExit,
  Hub
} from '@mui/icons-material';

// Import our revolutionary agentic components
import AgenticConstellation from './AgenticConstellation';
import SpatialWorkflowCanvas from './SpatialWorkflowCanvas';
import RealTimeThinkingStream from './RealTimeThinkingStream';
import ChatInputSection from './ChatInputSection';

// Types
import type { ChatInterfaceProps } from './types';

interface AgenticAgent {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'processing' | 'responding' | 'error';
  confidence: number;
  specialization: string;
  workload: number;
  currentTask?: string;
  thinkingStream?: string[];
  position?: { x: number; y: number };
  connections?: string[];
}

interface AgenticConnection {
  fromAgentId: string;
  toAgentId: string;
  type: 'collaboration' | 'data-flow' | 'dependency' | 'feedback';
  strength: number;
  isActive: boolean;
  direction: 'bidirectional' | 'unidirectional';
}

interface ThoughtStream {
  agentId: string;
  thoughts: Array<{
    id: string;
    agentId: string;
    agentName: string;
    content: string;
    type: 'analysis' | 'decision' | 'question' | 'insight' | 'warning' | 'error';
    confidence: number;
    timestamp: Date;
    duration: number;
  }>;
  isActive: boolean;
  streamIntensity: number;
}

interface AgenticWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  steps: Array<{
    id: string;
    name: string;
    agentId: string;
    status: 'pending' | 'processing' | 'completed' | 'error' | 'paused';
    progress: number;
    estimatedTime: number;
    dependencies: string[];
    position: { x: number; y: number };
  }>;
  connections: Array<{
    fromStepId: string;
    toStepId: string;
    type: 'sequence' | 'parallel' | 'conditional' | 'feedback';
    isActive: boolean;
  }>;
}

export interface AgenticChatInterfaceProps extends Omit<ChatInterfaceProps, 'activeWorkflows'> {
  // Enhanced agentic props
  agents?: AgenticAgent[];
  connections?: AgenticConnection[];
  agenticWorkflows?: AgenticWorkflow[]; // Renamed to avoid conflict
  thinkingStreams?: ThoughtStream[];
  spatialLayout?: 'constellation' | 'neural-web' | 'workflow-canvas' | 'thinking-streams';
  showAgentConsciousness?: boolean;
  showNeuralNetwork?: boolean;
  showWorkflowCanvas?: boolean;
  showThinkingStreams?: boolean;
  immersiveMode?: boolean;
  // Integration props
  onStandardModeRequest?: () => void;
}

const AgenticChatInterface: React.FC<AgenticChatInterfaceProps> = ({
  onSendMessage,
  isLoading = false,
  messages = [],
  sessionId,
  enterpriseMode = false,
  currentAgent,
  // Agentic props
  agents = [],
  connections = [],
  agenticWorkflows = [], // Use renamed prop
  thinkingStreams = [],
  spatialLayout = 'constellation',
  showAgentConsciousness = true,
  showNeuralNetwork = true,
  showWorkflowCanvas = false,
  showThinkingStreams = true,
  immersiveMode = false,
  onStandardModeRequest
}) => {
  const theme = useTheme();
  
  // Local state for interface controls
  const [interfaceState, setInterfaceState] = useState({
    consciousnessVisible: showAgentConsciousness,
    neuralNetworkVisible: showNeuralNetwork,
    workflowCanvasVisible: showWorkflowCanvas,
    thinkingStreamsVisible: showThinkingStreams,
    isFullscreen: false,
    selectedAgent: null as string | null,
    activeMode: spatialLayout,
  });

  // Mock data for demonstration - in production this would come from props/API
  const mockAgents: AgenticAgent[] = useMemo(() => [
    {
      id: 'hr-agent',
      name: 'HR Specialist',
      status: 'thinking',
      confidence: 0.85,
      specialization: 'Human Resources',
      workload: 0.6,
      currentTask: 'Analyzing employee onboarding requirements',
      thinkingStream: [
        'Reviewing company policy requirements...',
        'Checking compliance standards...',
        'Generating onboarding checklist...',
      ],
      position: { x: 200, y: 150 },
      connections: ['legal-agent', 'analytics-agent']
    },
    {
      id: 'analytics-agent',
      name: 'Data Analyst',
      status: 'processing',
      confidence: 0.92,
      specialization: 'Data Analysis',
      workload: 0.8,
      currentTask: 'Processing quarterly performance metrics',
      thinkingStream: [
        'Aggregating performance data...',
        'Calculating trend analysis...',
        'Identifying key insights...',
      ],
      position: { x: 400, y: 200 },
      connections: ['hr-agent', 'finance-agent']
    },
    {
      id: 'finance-agent',
      name: 'Finance Expert',
      status: 'responding',
      confidence: 0.78,
      specialization: 'Financial Analysis',
      workload: 0.4,
      currentTask: 'Reviewing expense reports',
      position: { x: 350, y: 350 },
      connections: ['analytics-agent', 'legal-agent']
    },
    {
      id: 'legal-agent',
      name: 'Legal Advisor',
      status: 'idle',
      confidence: 0.95,
      specialization: 'Legal Compliance',
      workload: 0.2,
      position: { x: 150, y: 300 },
      connections: ['hr-agent', 'finance-agent']
    }
  ], []);

  const mockConnections: AgenticConnection[] = useMemo(() => [
    {
      fromAgentId: 'hr-agent',
      toAgentId: 'legal-agent',
      type: 'collaboration',
      strength: 0.8,
      isActive: true,
      direction: 'bidirectional'
    },
    {
      fromAgentId: 'analytics-agent',
      toAgentId: 'finance-agent',
      type: 'data-flow',
      strength: 0.9,
      isActive: true,
      direction: 'unidirectional'
    },
    {
      fromAgentId: 'hr-agent',
      toAgentId: 'analytics-agent',
      type: 'dependency',
      strength: 0.6,
      isActive: true,
      direction: 'bidirectional'
    }
  ], []);

  const mockThinkingStreams: ThoughtStream[] = useMemo(() => 
    mockAgents.filter(agent => agent.status !== 'idle').map(agent => ({
      agentId: agent.id,
      thoughts: agent.thinkingStream?.map((content, index) => ({
        id: `${agent.id}-thought-${index}`,
        agentId: agent.id,
        agentName: agent.name,
        content,
        type: ['analysis', 'decision', 'insight'][index % 3] as any,
        confidence: agent.confidence,
        timestamp: new Date(Date.now() - (index * 2000)),
        duration: 2000 + Math.random() * 3000
      })) || [],
      isActive: true,
      streamIntensity: agent.workload
    })), [mockAgents]);

  // Interface dimension calculations
  const interfaceWidth = window.innerWidth - 40;
  const interfaceHeight = window.innerHeight - 120;

  // Handle interface controls
  const toggleFeature = useCallback((feature: keyof typeof interfaceState) => {
    setInterfaceState(prev => ({
      ...prev,
      [feature]: !prev[feature as keyof typeof prev]
    }));
  }, []);

  const handleModeSwitch = useCallback((mode: 'constellation' | 'neural-web' | 'workflow-canvas' | 'thinking-streams') => {
    setInterfaceState(prev => ({ ...prev, activeMode: mode }));
  }, []);

  // Render the active spatial interface based on mode
  const renderSpatialInterface = () => {
    const baseProps = {
      width: interfaceWidth,
      height: interfaceHeight - 200, // Leave space for input section
    };

    switch (interfaceState.activeMode) {
      case 'constellation':
        return (
          <AgenticConstellation
            {...baseProps}
            agents={mockAgents}
            connections={mockConnections}
            layout={{
              pattern: 'neural-web',
              centerPoint: { x: baseProps.width / 2, y: baseProps.height / 2 },
              radius: Math.min(baseProps.width, baseProps.height) * 0.3,
              spacing: 100
            }}
            showThinkingStreams={interfaceState.thinkingStreamsVisible}
            showDataFlow={interfaceState.neuralNetworkVisible}
            interactive={true}
          />
        );

      case 'thinking-streams':
        return (
          <RealTimeThinkingStream
            {...baseProps}
            streams={mockThinkingStreams}
            layout="vertical"
            showConfidenceLevels={true}
            maxVisibleThoughts={5}
            animationSpeed="normal"
          />
        );

      case 'workflow-canvas':
        // Mock workflow for demonstration
        const mockWorkflow: AgenticWorkflow = {
          id: 'demo-workflow',
          name: 'Employee Onboarding',
          description: 'Comprehensive employee onboarding process',
          status: 'running',
          progress: 0.4,
          steps: [
            {
              id: 'step-1',
              name: 'HR Review',
              agentId: 'hr-agent',
              status: 'completed',
              progress: 1,
              estimatedTime: 30,
              dependencies: [],
              position: { x: 100, y: 150 }
            },
            {
              id: 'step-2',
              name: 'Legal Check',
              agentId: 'legal-agent',
              status: 'processing',
              progress: 0.6,
              estimatedTime: 45,
              dependencies: ['step-1'],
              position: { x: 300, y: 150 }
            },
            {
              id: 'step-3',
              name: 'Analytics Setup',
              agentId: 'analytics-agent',
              status: 'pending',
              progress: 0,
              estimatedTime: 60,
              dependencies: ['step-2'],
              position: { x: 500, y: 150 }
            }
          ],
          connections: [
            { fromStepId: 'step-1', toStepId: 'step-2', type: 'sequence', isActive: true },
            { fromStepId: 'step-2', toStepId: 'step-3', type: 'sequence', isActive: false }
          ]
        };

        return (
          <SpatialWorkflowCanvas
            {...baseProps}
            workflow={mockWorkflow}
            interactive={true}
            showMetrics={true}
            autoLayout={false}
          />
        );

      default:
        return renderConstellationInterface();
    }
  };

  const renderConstellationInterface = () => (
    <AgenticConstellation
      width={interfaceWidth}
      height={interfaceHeight - 200}
      agents={mockAgents}
      connections={mockConnections}
      layout={{
        pattern: 'neural-web',
        centerPoint: { x: interfaceWidth / 2, y: (interfaceHeight - 200) / 2 },
        radius: Math.min(interfaceWidth, interfaceHeight - 200) * 0.3,
        spacing: 100
      }}
      showThinkingStreams={interfaceState.thinkingStreamsVisible}
      showDataFlow={interfaceState.neuralNetworkVisible}
      interactive={true}
    />
  );

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: theme.palette.mode === 'dark'
          ? `radial-gradient(ellipse at center, ${alpha('#0d1421', 0.95)}, ${alpha('#000', 1)})`
          : `radial-gradient(ellipse at center, ${alpha('#f8fafc', 0.95)}, ${alpha('#e2e8f0', 1)})`,
        overflow: 'hidden',
      }}
    >
      {/* Agentic Interface Controls */}
      <Paper
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          p: 1,
          display: 'flex',
          gap: 0.5,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          zIndex: 1000,
        }}
      >
        <Tooltip title="Agent Constellation">
          <IconButton
            size="small"
            color={interfaceState.activeMode === 'constellation' ? 'primary' : 'default'}
            onClick={() => handleModeSwitch('constellation')}
          >
            <Hub />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Thinking Streams">
          <IconButton
            size="small"
            color={interfaceState.activeMode === 'thinking-streams' ? 'primary' : 'default'}
            onClick={() => handleModeSwitch('thinking-streams')}
          >
            <Psychology />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Workflow Canvas">
          <IconButton
            size="small"
            color={interfaceState.activeMode === 'workflow-canvas' ? 'primary' : 'default'}
            onClick={() => handleModeSwitch('workflow-canvas')}
          >
            <AccountTree />
          </IconButton>
        </Tooltip>

        <Box sx={{ width: 1, height: 32, bgcolor: 'divider', mx: 0.5 }} />
        
        <Tooltip title="Neural Network Visibility">
          <IconButton
            size="small"
            color={interfaceState.neuralNetworkVisible ? 'primary' : 'default'}
            onClick={() => toggleFeature('neuralNetworkVisible')}
          >
            {interfaceState.neuralNetworkVisible ? <Visibility /> : <VisibilityOff />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Thinking Streams Visibility">
          <IconButton
            size="small"
            color={interfaceState.thinkingStreamsVisible ? 'primary' : 'default'}
            onClick={() => toggleFeature('thinkingStreamsVisible')}
          >
            <Speed />
          </IconButton>
        </Tooltip>

        <Tooltip title="Fullscreen Toggle">
          <IconButton
            size="small"
            onClick={() => toggleFeature('isFullscreen')}
          >
            {interfaceState.isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Mode Indicator */}
      <Paper
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          p: 1.5,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Psychology sx={{ fontSize: 16, color: theme.palette.primary.main }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            Agentic Interface
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip 
            label={interfaceState.activeMode} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
          <Chip 
            label={`${mockAgents.filter(a => a.status !== 'idle').length} Active`}
            size="small" 
            color="success" 
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Box>
      </Paper>

      {/* Main Spatial Interface */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          p: 2,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={interfaceState.activeMode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', height: '100%' }}
          >
            {renderSpatialInterface()}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Enhanced Input Section */}
      <Box
        sx={{
          p: 2,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }}
      >
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <ChatInputSection
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            inputValue=""
            showSuggestions={true}
            currentAgent={currentAgent}
            enterpriseMode={enterpriseMode}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AgenticChatInterface;
