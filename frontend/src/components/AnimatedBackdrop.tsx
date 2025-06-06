import React, { useCallback } from 'react';
// @ts-ignore
import Particles from 'react-tsparticles';
// @ts-ignore
import { loadFull } from 'tsparticles';
import { useTheme } from '@mui/material';

const AnimatedBackdrop: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const lineColor = isDark ? '#ff6f3c' : '#c8102e';

  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="login-bg-particles"
      init={particlesInit}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      options={{
        fullScreen: { enable: false },
        fpsLimit: 60,
        background: { color: { value: 'transparent' } },
        particles: {
          number: { value: 60, density: { enable: true, area: 800 } },
          color: { value: lineColor },
          opacity: { value: 0.45 },
          size: { value: 2 },
          links: {
            enable: true,
            color: lineColor,
            distance: 120,
            opacity: 0.35,
            width: 1,
          },
          move: { enable: true, speed: 0.8, outModes: { default: 'bounce' } },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'grab' },
            resize: true,
          },
          modes: {
            grab: { distance: 160, links: { opacity: 0.65 } },
            repulse: { distance: 100 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default AnimatedBackdrop; 