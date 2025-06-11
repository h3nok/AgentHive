import React, { Suspense, useMemo, useCallback, memo, useState } from 'react';
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
// Import directly from the correct physical path
import { EmbeddedWidget } from '../../../packages/ubiqora-ai-widget/ubiqora-ai-widget/src';
import { ComponentErrorBoundary } from '../components/ErrorBoundary';
import { useAppSelector, useAppDispatch, selectTheme, setTheme } from '../store';
import IntakeDialog from '../components/IntakeDialog';

// Lazy load components for performance
const LazyLogoText = React.lazy(() => import('../components/LogoText'));

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
}

interface AnimationVariant {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease: number[] };
}

// Constants with improved organization
const USE_CASES: UseCase[] = [
  {
    id: 'store-ops',
    title: 'Store Operations',
    description: 'Automate inventory checks, staff scheduling, and compliance reporting across 2,000+ stores.',
    icon: <SchemaIcon fontSize="large" />,
    color: '#c8102e',
    bgGradient: 'linear-gradient(135deg, rgba(200, 16, 46, 0.1) 0%, rgba(200, 16, 46, 0.05) 100%)',
    agentId: 'operations'
  },
  {
    id: 'hr-payroll',
    title: 'HR & Payroll',
    description: 'Streamline team member requests, benefits enrollment, and performance reviews automatically.',
    icon: <AccessTimeIcon fontSize="large" />,
    color: '#2E7D32',
    bgGradient: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%)',
    agentId: 'hr'
  },
  {
    id: 'supply-chain',
    title: 'Supply Chain',
    description: 'Optimize vendor communications, purchase orders, and logistics coordination in real-time.',
    icon: <ReceiptIcon fontSize="large" />,
    color: '#1976D2',
    bgGradient: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
    agentId: 'supply-chain'
  },
  {
    id: 'engineering',
    title: 'Engineering',
    description: 'Accelerate feature delivery with AI agents that triage bugs, draft pull requests, and auto-update documentation.',
    icon: <CodeIcon fontSize="large" />,
    color: '#7B1FA2',
    bgGradient: 'linear-gradient(135deg, rgba(123, 31, 162, 0.1) 0%, rgba(123, 31, 162, 0.05) 100%)',
    agentId: 'engineering'
  },
  {
    id: 'financial-ops',
    title: 'Financial Operations',
    description: 'Automate expense reporting, budget tracking, and financial analysis across all departments.',
    icon: <BarChartIcon fontSize="large" />,
    color: '#F57C00',
    bgGradient: 'linear-gradient(135deg, rgba(245, 124, 0, 0.1) 0%, rgba(245, 124, 0, 0.05) 100%)',
    agentId: 'finance'
  },
] as const;

