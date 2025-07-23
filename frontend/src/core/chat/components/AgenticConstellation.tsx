import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, alpha, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Import our revolutionary agentic components
import AgentConsciousnessOrb from './AgentConsciousnessOrb';
import NeuralPathwayNetwork from './NeuralPathwayNetwork';

interface Agent {
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

interface Connection {
  fromAgentId: string;
  toAgentId: string;
  type: 'collaboration' | 'data-flow' | 'dependency' | 'feedback';
  strength: number;
  isActive: boolean;
  direction: 'bidirectional' | 'unidirectional';
}

interface ConstellationLayout {
  pattern: 'circle' | 'spiral' | 'cluster' | 'neural-web' | 'dynamic';
  centerPoint: { x: number; y: number };
  radius: number;
  spacing: number;
}

export interface AgenticConstellationProps {
  agents: Agent[];
  connections?: Connection[];
  width: number;
  height: number;
  layout?: ConstellationLayout;
  onAgentClick?: (agent: Agent) => void;
  onAgentHover?: (agent: Agent | null) => void;
  onConnectionClick?: (connection: Connection) => void;
  showThinkingStreams?: boolean;
  showDataFlow?: boolean;
  interactive?: boolean;
  backgroundColor?: string;
}

const AgenticConstellation: React.FC<AgenticConstellationProps> = ({
  agents,
  connections = [],
  width,
  height,
  layout = {
    pattern: 'neural-web',
    centerPoint: { x: width / 2, y: height / 2 },
    radius: Math.min(width, height) * 0.3,
    spacing: 100
  },
  onAgentClick,
  onAgentHover,
  onConnectionClick,
  showThinkingStreams = true,
  showDataFlow = true,
  interactive = true,
  backgroundColor
}) => {
  const theme = useTheme();
  const [agentPositions, setAgentPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Calculate optimal agent positions based on layout pattern
  const calculatePositions = useCallback((agents: Agent[], layout: ConstellationLayout) => {
    const positions = new Map<string, { x: number; y: number }>();
    
    switch (layout.pattern) {
      case 'circle':
        agents.forEach((agent, index) => {
          const angle = (index / agents.length) * 2 * Math.PI;
          const x = layout.centerPoint.x + Math.cos(angle) * layout.radius;
          const y = layout.centerPoint.y + Math.sin(angle) * layout.radius;
          positions.set(agent.id, { x, y });
        });
        break;

      case 'spiral':
        agents.forEach((agent, index) => {
          const angle = index * 0.5;
          const radius = layout.radius * 0.3 + (index * layout.spacing / agents.length);
          const x = layout.centerPoint.x + Math.cos(angle) * radius;
          const y = layout.centerPoint.y + Math.sin(angle) * radius;
          positions.set(agent.id, { x, y });
        });
        break;

      case 'cluster':
        // Group agents by specialization
        const specializations = [...new Set(agents.map(a => a.specialization))];
        const clusterRadius = layout.radius / specializations.length;
        
        agents.forEach(agent => {
          const specIndex = specializations.indexOf(agent.specialization);
          const agentsInSpec = agents.filter(a => a.specialization === agent.specialization);
          const agentIndex = agentsInSpec.indexOf(agent);
          
          const clusterAngle = (specIndex / specializations.length) * 2 * Math.PI;
          const clusterCenterX = layout.centerPoint.x + Math.cos(clusterAngle) * layout.radius * 0.6;
          const clusterCenterY = layout.centerPoint.y + Math.sin(clusterAngle) * layout.radius * 0.6;
          
          const agentAngle = (agentIndex / agentsInSpec.length) * 2 * Math.PI;
          const x = clusterCenterX + Math.cos(agentAngle) * clusterRadius;
          const y = clusterCenterY + Math.sin(agentAngle) * clusterRadius;
          
          positions.set(agent.id, { x, y });
        });
        break;

      case 'neural-web':
        // Advanced neural network-like positioning based on connections
        const centralAgents = agents.filter(a => (a.connections?.length || 0) > 2);
        const peripheralAgents = agents.filter(a => (a.connections?.length || 0) <= 2);
        
        // Place central agents in inner circle
        centralAgents.forEach((agent, index) => {
          const angle = (index / centralAgents.length) * 2 * Math.PI;
          const x = layout.centerPoint.x + Math.cos(angle) * layout.radius * 0.4;
          const y = layout.centerPoint.y + Math.sin(angle) * layout.radius * 0.4;
          positions.set(agent.id, { x, y });
        });
        
        // Place peripheral agents in outer positions
        peripheralAgents.forEach((agent, index) => {
          const angle = (index / peripheralAgents.length) * 2 * Math.PI + 0.1;
          const radiusVariation = layout.radius * (0.7 + Math.random() * 0.3);
          const x = layout.centerPoint.x + Math.cos(angle) * radiusVariation;
          const y = layout.centerPoint.y + Math.sin(angle) * radiusVariation;
          positions.set(agent.id, { x, y });
        });
        break;

      case 'dynamic':
        // Dynamic positioning based on agent status and workload
        agents.forEach((agent, index) => {
          const statusWeight = {
            'idle': 0.2,
            'thinking': 0.5,
            'processing': 0.8,
            'responding': 0.9,
            'error': 0.1
          }[agent.status];
          
          const dynamicRadius = layout.radius * (0.3 + statusWeight * 0.5);
          const workloadAngle = agent.workload * 2 * Math.PI;
          const indexOffset = (index / agents.length) * 2 * Math.PI;
          
          const x = layout.centerPoint.x + Math.cos(workloadAngle + indexOffset) * dynamicRadius;
          const y = layout.centerPoint.y + Math.sin(workloadAngle + indexOffset) * dynamicRadius;
          positions.set(agent.id, { x, y });
        });
        break;
    }
    
    return positions;
  }, []);

  // Update positions when agents or layout changes
  useEffect(() => {
    const newPositions = calculatePositions(agents, layout);
    setAgentPositions(newPositions);
  }, [agents, layout, calculatePositions]);

  // Prepare agents with positions for rendering
  const agentsWithPositions = useMemo(() => {
    return agents.map(agent => ({
      ...agent,
      position: agentPositions.get(agent.id) || layout.centerPoint
    }));
  }, [agents, agentPositions, layout.centerPoint]);

  // Handle agent interactions
  const handleAgentClick = useCallback((agent: Agent) => {
    setSelectedAgent(agent.id === selectedAgent ? null : agent.id);
    onAgentClick?.(agent);
  }, [selectedAgent, onAgentClick]);

  const handleAgentHover = useCallback((agent: Agent | null) => {
    setHoveredAgent(agent?.id || null);
    onAgentHover?.(agent);
  }, [onAgentHover]);

  // Filter connections to only show active ones when no agent is selected
  const visibleConnections = useMemo(() => {
    if (selectedAgent) {
      // Show all connections for selected agent
      return connections.filter(conn => 
        conn.fromAgentId === selectedAgent || conn.toAgentId === selectedAgent
      );
    }
    
    if (hoveredAgent) {
      // Show connections for hovered agent
      return connections.filter(conn => 
        conn.fromAgentId === hoveredAgent || conn.toAgentId === hoveredAgent
      );
    }
    
    // Show all active connections
    return connections.filter(conn => conn.isActive);
  }, [connections, selectedAgent, hoveredAgent]);

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius: 2,
        background: backgroundColor || (
          theme.palette.mode === 'dark' 
            ? `radial-gradient(ellipse at center, ${alpha('#1a1a2e', 0.9)}, ${alpha('#000', 0.95)})`
            : `radial-gradient(ellipse at center, ${alpha('#f5f5f5', 0.95)}, ${alpha('#e0e0e0', 0.98)})`
        ),
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        // Subtle ambient glow effect
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.05)}, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
      {/* Background Neural Network Effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.1,
          backgroundImage: `
            radial-gradient(circle at 20% 20%, ${theme.palette.primary.main} 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main} 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, ${theme.palette.info.main} 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, ${theme.palette.success.main} 1px, transparent 1px)
          `,
          backgroundSize: '150px 150px, 200px 200px, 180px 180px, 160px 160px',
          animation: 'twinkle 8s ease-in-out infinite alternate',
          '@keyframes twinkle': {
            '0%': { opacity: 0.05 },
            '100%': { opacity: 0.15 }
          }
        }}
      />

      {/* Neural Pathway Network Layer */}
      <NeuralPathwayNetwork
        agents={agentsWithPositions}
        connections={visibleConnections}
        containerWidth={width}
        containerHeight={height}
        onConnectionClick={onConnectionClick}
        showDataFlow={showDataFlow}
        animationSpeed="normal"
        networkIntensity={0.8}
      />

