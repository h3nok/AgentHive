import React, { Suspense, useMemo, useCallback, memo, useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  useTheme, 
  Chip, 
  Stack, 
  Card, 
  CardContent,
  Skeleton,
  useMediaQuery,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Theme
} from '@mui/material';
import { motion, useScroll, useTransform, useInView, MotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SchemaIcon from '@mui/icons-material/Schema';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import CloudIcon from '@mui/icons-material/Cloud';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import GitHubIcon from '@mui/icons-material/GitHub';

// Import directly from the correct physical path
import { EmbeddedWidget } from '../../../../packages/ubiqora-ai-widget/ubiqora-ai-widget/src';
import { ComponentErrorBoundary } from '../../shared/components/ErrorBoundary';
import { useAppSelector, useAppDispatch, selectTheme, setTheme } from '../../shared/store';

// Lazy load components for performance
const LazyLogoText = React.lazy(() => import('../../shared/components/LogoText'));

// Types for better type safety
interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  agentId: string;
}

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  agentId: string;
  color: string;
}

interface AnimationVariant {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease: number[] };
}

// Constants with improved organization
const USE_CASES: UseCase[] = [
  {
    id: 'research-collaboration',
    title: 'Research & Development',
    description: 'Accelerate scientific discovery with AI agents that collaborate on research, analyze data patterns, and generate insights across interdisciplinary projects.',
    icon: <SchemaIcon fontSize="large" />,
    color: '#FF8F00',
    bgGradient: 'linear-gradient(135deg, rgba(255, 143, 0, 0.1) 0%, rgba(255, 143, 0, 0.05) 100%)',
    agentId: 'research'
  },
  {
    id: 'open-source-development',
    title: 'Open Source Projects',
    description: 'Manage community contributions, automate code reviews, and coordinate development efforts across distributed teams and repositories.',
    icon: <CodeIcon fontSize="large" />,
    color: '#FFA000',
    bgGradient: 'linear-gradient(135deg, rgba(255, 160, 0, 0.1) 0%, rgba(255, 160, 0, 0.05) 100%)',
    agentId: 'development'
  },
  {
    id: 'education-platform',
    title: 'Educational Systems',
    description: 'Create personalized learning experiences with AI tutors that adapt to individual needs and collaborate to enhance educational outcomes.',
    icon: <AccessTimeIcon fontSize="large" />,
    color: '#FFB300',
    bgGradient: 'linear-gradient(135deg, rgba(255, 179, 0, 0.1) 0%, rgba(255, 179, 0, 0.05) 100%)',
    agentId: 'education'
  },
  {
    id: 'creative-collaboration',
    title: 'Creative Industries',
    description: 'Enable AI agents to collaborate on creative projects, from content generation to design workflows, fostering innovation in arts and media.',
    icon: <AutoFixHighIcon fontSize="large" />,
    color: '#FFC107',
    bgGradient: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)',
    agentId: 'creative'
  },
  {
    id: 'community-management',
    title: 'Community Operations',
    description: 'Moderate discussions, facilitate knowledge sharing, and maintain healthy online communities through intelligent agent collaboration.',
    icon: <ChatIcon fontSize="large" />,
    color: '#F57C00',
    bgGradient: 'linear-gradient(135deg, rgba(245, 124, 0, 0.1) 0%, rgba(245, 124, 0, 0.05) 100%)',
    agentId: 'community'
  },
] as const;

const FEATURES: Feature[] = [
  { 
    id: 'open-source-platform',
    icon: <GitHubIcon />, 
    title: 'Open-Source Foundation', 
    description: 'Built with transparency and collaboration at its core. Fork, contribute, and customize AgentHive to fit your vision of autonomous intelligence.',
    priority: 'high',
    agentId: 'general',
    color: '#FFB300'
  },
  { 
    id: 'extensible-architecture',
    icon: <CodeIcon />, 
    title: 'Extensible by Design', 
    description: 'Modular architecture allows developers to create custom agents, integrate new AI models, and extend capabilities through community-driven plugins.',
    priority: 'high',
    agentId: 'hr',
    color: '#FFA000'
  },
  { 
    id: 'collaborative-hive',
    icon: <AutoFixHighIcon />, 
    title: 'Collaborative Swarm Intelligence', 
    description: 'Multiple specialized agents work together, sharing knowledge and collaborating to solve complex problems that single AI systems cannot tackle alone.',
    priority: 'high',
    agentId: 'operations',
    color: '#FF8F00'
  },
  { 
    id: 'community-driven',
    icon: <SpeedIcon />, 
    title: 'Community-Driven Innovation', 
    description: 'Join a global community of developers building the next generation of multiagent systems. Share agents, collaborate on improvements, and shape the future together.',
    priority: 'high',
    agentId: 'engineering',
    color: '#FF6F00'
  },
  { 
    id: 'remarkable-capabilities',
    icon: <TrendingUpIcon />, 
    title: 'Next-Level Agent Capabilities', 
    description: 'From simple automation to complex reasoning, AgentHive enables remarkable AI behaviors through distributed intelligence and collective problem-solving.',
    priority: 'high',
    agentId: 'finance',
    color: '#F57C00'
  },
  { 
    id: 'seamless-integration',
    icon: <SchemaIcon />, 
    title: 'Universal Connectivity', 
    description: 'Connect with any API, database, or service. AgentHive\'s flexible architecture adapts to your existing infrastructure while enabling new possibilities.',
    priority: 'high',
    agentId: 'supply-chain',
    color: '#E65100'
  }
] as const;