const FEATURES: Feature[] = [
  { 
    id: 'unified-platform',
    icon: <CloudIcon />, 
    title: 'Enterprise-wide AI Platform', 
    description: 'Consolidates isolated AI investments into one unified platform, maximizing ROI and creating a cohesive employee experience—all while maintaining enterprise security.',
    priority: 'high',
    agentId: 'general'
  },
  { 
    id: 'expanding-capabilities',
    icon: <AutoFixHighIcon />, 
    title: 'Expanding Capabilities', 
    description: 'Designed for continuous expansion, quickly supporting new use cases at both enterprise and individual role levels, with built-in analytics to track impact.',
    priority: 'high',
    agentId: 'hr'
  },
  { 
    id: 'actionable-conversational',
    icon: <SpeedIcon />, 
    title: 'Actionable & Conversational', 
    description: 'Moves beyond simple Q&A like ChatGPT, enabling users to initiate tasks, automate workflows, and execute complex operations through natural language.',
    priority: 'high',
    agentId: 'operations'
  },
  { 
    id: 'intelligent-assistant',
    icon: <SecurityIcon />, 
    title: 'Intelligent Assistant', 
    description: 'More than a chatbot or custom GPT, Autoprise is a unified platform that brings together natural language, automation, and access to all your enterprise tools with enterprise-grade security.',
    priority: 'high',
    agentId: 'engineering'
  },
  { 
    id: 'continuous-evolution',
    icon: <TrendingUpIcon />, 
    title: 'Continuous Evolution', 
    description: 'As AI evolves, Autoprise continually adapts and expands its capabilities, making work faster, simpler, and smarter for every employee while maintaining compliance.',
    priority: 'high',
    agentId: 'finance'
  },
  { 
    id: 'enterprise-integration',
    icon: <SchemaIcon />, 
    title: 'Enterprise Integration', 
    description: 'Seamlessly connects with existing enterprise tools and systems, providing a unified interface for all operations with full security and compliance controls.',
    priority: 'high',
    agentId: 'supply-chain'
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
            radial-gradient(circle at 20% 80%, rgba(200, 16, 46, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(46, 125, 50, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(200, 16, 46, 0.05) 0%, transparent 50%)
          `
          : `
            radial-gradient(circle at 20% 80%, rgba(200, 16, 46, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(46, 125, 50, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(25, 118, 210, 0.06) 0%, transparent 50%),
            linear-gradient(135deg, rgba(200, 16, 46, 0.03) 0%, transparent 50%)
          `
      }} />

      {/* Animated geometric shapes with enhanced effects */}
      <motion.div 
        style={{ position: 'absolute', top: '10%', left: '10%', y: y1 }}
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Box sx={{
          width: { xs: 60, md: 100 },
          height: { xs: 60, md: 100 },
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}20, transparent)`,
          filter: 'blur(40px)',
          boxShadow: `0 0 60px ${theme.palette.primary.main}20`,
        }} />
      </motion.div>
      <motion.div 
        style={{ position: 'absolute', top: '60%', right: '15%', y: y2 }}
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, -5, 0],
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Box sx={{
          width: { xs: 80, md: 150 },
          height: { xs: 80, md: 150 },
          borderRadius: '30%',
          background: `linear-gradient(135deg, rgba(46, 125, 50, 0.2), transparent)`,
          filter: 'blur(60px)',
          boxShadow: `0 0 80px rgba(46, 125, 50, 0.2)`,
        }} />
      </motion.div>

      {/* Add floating particles */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        opacity: 0.6,
      }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: theme.palette.primary.main,
              opacity: 0.3,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </Box>
    </>
  );
});

const HeroSection = memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const heroRef = React.useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const [intakeDialogOpen, setIntakeDialogOpen] = useState(false);

  const handleNavigateToChat = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  const handleNavigateToAdmin = useCallback(() => {
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
            background: 'linear-gradient(135deg, #c8102e 0%, #a50d24 100%)',
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
            background: 'linear-gradient(120deg, #1976D2 0%, #2E7D32 100%)',
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
            background: 'linear-gradient(135deg, #F57C00 0%, #c8102e 100%)',
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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
              whileHover={{ scale: 1.08, rotate: 2 }}
            >
              <LazyLogoText 
                size="large" 
                hasNewMessage={false} 
                interactive={true} 
                onClick={handleNavigateToHome}
                aria-label="Return to home page"
              />
            </motion.div>
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
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: theme.palette.mode === 'dark' 
                ? '0 2px 10px rgba(0,0,0,0.3)' 
                : '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 1,
              position: 'relative',
            }}
          >
            Propelling Enterprise to
            <Box component="br" />
            Autonomous Retail Leadership
          </Typography>

          {/* Animated Subheading */}
          <Typography 
            component={motion.h2}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
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
            Beyond basic AI chat, Autoprise unifies your enterprise AI—answering questions, automating workflows, and maintaining security, all in natural language.
          </Typography>

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
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
                },
                transition: 'all 0.3s ease',
                minWidth: { xs: '200px', sm: '220px' },
              }}
            >
              Start
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => setIntakeDialogOpen(true)}
              sx={{
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 600,
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                transition: 'all 0.3s ease',
                minWidth: { xs: '200px', sm: '220px' },
              }}
            >
              Need a custom agent?
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
              variant="caption" 
              sx={{ 
                opacity: 0.7,
                fontSize: '0.9rem',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Learn more
            </Typography>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ExpandMoreIcon sx={{ fontSize: 32 }} />
            </motion.div>
          </Box>
        </Container>
      </Box>
      
      {/* Intake Dialog */}
      <IntakeDialog open={intakeDialogOpen} onClose={() => setIntakeDialogOpen(false)} />
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
          px: { xs: 2, sm: 3 },
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(200,16,46,0.05) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(200,16,46,0.02) 100%)',
          position: 'relative',
          overflow: 'hidden',
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
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: { xs: 1.3, md: 1.2 },
              textShadow: theme.palette.mode === 'dark' 
                ? '0 2px 10px rgba(0,0,0,0.3)' 
                : '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            Built for Enterprise Operations
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
            Consolidate all AI into one unified platform—instantly answer questions, automate approvals, and launch workflows in natural language.
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
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  borderRadius: 4,
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 20px 40px rgba(200, 16, 46, 0.1)'
                      : '0 20px 40px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${theme.palette.primary.main}40`,
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ 
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: `${theme.palette.primary.main}15`,
                      color: theme.palette.primary.main,
                      mb: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                        bgcolor: `${theme.palette.primary.main}25`,
                      },
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        fontSize: { xs: '1.1rem', md: '1.2rem' },
                        background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
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
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: { xs: 1.3, md: 1.2 },
            }}
          >
            Operational Impact Areas
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
            See how Autoprise transforms daily workflows across every Enterprise department and location.
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
                  background: useCase.bgGradient,
                  border: `1px solid ${useCase.color}40`,
                  borderRadius: 4,
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${useCase.color}20`,
                    border: `1px solid ${theme.palette.primary.main}40`,
                  },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${useCase.color}, transparent)`,
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

