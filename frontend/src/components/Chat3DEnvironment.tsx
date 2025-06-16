import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Box, Sphere, OrbitControls, Environment, Float } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';
import { preprocessMarkdown } from '../utils/preprocessMarkdown';

interface Message3DProps {
  content: string;
  position: [number, number, number];
  isUser: boolean;
  timestamp: Date;
  importance: number;
}

// Utility to strip markdown for 3D text rendering
function stripMarkdown(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italics
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // links
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/^#+\s+/gm, '') // headings
    .replace(/^-\s+/gm, '') // lists
    .replace(/\d+\.\s+/gm, '') // numbered lists
    .replace(/\n{2,}/g, '\n') // extra newlines
    .replace(/\|/g, ' ') // table pipes
    .replace(/\n/g, ' ') // flatten to single line for 3D
    .trim();
}

const Message3D: React.FC<Message3DProps> = ({ 
  content, 
  position, 
  isUser, 
  timestamp, 
  importance 
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  useFrame((state) => {
    if (meshRef.current) {
      // Dynamic floating based on importance
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * importance * 0.2;
      
      // Face camera for readability
      meshRef.current.lookAt(camera.position);
    }
  });

  const messageColor = useMemo(() => {
    const hue = isUser ? 45 : 120; // Amber for user, green for AI
    const saturation = 50 + importance * 50;
    const lightness = 50 + (hovered ? 20 : 0);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [isUser, importance, hovered]);

  return (
    <Float
      position={position}
      rotationIntensity={importance}
      floatIntensity={importance * 2}
      speed={1 + importance}
    >
      <group
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Message container */}
        <Box
          args={[Math.min(content.length * 0.1 + 2, 8), 1.5, 0.3]}
          material-color={messageColor}
          material-transparent
          material-opacity={0.8 + importance * 0.2}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={messageColor}
            transmission={0.1}
            roughness={0.1}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </Box>

        {/* Message text */}
        <Text
          position={[0, 0, 0.2]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={7}
          textAlign="center"
        >
          {stripMarkdown(preprocessMarkdown(content))}
        </Text>

        {/* Importance indicator */}
        {importance > 0.7 && (
          <Sphere args={[0.1]} position={[3, 0.5, 0]}>
            <meshBasicMaterial color="gold" />
          </Sphere>
        )}

        {/* Time visualization */}
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.15}
          color="#888"
          anchorX="center"
          anchorY="middle"
        >
          {timestamp.toLocaleTimeString()}
        </Text>
      </group>
    </Float>
  );
};

interface Chat3DEnvironmentProps {
  messages: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    importance: number;
  }>;
  onMessageClick?: (messageId: string) => void;
}

export const Chat3DEnvironment: React.FC<Chat3DEnvironmentProps> = ({ 
  messages, 
  onMessageClick 
}) => {
  const [viewMode, setViewMode] = useState<'spiral' | 'timeline' | 'constellation'>('spiral');

  const messagePositions = useMemo(() => {
    return messages.map((message, index) => {
      switch (viewMode) {
        case 'spiral':
          const angle = (index * 0.5) % (Math.PI * 2);
          const radius = 3 + index * 0.2;
          return [
            Math.cos(angle) * radius,
            index * 1.5 - messages.length * 0.75,
            Math.sin(angle) * radius,
          ] as [number, number, number];

        case 'timeline':
          return [
            message.isUser ? 4 : -4,
            index * 2 - messages.length,
            0,
          ] as [number, number, number];

        case 'constellation':
          return [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
          ] as [number, number, number];

        default:
          return [0, index * 2, 0] as [number, number, number];
      }
    });
  }, [messages, viewMode]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* View mode controls */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
      }}>
        {(['spiral', 'timeline', 'constellation'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '10px 15px',
              background: viewMode === mode ? '#007fff' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4080ff" />

        {/* Environment */}
        <Environment preset="night" />

        {/* Interactive controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={50}
          minDistance={2}
        />

        {/* Message clusters based on topics */}
        <group>
          {messages.map((message, index) => (
            <Message3D
              key={message.id}
              content={message.content}
              position={messagePositions[index]}
              isUser={message.isUser}
              timestamp={message.timestamp}
              importance={message.importance}
            />
          ))}
        </group>

        {/* Connection lines between related messages */}
        {viewMode === 'constellation' && (
          <group>
            {messages.map((message, index) => {
              if (index === 0) return null;
              const start = messagePositions[index - 1];
              const end = messagePositions[index];
              
              return (
                <line key={`connection-${index}`}>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      array={new Float32Array([...start, ...end])}
                      count={2}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#4080ff" opacity={0.3} transparent />
                </line>
              );
            })}
          </group>
        )}

        {/* Particle system for ambient effect */}
        <group>
          {Array.from({ length: 100 }, (_, i) => (
            <Sphere
              key={i}
              args={[0.01]}
              position={[
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
              ]}
            >
              <meshBasicMaterial color="#4080ff" opacity={0.5} transparent />
            </Sphere>
          ))}
        </group>
      </Canvas>
    </div>
  );
};