      {/* Agent Consciousness Orbs Layer */}
      <AnimatePresence>
        {agentsWithPositions.map(agent => (
          <Box
            key={agent.id}
            sx={{
              position: 'absolute',
              left: agent.position.x - 50, // Center the orb (assuming ~100px width)
              top: agent.position.y - 50,  // Center the orb (assuming ~100px height)
              zIndex: selectedAgent === agent.id ? 1000 : (hoveredAgent === agent.id ? 900 : 800),
              transform: selectedAgent === agent.id 
                ? 'scale(1.2)' 
                : hoveredAgent === agent.id 
                ? 'scale(1.1)' 
                : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <AgentConsciousnessOrb
              agent={{
                id: agent.id,
                name: agent.name,
                status: agent.status,
                confidence: agent.confidence,
                currentTask: agent.currentTask,
                thinkingStream: agent.thinkingStream,
                specialization: agent.specialization,
                workload: agent.workload,
                connections: agent.connections,
                position: agent.position
              }}
              onClick={handleAgentClick}
              onHover={handleAgentHover}
              showThinkingStream={showThinkingStreams && (selectedAgent === agent.id || hoveredAgent === agent.id)}
              size="medium"
              interactive={interactive}
            />
          </Box>
        ))}
      </AnimatePresence>

      {/* Constellation Info Panel */}
      {(selectedAgent || hoveredAgent) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1100
          }}
        >
          <Paper
            sx={{
              p: 2,
              maxWidth: 300,
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
            }}
          >
            {(() => {
              const agent = agents.find(a => a.id === (selectedAgent || hoveredAgent));
              if (!agent) return null;
              
              return (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
                    {agent.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {agent.specialization}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    Status: {agent.status} | Confidence: {Math.round(agent.confidence * 100)}%
                  </Typography>
                  {agent.currentTask && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', fontSize: '0.8rem' }}>
                      Current: {agent.currentTask}
                    </Typography>
                  )}
                </Box>
              );
            })()}
          </Paper>
        </motion.div>
      )}
    </Box>
  );
};

export default AgenticConstellation;