// Main component with error boundary and performance optimizations
const LandingPage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const theme = useTheme();
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      bgcolor: 'background.default',
      overflow: 'hidden',
    }}>
      {/* Enterprise Logo in top left corner */}
      <Box sx={{
        position: 'fixed',
        top: 24,
        left: 24,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          boxShadow: theme.shadows[4],
          border: `1px solid ${theme.palette.divider}`,
          height: '40px',
        }}>
          <Box sx={{
            width: 24,
            height: 24,
            backgroundColor: '#c8102e',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.6rem',
            letterSpacing: '0.5px',
          }}>
            Enterprise
          </Box>
          <Typography variant="body2" sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            fontSize: '0.8rem',
          }}>
            Ubiqora - the autonomous future
          </Typography>
        </Box>
      </Box>

      <ThemeToggle />
      <AnimatedBackground y1={y1} y2={y2} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <FeaturesSection />
        <UseCasesSection />
        <PoweredBySection />
        
        {/* Ubiqora Footer Credit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ 
            py: { xs: 4, md: 6 }, 
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: 4,
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary', 
                mb: 2,
                fontSize: { xs: '0.8rem', md: '0.9rem' },
              }}
            >
              Powered by
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mb: 2,
            }}>
              {/* Ubiqora Logo */}
              <Box
                component="img"
                src="/inspyr_logo.png"
                alt="Ubiqora Logo"
                sx={(theme: Theme) => ({
                  height: 40,
                  width: 'auto',
                  /* Tint the logo blue in dark mode */
                  filter: theme.palette.mode === 'dark'
                    ? 'brightness(0) saturate(100%) invert(25%) sepia(92%) saturate(2635%) hue-rotate(191deg) brightness(92%) contrast(101%)'
                    : 'none',
                  transition: 'filter 0.3s ease',
                })}
              />
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.7rem', md: '0.8rem' },
                fontStyle: 'italic',
              }}
            >
              the autonomous future
          </Typography>
        </Box>
        </motion.div>
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
                <Box className="widget-launcher">
                  <LazyLogoText 
                    size="small" 
                    showOnlyBubble={true} 
                    animated={true}
                    interactive={true}
                  />
                </Box>
              }
            />
          </Box>
        </ComponentErrorBoundary>
      </Suspense>
    </Box>
  );
};

export default memo(LandingPage);
