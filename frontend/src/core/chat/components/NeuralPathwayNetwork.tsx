import React, { useState, useEffect, useMemo } from 'react';
import { Box, alpha, useTheme, keyframes } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  position: { x: number; y: number };
  status: 'idle' | 'thinking' | 'processing' | 'responding' | 'error';
  confidence: number;
  specialization: string;
}

interface Connection {
  fromAgentId: string;
  toAgentId: string;
  type: 'collaboration' | 'data-flow' | 'dependency' | 'feedback';
  strength: number; // 0-1
  isActive: boolean;
  direction: 'bidirectional' | 'unidirectional';
  dataPackets?: DataPacket[];
}

interface DataPacket {
  id: string;
  progress: number; // 0-1 along the path
  type: 'query' | 'response' | 'context' | 'decision';
  size: 'small' | 'medium' | 'large';
  color?: string;
}

export interface NeuralPathwayNetworkProps {
  agents: Agent[];
  connections: Connection[];
  containerWidth: number;
  containerHeight: number;
  onConnectionClick?: (connection: Connection) => void;
  showDataFlow?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  networkIntensity?: number; // 0-1, controls overall activity
}

// Keyframes for data packet animation
const dataFlowPulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const connectionPulse = keyframes`
  0% { stroke-width: 1; opacity: 0.4; }
  50% { stroke-width: 3; opacity: 0.8; }
  100% { stroke-width: 1; opacity: 0.4; }
`;