// Animation variants with improved performance
const ANIMATION_VARIANTS = {
  fadeInUp: {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
  },
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }
} as const;

// Theme toggle component
const ThemeToggle = memo(() => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const resolvedMode = currentTheme === 'auto' 
    ? (prefersDarkMode ? 'dark' : 'light')
    : currentTheme;

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedMode === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
    localStorage.setItem('theme', newTheme);
  }, [resolvedMode, dispatch]);

  return (
    <Box sx={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 1000,
    }}>
      <Tooltip title={`Switch to ${resolvedMode === 'light' ? 'dark' : 'light'} mode`}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[4],
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {resolvedMode === 'light' ? (
            <DarkModeIcon sx={{ color: theme.palette.primary.main }} />
          ) : (
            <LightModeIcon sx={{ color: theme.palette.primary.main }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
});

// Memoized components for performance
const AnimatedBackground = memo(({ y1, y2 }: { y1: MotionValue<number>; y2: MotionValue<number> }) => {
  const theme = useTheme();
  
  return (
    <>
      {/* Enhanced background with multiple layers */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: theme.palette.mode === 'dark' 
          ? `
            radial-gradient(circle at 20% 80%, rgba(255, 193, 7, 0.06) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(255, 160, 0, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(255, 143, 0, 0.04) 0%, transparent 60%),
            linear-gradient(135deg, rgba(255, 111, 0, 0.02) 0%, transparent 60%)
          `
          : `
            radial-gradient(circle at 20% 80%, rgba(255, 193, 7, 0.03) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(255, 160, 0, 0.02) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(255, 143, 0, 0.02) 0%, transparent 60%),
            linear-gradient(135deg, rgba(255, 111, 0, 0.015) 0%, transparent 60%)
          `
      }} />

      {/* Gradient backdrop */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha('#FF8F00', 0.06)} 0%, ${alpha('#FF8F00', 0.04)} 50%, ${alpha('#00BCD4', 0.03)} 100%)`
          : `linear-gradient(135deg, ${alpha('#FF8F00', 0.03)} 0%, ${alpha('#FF8F00', 0.02)} 50%, ${alpha('#00BCD4', 0.02)} 100%)`,
        animation: 'gradientShift 20s ease-in-out infinite alternate',
        '@keyframes gradientShift': {
          '0%': { transform: 'translateX(-2%) translateY(-1%)' },
          '100%': { transform: 'translateX(2%) translateY(1%)' }
        }
      }} />

      {/* SVG Honeycomb overlay */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        opacity: theme.palette.mode === 'dark' ? 0.4 : 0.5,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='87' viewBox='0 0 100 87' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 0l25 14.43L75 0l25 14.43v28.87L75 57.74 50 43.3 25 57.74 0 43.3V14.43L25 0z' fill='none' stroke='%23${theme.palette.mode === 'dark' ? 'FFC107' : 'FF8F00'}' stroke-width='0.8' opacity='0.6'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 87px',
        backgroundPosition: '0 0, 50px 43.5px',
        animation: 'honeycombDrift 60s linear infinite',
        '@keyframes honeycombDrift': {
          '0%': { backgroundPosition: '0 0, 50px 43.5px' },
          '100%': { backgroundPosition: '100px 87px, 150px 130.5px' }
        }
      }} />

      {/* Animated geometric shapes - subtle */}
      <motion.div 
        style={{ position: 'absolute', top: '10%', left: '10%', y: y1 }}
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 2, 0],
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Box sx={{
          width: { xs: 60, md: 100 },
          height: { xs: 60, md: 100 },
          borderRadius: '50% 50% 45% 55%',
          background: `linear-gradient(45deg, rgba(255, 193, 7, 0.04), rgba(255, 143, 0, 0.06), transparent)`,
          filter: 'blur(50px)',
          boxShadow: `0 0 40px rgba(255, 160, 0, 0.08)`,
          transform: 'skewY(2deg)',
          opacity: 0.5,
        }} />
      </motion.div>
      
      <motion.div 
        style={{ position: 'absolute', top: '60%', right: '15%', y: y2 }}
        animate={{ 
          scale: [1, 1.08, 1],
          rotate: [0, -2, 0],
        }}
        transition={{ 
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Box sx={{
          width: { xs: 80, md: 150 },
          height: { xs: 80, md: 150 },
          borderRadius: '60% 40% 55% 45%',
          background: `linear-gradient(135deg, rgba(255, 193, 7, 0.06), rgba(255, 160, 0, 0.04), transparent)`,
          filter: 'blur(70px)',
          boxShadow: `0 0 50px rgba(255, 143, 0, 0.06)`,
          transform: 'skewY(-3deg)',
          opacity: 0.4,
        }} />
      </motion.div>
    </>
  );
});

const HeroSection = memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const handleNavigateToChat = useCallback(() => {
    navigate('/chat');
  }, [navigate]);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const heroRef = React.useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.3 });

  const handleNavigateToAdmin = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  const handleNavigateToEnterpriseOS = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  const handleNavigateToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <motion.div
      ref={heroRef}
      initial="initial"
      animate={isHeroInView ? "animate" : "initial"}
      variants={ANIMATION_VARIANTS.staggerChildren}
    >
      <Box 
        sx={{ 
          pt: { xs: 16, md: 20 },
          pb: { xs: 8, md: 12 }, 
          px: { xs: 2, sm: 3 }, 
          textAlign: 'center',
          position: 'relative',
          minHeight: { xs: '90vh', md: '80vh' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(100px)',
            zIndex: -1,
          }
        }}
      >
        {/* Animated Background Shapes */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{ opacity: 0.12, scale: 1, rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          sx={{
            position: 'absolute',
            top: '8%',
            left: '5%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFC107 0%, #FF8F00 100%)',
            zIndex: 0,
            filter: 'blur(80px)',
          }}
        />
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
          animate={{ opacity: 0.10, scale: 1, rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: 220,
            height: 220,
            borderRadius: '30%',
            background: 'linear-gradient(120deg, #FFA000 0%, #FF6F00 100%)',
            zIndex: 0,
            filter: 'blur(60px)',
          }}
        />
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.6, x: 0 }}
          animate={{ opacity: 0.08, scale: 1, x: [0, 40, -40, 0] }}
          transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: 'absolute',
            top: '40%',
            left: '40%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
            zIndex: 0,
            filter: 'blur(50px)',
          }}
        />

        {/* Enhanced Animated Logo with microinteraction */}
        <Container maxWidth="md">
          <Box
            sx={{
              mb: { xs: 4, md: 6 },
              position: 'relative',
              display: 'inline-block',
              zIndex: 1,
            }}
          >
            <div>
              <LazyLogoText 
                size="large" 
                hasNewMessage={false} 
                interactive={false}
                animated={false}
                onClick={handleNavigateToHome}
                aria-label="Return to home page"
              />
            </div>
          </Box>

          {/* Animated Hero Text */}
          <Typography 
            component={motion.h1}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            variant="h2" 
            sx={{ 
              mt: 3,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem', lg: '2.25rem' },
              fontWeight: 600,
              mb: 3,
              color: theme.palette.mode === 'dark' ? 'neutral.100' : 'neutral.800',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              textTransform: 'none',
              background: `linear-gradient(135deg, #FF6F00 0%, #FFC107 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: theme.palette.mode === 'dark' 
                ? '0 2px 10px rgba(255, 160, 0, 0.3)' 
                : '0 2px 10px rgba(255, 160, 0, 0.2)',
              zIndex: 1,
              position: 'relative',
            }}
          >
            Universal Employee Copilot
          </Typography>

          {/* Animated Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  maxWidth: '700px',
                  mx: 'auto',
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                  color: theme.palette.text.secondary,
                  mb: 5,
                  lineHeight: 1.6,
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  opacity: 0.9,
                  textShadow: theme.palette.mode === 'dark' 
                    ? '0 1px 5px rgba(0,0,0,0.2)' 
                    : '0 1px 5px rgba(0,0,0,0.05)',
                  zIndex: 1,
                  position: 'relative',
                }}
              >
                Slash help-desk tickets 54% • Accelerate routine tasks • Surface knowledge instantly
              </Typography>
            </Box>
          </motion.div>

          {/* Enhanced CTA Buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            alignItems: 'center', 
            gap: 2,
            justifyContent: 'center',
          }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleNavigateToChat}
              startIcon={<StarIcon />}
              sx={{
                fontWeight: 600,
                borderRadius: 3,
                textTransform: 'none',
                letterSpacing: 0.5,
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                background: 'linear-gradient(90deg, #FFC107 0%, #FF8F00 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: `0 8px 20px ${alpha('#FF8F00', 0.3)}`,
                border: '1px solid rgba(255, 243, 224, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                minWidth: { xs: '200px', sm: '220px' },
                transition: 'all 0.3s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '25%',
                  bottom: '-10px',
                  left: 0,
                  background: 'linear-gradient(90deg, rgba(255, 193, 7, 0.6) 0%, rgba(255, 143, 0, 0.4) 100%)',
                  filter: 'blur(4px)',
                  borderRadius: '50%',
                  zIndex: -1,
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.6s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(90deg, #FFB300 0%, #FF6F00 100%)',
                  transform: 'translateY(-3px)',
                  boxShadow: `0 12px 28px ${alpha('#FF8F00', 0.4)}`,
                  borderColor: 'rgba(255, 243, 224, 0.3)',
                  '&:before': {
                    transform: 'translateX(100%)',
                  }
                }
              }}
            >
              Try the Hive
            </Button>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleNavigateToEnterpriseOS}
              startIcon={<AutoFixHighIcon />}
              sx={{
                fontWeight: 600,
                borderRadius: 3,
                textTransform: 'none',
                letterSpacing: 0.5,
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)',
                backdropFilter: 'blur(10px)',
                boxShadow: `0 8px 20px ${alpha('#1976D2', 0.3)}`,
                border: '1px solid rgba(224, 242, 254, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                minWidth: { xs: '200px', sm: '220px' },
                transition: 'all 0.3s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '25%',
                  bottom: '-10px',
                  left: 0,
                  background: 'linear-gradient(90deg, rgba(33, 150, 243, 0.6) 0%, rgba(25, 118, 210, 0.4) 100%)',
                  filter: 'blur(4px)',
                  borderRadius: '50%',
                  zIndex: -1,
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.6s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(90deg, #1976D2 0%, #0D47A1 100%)',
                  transform: 'translateY(-3px)',
                  boxShadow: `0 12px 28px ${alpha('#1976D2', 0.4)}`,
                  borderColor: 'rgba(224, 242, 254, 0.3)',
                  '&:before': {
                    transform: 'translateX(100%)',
                  }
                }
              }}
            >
              Admin Dashboard
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => window.open('https://github.com/h3nok/AgentHive', '_blank')}
              startIcon={<GitHubIcon />}
              sx={{
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 600,
                borderRadius: 3,
                borderColor: alpha(theme.palette.primary.main, 0.5),
                color: theme.palette.primary.main,
                background: alpha(theme.palette.background.paper, 0.3),
                backdropFilter: 'blur(8px)',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 3,
                  padding: '1px',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)}, transparent)`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none'
                },
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: theme.palette.primary.main,
                  background: alpha(theme.palette.background.paper, 0.5),
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                transition: 'all 0.3s ease',
                minWidth: { xs: '200px', sm: '220px' },
              }}
            >
              Contribute on GitHub
            </Button>
          </Box>

          {/* Enhanced Scroll indicator */}
          <Box
            sx={{
              mt: { xs: 6, md: 8 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              color: theme.palette.text.secondary,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: theme.palette.primary.main,
                transform: 'translateY(2px)',
              },
            }}
            onClick={() => scrollToSection('features')}
          >
            <Typography 
              variant="h1"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(90deg, #FFB300, #FF6F00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 10px rgba(255,193,7,0.3)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                mb: 2
              }} >
              Discover AgentHive
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.7,
                fontSize: '0.9rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
            />
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ExpandMoreIcon sx={{ fontSize: 32 }} />
            </motion.div>
          </Box>
        </Container>
      </Box>
      
      <Box sx={{ 
        '& .MuiDialog-paper': {
          backdropFilter: 'blur(16px)',
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.85)
            : alpha(theme.palette.background.paper, 0.9),
          borderRadius: 3,
          boxShadow: `0 10px 40px ${alpha(theme.palette.common.black, 0.3)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 3,
            padding: '1px',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)}, transparent)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none'
          }
        }
      }}>
      </Box>
    </motion.div>
  );
});

const FeaturesSection = memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const featuresRef = React.useRef(null);
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.3 });

  const handleCardClick = useCallback((agentId: string) => {
    navigate(`/chat?agent=${agentId}`);
  }, [navigate]);

  return (
    <motion.div
      ref={featuresRef}
      initial="initial"
      animate={isFeaturesInView ? "animate" : "initial"}
      variants={ANIMATION_VARIANTS.staggerChildren}
    >
      <Box 
        id="features" 
        sx={{ 
          py: { xs: 8, md: 12 },
          '@keyframes float': {
            '0%': { transform: 'translateY(0px) rotate(15deg)' },
            '50%': { transform: 'translateY(-15px) rotate(10deg)' },
            '100%': { transform: 'translateY(0px) rotate(15deg)' },
          },
          px: { xs: 2, sm: 3 },
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(255,193,7,0.04) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,193,7,0.02) 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '600px',
            height: '600px',
            backgroundImage: 'url("/honeycomb-pattern.png")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            opacity: 0.04,
            zIndex: -1,
            pointerEvents: 'none',
          },
          backdropFilter: 'blur(60px)',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 20% 70%, rgba(255,193,7,0.06), transparent 70%), url("/honeycomb-pattern.png")'
              : 'radial-gradient(circle at 20% 70%, rgba(255,193,7,0.03), transparent 70%), url("/honeycomb-pattern.png")',
            backgroundBlendMode: 'overlay',
            backgroundSize: 'cover, 600px',
            backgroundPosition: 'center, right top',
            backgroundRepeat: 'no-repeat',
            opacity: 0.8,
            zIndex: -1,
          }
        }}
      >
        {/* Add subtle animated background pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px',
            animation: 'slide 20s linear infinite',
            '@keyframes slide': {
              '0%': { backgroundPosition: '0 0' },
              '100%': { backgroundPosition: '40px 40px' },
            },
          }}
        />

        <motion.div variants={ANIMATION_VARIANTS.fadeInUp}>
          <Typography 
            variant="h2" 
            sx={{ 
              textAlign: 'center',
              fontWeight: 800, 
              mb: 2, 
              fontSize: { 
                xs: '1.5rem',
                sm: '1.75rem',
                md: '2rem',
                lg: '2.25rem',
                xl: '2.5rem'
              },
              background: `linear-gradient(135deg, #FF6F00 0%, #FFC107 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: { xs: 1.3, md: 1.2 },
              textShadow: theme.palette.mode === 'dark' 
                ? '0 2px 10px rgba(0,0,0,0.3)' 
                : '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            Open-Source Multiagent Platform
          </Typography>
        </motion.div>
        
        <motion.div variants={ANIMATION_VARIANTS.fadeInUp}>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary', 
              mb: 8,
              fontWeight: 400,
              fontSize: { 
                xs: '0.9rem',
                sm: '0.95rem',
                md: '1rem',
                lg: '1.05rem'
              },
              maxWidth: '600px',
              mx: 'auto',
              px: { xs: 2, md: 0 },
              lineHeight: { xs: 1.5, md: 1.6 },
              textShadow: theme.palette.mode === 'dark' 
                ? '0 1px 5px rgba(0,0,0,0.2)' 
                : '0 1px 5px rgba(0,0,0,0.05)',
            }}
          >
            Build the future of multiagent systems together—AgentHive is an open-source platform where developers create extensible, collaborative AI agents that form remarkable intelligent swarms.
          </Typography>
        </motion.div>

        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: { xs: 3, md: 4 }, 
          justifyContent: 'center',
          maxWidth: '1400px',
          mx: 'auto',
        }}>
          {FEATURES.map((feature, index) => (
            <Box 
              key={feature.id} 
              sx={{ 
                flex: { xs: '1 1 100%', md: '1 1 45%', lg: '1 1 30%' },
                minWidth: { xs: '280px', lg: '250px' },
                maxWidth: { xs: '400px', lg: '350px' }
              }}
            >
              <motion.div 
                variants={ANIMATION_VARIANTS.fadeInUp}
                custom={index}
              >
                <Card 
                  onClick={() => handleCardClick(feature.agentId)}
                  sx={{
                    height: '100%',
                    background: theme.palette.mode === 'dark' 
                      ? `linear-gradient(to bottom right, ${alpha('#FFC107', 0.2)}, ${alpha(feature.color, 0.05)})`
                      : `linear-gradient(to bottom right, ${alpha('#FFC107', 0.1)}, ${alpha(feature.color, 0.03)})`,
                    borderRadius: 4,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha(feature.color, 0.2)}`,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? `0 8px 32px ${alpha(theme.palette.common.black, 0.25)}`
                      : `0 8px 32px ${alpha(feature.color, 0.15)}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 4,
                      padding: '1px',
                      background: `linear-gradient(135deg, ${alpha(feature.color, 0.5)}, transparent)`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                    },
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 16px 40px ${alpha(feature.color, 0.25)}`,
                    },
                    overflow: 'hidden',
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      top: -80,
                      right: -80,
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${alpha(feature.color, 0.4)} 0%, transparent 70%)`,
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${feature.color}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ 
                      p: 2.5,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(feature.color || '#FFB300', 0.15)}, ${alpha(feature.color || '#FFB300', 0.05)})`,
                      color: feature.color,
                      mb: 3,
                      position: 'relative',
                      backdropFilter: 'blur(5px)',
                      border: `1px solid ${alpha(feature.color || '#FFB300', 0.2)}`,
                      boxShadow: `0 5px 15px ${alpha(feature.color || '#FFB300', 0.15)}`,
                      transition: 'all 0.3s ease',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        padding: '1px',
                        background: `linear-gradient(135deg, ${alpha(feature.color || '#FFB300', 0.5)}, transparent)`,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                      },
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: `0 8px 25px ${alpha(feature.color || '#FFB300', 0.25)}`,
                      },
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        position: 'relative',
                        fontWeight: 700, 
                        mb: 3,
                        fontSize: { xs: '1.1rem', md: '1.2rem' },
                        background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        '&:after': {
                          content: '""',
                          position: 'absolute',
                          bottom: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '60px',
                          height: '2px',
                          background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                          borderRadius: '2px',
                        }
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary', 
                        lineHeight: 1.6,
                        fontSize: { xs: '0.9rem', md: '1rem' },
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
});

const UseCasesSection = memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleCardClick = useCallback((agentId: string) => {
    navigate(`/chat?agent=${agentId}`);
  }, [navigate]);

  return (
    <Box sx={{ py: { xs: 6, md: 12 } }}>
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={ANIMATION_VARIANTS.staggerChildren}
      >
        <motion.div variants={ANIMATION_VARIANTS.fadeInUp}>
          <Typography 
            variant="h2" 
            sx={{ 
              textAlign: 'center',
              fontWeight: 800, 
              mb: 2, 
              fontSize: { 
                xs: '1.5rem',
                sm: '1.75rem',
                md: '2rem',
                lg: '2.25rem',
                xl: '2.5rem'
              },
              background: `linear-gradient(135deg, #FF6F00 0%, #FFC107 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: { xs: 1.3, md: 1.2 },
              textShadow: theme.palette.mode === 'dark' 
                ? '0 2px 10px rgba(255, 160, 0, 0.3)' 
                : '0 2px 10px rgba(255, 160, 0, 0.1)',
            }}
          >
            Community Use Cases
          </Typography>
        </motion.div>

        <motion.div variants={ANIMATION_VARIANTS.fadeInUp}>
          <Typography 
            variant="h6" 
            sx={{
              textAlign: 'center',
              color: 'text.secondary', 
              mb: 8,
              fontWeight: 400,
              fontSize: { 
                xs: '0.9rem',
                sm: '0.95rem',
                md: '1rem',
                lg: '1.05rem'
              },
              maxWidth: '600px',
              mx: 'auto',
              px: { xs: 2, md: 0 },
              lineHeight: { xs: 1.5, md: 1.6 },
            }}
          >
            Discover how innovators worldwide are building remarkable multiagent systems with AgentHive's extensible platform across diverse domains and applications.
          </Typography>
        </motion.div>

        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 4, 
          justifyContent: 'center' 
        }}>
          {USE_CASES.map((useCase, index) => (
            <Box 
              key={useCase.id} 
              sx={{ 
                flex: { xs: '1 1 100%', md: '1 1 45%', lg: '1 1 22%' },
                minWidth: { xs: '280px', lg: '250px' },
                maxWidth: { xs: '400px', lg: '300px' }
              }}
            >
              <motion.div variants={ANIMATION_VARIANTS.fadeInUp}>
                <Card 
                  onClick={() => handleCardClick(useCase.agentId)}
                  sx={{
                    height: '100%',
                    background: theme.palette.mode === 'dark' 
                      ? `linear-gradient(to bottom right, ${alpha('#FFC107', 0.2)}, ${alpha(useCase.color, 0.05)})`
                      : `linear-gradient(to bottom right, ${alpha('#FFC107', 0.1)}, ${alpha(useCase.color, 0.03)})`,
                    borderRadius: 4,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${alpha(useCase.color, 0.2)}`,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? `0 8px 32px ${alpha(theme.palette.common.black, 0.25)}`
                      : `0 8px 32px ${alpha(useCase.color, 0.15)}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '80px',
                      height: '80px',
                      backgroundImage: 'url("/honeycomb-pattern.png")',
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.07,
                      transform: 'rotate(15deg)',
                      pointerEvents: 'none',
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 4,
                      padding: '1px',
                      background: `linear-gradient(135deg, ${alpha(useCase.color, 0.5)}, transparent)`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                    },
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 16px 40px ${alpha(useCase.color, 0.25)}`,
                    },
                    overflow: 'hidden',
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      top: -80,
                      right: -80,
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${alpha(useCase.color, 0.4)} 0%, transparent 70%)`,
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${useCase.color}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ 
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: `${useCase.color}15`,
                      color: useCase.color,
                      mb: 3,
                    }}>
                      {useCase.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      {useCase.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                      {useCase.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </motion.div>
    </Box>
  );
});

const PoweredBySection = memo(() => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ 
        py: { xs: 4, md: 8 }, 
        textAlign: 'center',
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 8,
      }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'text.secondary', 
            mb: 4,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 2,
            fontSize: { xs: '0.8rem', md: '1rem' },
          }}
        >
          Powered by Enterprise AI Technology
        </Typography>
        <Stack 
          direction="row" 
          spacing={{ xs: 4, md: 6 }}
          alignItems="center" 
          justifyContent="center"
          sx={{ opacity: 0.7 }}
        >
          <Box 
            component="img" 
            src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg" 
            alt="Microsoft Azure" 
            sx={(theme: Theme) => ({
              height: { xs: 24, md: 32 }, 
              width: 'auto', 
              objectFit: 'contain', 
              filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                opacity: 1,
              }
            })} 
          />
          <Box 
            component="img" 
            src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" 
            alt="OpenAI Enterprise" 
            sx={(theme: Theme) => ({
              height: { xs: 24, md: 32 }, 
              width: 'auto', 
              objectFit: 'contain',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                opacity: 1,
              }
            })} 
          />
        </Stack>
      </Box>
    </motion.div>
  );
});

