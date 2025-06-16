import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Box, alpha } from '@mui/material';

interface QuantumMessageProps {
  message: string;
  isStreaming: boolean;
  sentiment: number; // -1 to 1
  complexity: number; // 0 to 1
  importance: number; // 0 to 1
  children: React.ReactNode;
}

/**
 * Revolutionary quantum-inspired message visualization that adapts
 * visual properties based on message characteristics
 */
export const QuantumMessageContainer: React.FC<QuantumMessageProps> = ({
  message,
  isStreaming,
  sentiment,
  complexity,
  importance,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Quantum field effect based on message properties
  const fieldIntensity = useTransform(
    [mouseX, mouseY],
    (latest: number[]) => Math.sqrt((latest[0] || 0) * (latest[0] || 0) + (latest[1] || 0) * (latest[1] || 0)) * importance
  );

  // Dynamic color transformation based on sentiment and complexity
  const backgroundColor = useTransform(
    fieldIntensity,
    [0, 100],
    [
      `hsla(${sentiment > 0 ? 120 : 0}, ${Math.abs(sentiment) * 50}%, ${50 + complexity * 30}%, 0.1)`,
      `hsla(${sentiment > 0 ? 120 : 0}, ${Math.abs(sentiment) * 70}%, ${60 + complexity * 20}%, 0.3)`
    ]
  );

  // Particle system for high-importance messages
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }>>([]);

  useEffect(() => {
    if (importance > 0.7) {
      generateParticles();
    }
  }, [importance, message]);

  const generateParticles = () => {
    const newParticles = Array.from({ length: Math.floor(importance * 20) }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
    }));
    setParticles(newParticles);
  };

  // Neural network-inspired connection lines for complex messages
  const renderNeuralConnections = () => {
    if (complexity < 0.5) return null;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {Array.from({ length: Math.floor(complexity * 10) }, (_, i) => (
          <motion.path
            key={i}
            d={`M${Math.random() * 100},${Math.random() * 100} Q${Math.random() * 100},${Math.random() * 100} ${Math.random() * 100},${Math.random() * 100}`}
            stroke={`hsla(${180 + complexity * 60}, 70%, 60%, ${complexity * 0.3})`}
            strokeWidth={0.5}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: complexity * 0.5 }}
            transition={{ duration: 2 + Math.random() * 3, delay: i * 0.1 }}
          />
        ))}
      </svg>
    );
  };

  // Holographic shimmer effect for streaming messages
  const holographicShimmer = {
    background: isStreaming
      ? `linear-gradient(
          45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 70%
        )`
      : 'none',
    backgroundSize: '200% 200%',
    animation: isStreaming ? 'holographicShimmer 2s ease-in-out infinite' : 'none',
  };

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: 'relative',
        backdropFilter: `blur(${complexity * 10}px)`,
        border: `1px solid hsla(${sentiment > 0 ? 120 : 0}, ${Math.abs(sentiment) * 50}%, 50%, ${0.3 + importance * 0.4})`,
        borderRadius: `${8 + complexity * 12}px`,
        overflow: 'hidden',
        ...holographicShimmer,
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotateY: complexity > 0.7 ? [0, 5, 0] : 0,
      }}
      transition={{
        duration: 0.6,
        rotateY: { duration: 4, repeat: Infinity },
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 10px 30px hsla(${sentiment > 0 ? 120 : 0}, ${Math.abs(sentiment) * 50}%, 50%, ${0.2 + importance * 0.3})`,
      }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          mouseX.set(e.clientX - rect.left - rect.width / 2);
          mouseY.set(e.clientY - rect.top - rect.height / 2);
        }
      }}
    >
      {/* Quantum field visualization */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${mouseX}px ${mouseY}px, 
                      hsla(${180 + complexity * 120}, 70%, 70%, ${importance * 0.1}) 0%, 
                      transparent 50%)`,
          zIndex: 1,
        }}
      />

      {/* Neural connections for complex messages */}
      {renderNeuralConnections()}

      {/* Particle system for important messages */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: 2,
            height: 2,
            background: `hsla(${sentiment > 0 ? 120 : 0}, 70%, 70%, 0.8)`,
            borderRadius: '50%',
            zIndex: 2,
          }}
          animate={{
            x: particle.vx * 50,
            y: particle.vy * 50,
            opacity: [1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
      ))}

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 3, p: 2 }}>
        {children}
      </Box>

      {/* Glitch effect for error states */}
      {sentiment < -0.5 && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.1) 2px)',
            zIndex: 4,
            pointerEvents: 'none',
          }}
          animate={{
            x: [-2, 2, -1, 1, 0],
            opacity: [0, 0.3, 0, 0.2, 0],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      )}
    </motion.div>
  );
};

// Add holographic shimmer animation to global CSS
const holographicStyles = `
@keyframes holographicShimmer {
  0% { background-position: -200% -200%; }
  100% { background-position: 200% 200%; }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = holographicStyles;
  document.head.appendChild(styleSheet);
}