const NeuralPathwayNetwork: React.FC<NeuralPathwayNetworkProps> = ({
  agents,
  connections,
  containerWidth,
  containerHeight,
  onConnectionClick,
  showDataFlow = true,
  animationSpeed = 'normal',
  networkIntensity = 0.7
}) => {
  const theme = useTheme();
  const [dataPackets, setDataPackets] = useState<Map<string, DataPacket[]>>(new Map());

  // Animation speed configuration
  const speedConfig = {
    slow: 8000,
    normal: 5000,
    fast: 3000
  };

  // Create agent position lookup
  const agentPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    agents.forEach(agent => {
      positions.set(agent.id, agent.position);
    });
    return positions;
  }, [agents]);

  // Generate and animate data packets along connections
  useEffect(() => {
    if (!showDataFlow) return;

    const activeConnections = connections.filter(conn => conn.isActive);
    if (activeConnections.length === 0) return;

    const interval = setInterval(() => {
      const newPackets = new Map<string, DataPacket[]>();

      activeConnections.forEach(connection => {
        const connectionId = `${connection.fromAgentId}-${connection.toAgentId}`;
        
        // Generate data packets based on connection strength and network intensity
        const packetCount = Math.floor(connection.strength * networkIntensity * 3) + 1;
        const packets: DataPacket[] = [];

        for (let i = 0; i < packetCount; i++) {
          packets.push({
            id: `${connectionId}-${Date.now()}-${i}`,
            progress: Math.random() * 0.3, // Stagger starting positions
            type: ['query', 'response', 'context', 'decision'][Math.floor(Math.random() * 4)] as any,
            size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as any,
            color: getDataPacketColor(connection.type)
          });
        }

        newPackets.set(connectionId, packets);
      });

      setDataPackets(newPackets);
    }, speedConfig[animationSpeed] / 2);

    return () => clearInterval(interval);
  }, [connections, showDataFlow, animationSpeed, networkIntensity]);

  // Get connection color based on type
  const getConnectionColor = (type: Connection['type'], isActive: boolean) => {
    const colors = {
      'collaboration': theme.palette.primary.main,
      'data-flow': theme.palette.info.main,
      'dependency': theme.palette.warning.main,
      'feedback': theme.palette.success.main
    };
    
    const baseColor = colors[type];
    return isActive ? baseColor : alpha(baseColor, 0.3);
  };

  // Get data packet color based on connection type
  const getDataPacketColor = (type: Connection['type']) => {
    const colors = {
      'collaboration': '#FFD700', // Gold
      'data-flow': '#00E5FF',     // Cyan
      'dependency': '#FF9800',    // Orange
      'feedback': '#4CAF50'       // Green
    };
    return colors[type];
  };

  // Calculate path between two points
  const createPath = (from: { x: number; y: number }, to: { x: number; y: number }, connection: Connection) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Create curved path for more organic neural network appearance
    const midX = from.x + dx * 0.5;
    const midY = from.y + dy * 0.5;
    
    // Add curve offset based on connection strength
    const curveOffset = connection.strength * 30;
    const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * curveOffset;
    const perpY = dx / Math.sqrt(dx * dx + dy * dy) * curveOffset;
    
    return `M ${from.x} ${from.y} Q ${midX + perpX} ${midY + perpY} ${to.x} ${to.y}`;
  };

  // Get data packet position along path
  const getPacketPosition = (from: { x: number; y: number }, to: { x: number; y: number }, progress: number, connection: Connection) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Cubic bezier curve calculation for smooth movement
    const t = progress;
    const curveOffset = connection.strength * 30;
    const perpX = -dy / Math.sqrt(dx * dx + dy * dy) * curveOffset;
    const perpY = dx / Math.sqrt(dx * dx + dy * dy) * curveOffset;
    
    const midX = from.x + dx * 0.5 + perpX;
    const midY = from.y + dy * 0.5 + perpY;
    
    // Quadratic bezier curve position
    const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
    const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;
    
    return { x, y };
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        pointerEvents: 'none', // Allow clicks through to underlying components
        zIndex: 1, // Behind agent orbs but above background
      }}
    >
      <svg width={containerWidth} height={containerHeight} style={{ overflow: 'visible' }}>
        <defs>
          {/* Gradient definitions for connections */}
          {['collaboration', 'data-flow', 'dependency', 'feedback'].map(type => (
            <linearGradient key={type} id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={alpha(getConnectionColor(type as any, true), 0.8)} />
              <stop offset="50%" stopColor={getConnectionColor(type as any, true)} />
              <stop offset="100%" stopColor={alpha(getConnectionColor(type as any, true), 0.8)} />
            </linearGradient>
          ))}

          {/* Arrow markers for directional connections */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={theme.palette.primary.main}
              opacity="0.7"
            />
          </marker>
        </defs>

        {/* Render Neural Pathways */}
        <AnimatePresence>
          {connections.map(connection => {
            const fromPos = agentPositions.get(connection.fromAgentId);
            const toPos = agentPositions.get(connection.toAgentId);
            
            if (!fromPos || !toPos) return null;

            const pathData = createPath(fromPos, toPos, connection);
            const connectionId = `${connection.fromAgentId}-${connection.toAgentId}`;

            return (
              <g key={connectionId}>
                {/* Main connection path */}
                <motion.path
                  d={pathData}
                  stroke={`url(#gradient-${connection.type})`}
                  strokeWidth={1 + connection.strength * 2}
                  fill="none"
                  opacity={connection.isActive ? 0.6 + connection.strength * 0.4 : 0.2}
                  strokeDasharray={connection.isActive ? "none" : "5,5"}
                  markerEnd={connection.direction === 'unidirectional' ? "url(#arrowhead)" : "none"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: connection.isActive ? 0.6 + connection.strength * 0.4 : 0.2 
                  }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  style={{
                    animation: connection.isActive 
                      ? `${connectionPulse} ${speedConfig[animationSpeed]}ms ease-in-out infinite`
                      : 'none',
                    cursor: 'pointer',
                    pointerEvents: 'stroke'
                  }}
                  onClick={() => onConnectionClick?.(connection)}
                />

                {/* Data packets flowing along connections */}
                {showDataFlow && dataPackets.get(connectionId)?.map(packet => {
                  const packetPos = getPacketPosition(fromPos, toPos, packet.progress, connection);
                  const packetSizes = { small: 3, medium: 5, large: 7 };
                  
                  return (
                    <motion.circle
                      key={packet.id}
                      cx={packetPos.x}
                      cy={packetPos.y}
                      r={packetSizes[packet.size]}
                      fill={packet.color || getDataPacketColor(connection.type)}
                      opacity={0.8}
                      initial={{ opacity: 0, r: 0 }}
                      animate={{ 
                        opacity: 0.8, 
                        r: packetSizes[packet.size],
                        cx: packetPos.x,
                        cy: packetPos.y
                      }}
                      exit={{ opacity: 0, r: 0 }}
                      transition={{
                        duration: speedConfig[animationSpeed] / 1000,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "restart"
                      }}
                      style={{
                        filter: `drop-shadow(0 0 6px ${packet.color || getDataPacketColor(connection.type)})`,
                        animation: `${dataFlowPulse} 1s ease-in-out infinite`
                      }}
                    />
                  );
                })}
              </g>
            );
          })}
        </AnimatePresence>
      </svg>
    </Box>
  );
};

export default NeuralPathwayNetwork;