// Community links
const COMMUNITY_LINKS = [
  { icon: <GitHubIcon />, text: 'Contribute on GitHub', href: 'https://github.com/h3nok/AgentHive' },
  { icon: '�', text: 'Join Discord', href: '#' },
  { icon: '�', text: 'Read the Docs', href: '#' },
  { icon: '�', text: 'Build Extensions', href: '#' },
  { icon: '�', text: 'Share Your Agents', href: '#' }
];

// Main component with error boundary and performance optimizations
const LandingPage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const theme = useTheme();
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Header background opacity on scroll
  const [headerOpacity, setHeaderOpacity] = useState(0.9);
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const opacity = Math.min(scrolled / 100, 0.95);
      setHeaderOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      bgcolor: 'background.default',
      overflow: 'hidden',
    }}>
      <ThemeToggle />
      <AnimatedBackground y1={y1} y2={y2} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <FeaturesSection />
        <UseCasesSection />
        <PoweredBySection />
      </Container>

      <Suspense fallback={null}>
        <ComponentErrorBoundary componentName="EmbeddedWidget">
          <Box sx={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32, 
            zIndex: 1000,
            '& .widget-launcher': {
              width: 'auto !important',
              height: 'auto !important',
              padding: '12px !important',
              borderRadius: '16px !important',
              backgroundColor: `${theme.palette.background.paper} !important`,
              backdropFilter: 'blur(20px) !important',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)} !important`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)} !important`,
              transition: 'all 0.3s ease !important',
              '&:hover': {
                transform: 'translateY(-4px) !important',
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.25)} !important`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)} !important`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: '16px',
                padding: '1px',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.5)}, transparent)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              },
            },
            '& .widget-launcher-icon': {
              width: '32px !important',
              height: '32px !important',
              margin: '0 !important',
              padding: '0 !important',
              display: 'flex !important',
              alignItems: 'center !important',
              justifyContent: 'center !important',
            },
          }}>
            <EmbeddedWidget 
              customLauncher={
                <Box className="widget-launcher" sx={{
                  backdropFilter: 'blur(15px) !important',
                  background: `${alpha(theme.palette.background.paper, 0.6)} !important`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)} !important`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)} !important`,
                  '&:hover': {
                    background: `${alpha(theme.palette.background.paper, 0.7)} !important`,
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)} !important`
                  }
                }}>
                  <LazyLogoText 
                    size="small" 
                    showOnlyBubble={true} 
                    animated={false}
                    interactive={false}
                  />
                </Box>
              }
            />
          </Box>
        </ComponentErrorBoundary>
      </Suspense>

      {/* Community Section */}
      <Box
        component="section"
        id="community"
        sx={{
          py: { xs: 6, md: 10 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              mb: 2,
              color: 'primary.main',
            }}
          >
            Build the Future Together
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.2rem' },
              color: 'text.secondary',
              mb: 6,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Join our global community of developers building the next generation of multiagent systems. Contribute code, share agents, collaborate on research, and help shape the future of autonomous intelligence.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {COMMUNITY_LINKS.map((link, index) => (
              <Button
                key={index}
                href={link.href}
                variant="outlined"
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.1),
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'translateY(-5px)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                {link.icon} {link.text}
              </Button>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Open Source Principles Section */}
      <Box
        component="section"
        id="principles"
        sx={{
          py: { xs: 6, md: 8 },
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha('#FF6F00', 0.03)} 0%, transparent 50%, ${alpha('#FFC107', 0.03)} 100%)`
            : `linear-gradient(135deg, ${alpha('#FF6F00', 0.02)} 0%, transparent 50%, ${alpha('#FFC107', 0.02)} 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={ANIMATION_VARIANTS.staggerChildren}
          >
            <motion.div variants={ANIMATION_VARIANTS.fadeInUp}>
              <Typography 
                variant="h2" 
                sx={{ 
                  textAlign: 'center',
                  fontWeight: 800, 
                  mb: 2, 
                  fontSize: { 
                    xs: '1.5rem',
                    sm: '1.75rem',
                    md: '2rem',
                    lg: '2.25rem'
                  },
                  background: `linear-gradient(135deg, #FF6F00 0%, #FFC107 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: { xs: 1.3, md: 1.2 },
                }}
              >
                Built on Open Principles
              </Typography>
            </motion.div>
            
            <motion.div variants={ANIMATION_VARIANTS.fadeInUp}>
              <Typography 
                variant="h6" 
                sx={{
                  textAlign: 'center',
                  color: 'text.secondary', 
                  mb: 6,
                  fontWeight: 400,
                  fontSize: { 
                    xs: '0.9rem',
                    sm: '0.95rem',
                    md: '1rem'
                  },
                  maxWidth: '700px',
                  mx: 'auto',
                  px: { xs: 2, md: 0 },
                  lineHeight: { xs: 1.5, md: 1.6 },
                }}
              >
                AgentHive is founded on the belief that the future of AI should be open, collaborative, and accessible to everyone.
              </Typography>
            </motion.div>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4,
              maxWidth: '1000px',
              mx: 'auto'
            }}>
              {[
                {
                  icon: <GitHubIcon sx={{ fontSize: 48, color: '#FF8F00' }} />,
                  title: 'Open Source',
                  description: 'Transparent development, community-driven improvements, and unlimited extensibility for all.'
                },
                {
                  icon: <AutoFixHighIcon sx={{ fontSize: 48, color: '#FFA000' }} />,
                  title: 'Extensible',
                  description: 'Modular architecture designed for customization, integration, and remarkable innovation.'
                },
                {
                  icon: <SpeedIcon sx={{ fontSize: 48, color: '#FFB300' }} />,
                  title: 'Collaborative',
                  description: 'Agents that work together, developers that build together, communities that grow together.'
                }
              ].map((principle, index) => (
                <motion.div 
                  key={index}
                  variants={ANIMATION_VARIANTS.fadeInUp}
                >
                  <Card
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      height: '100%',
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha('#FF8F00', 0.05)} 100%)`
                        : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha('#FF8F00', 0.02)} 100%)`,
                      border: `1px solid ${alpha('#FF8F00', 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 16px 32px ${alpha('#FF8F00', 0.15)}`,
                        borderColor: alpha('#FF8F00', 0.2),
                      }
                    }}
                  >
                    <Box sx={{ mb: 3 }}>
                      {principle.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        color: theme.palette.text.primary
                      }}
                    >
                      {principle.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'text.secondary',
                        lineHeight: 1.6
                      }}
                    >
                      {principle.description}
                    </Typography>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default memo(LandingPage);
