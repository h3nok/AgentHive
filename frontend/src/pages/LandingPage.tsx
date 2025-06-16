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
    id: 'store-ops',
    title: 'Store Operations',
    description: 'Automate inventory checks, staff scheduling, and compliance reporting across 2,000+ stores.',
    icon: <SchemaIcon fontSize="large" />,
    color: '#FF8F00',
    bgGradient: 'linear-gradient(135deg, rgba(255, 143, 0, 0.1) 0%, rgba(255, 143, 0, 0.05) 100%)',
    agentId: 'operations'
  },
  {
    id: 'hr-payroll',
    title: 'HR & Payroll',
    description: 'Streamline team member requests, benefits enrollment, and performance reviews automatically.',
    icon: <AccessTimeIcon fontSize="large" />,
    color: '#FFA000',
    bgGradient: 'linear-gradient(135deg, rgba(255, 160, 0, 0.1) 0%, rgba(255, 160, 0, 0.05) 100%)',
    agentId: 'hr'
  },
  {
    id: 'supply-chain',
    title: 'Supply Chain',
    description: 'Optimize vendor communications, purchase orders, and logistics coordination in real-time.',
    icon: <ReceiptIcon fontSize="large" />,
    color: '#FFB300',
    bgGradient: 'linear-gradient(135deg, rgba(255, 179, 0, 0.1) 0%, rgba(255, 179, 0, 0.05) 100%)',
    agentId: 'supply-chain'
  },
  {
    id: 'engineering',
    title: 'Engineering',
    description: 'Accelerate feature delivery with AI agents that triage bugs, draft pull requests, and auto-update documentation.',
    icon: <CodeIcon fontSize="large" />,
    color: '#FFC107',
    bgGradient: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)',
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
    title: 'Hive Intelligence Platform', 
    description: 'Consolidates isolated AI agents into one unified hive, maximizing collective intelligence and creating a cohesive experience—with enterprise-grade security.',
    priority: 'high',
    agentId: 'general',
    color: '#FFB300'
  },
  { 
    id: 'expanding-capabilities',
    icon: <AutoFixHighIcon />, 
    title: 'Swarm Intelligence', 
    description: 'Multiple specialized agents work in concert, collaborating through the hive to solve complex problems that single AI systems cannot.',
    priority: 'high',
    agentId: 'hr',
    color: '#FFA000'
  },
  { 
    id: 'natural-language',
    icon: <SpeedIcon />, 
    title: 'Natural Language Interface', 
    description: 'Communicate with your AI agents through intuitive conversations. AgentHive orchestrates complex workflows and executes tasks through simple natural language.',
    priority: 'high',
    agentId: 'operations',
    color: '#FF8F00'
  },
  { 
    id: 'intelligent-assistant',
    icon: <SecurityIcon />, 
    title: 'Autonomous Agents', 
    description: 'More than chatbots or custom GPTs, AgentHive deploys autonomous agents that proactively solve problems and collaborate with each other to maximize productivity.',
    priority: 'high',
    agentId: 'engineering',
    color: '#FF6F00'
  },
  { 
    id: 'continuous-evolution',
    icon: <TrendingUpIcon />, 
    title: 'Hive Learning', 
    description: 'The collective intelligence of the hive continuously learns and evolves, with each agent becoming more effective through shared knowledge and collaborative problem-solving.',
    priority: 'high',
    agentId: 'finance',
    color: '#F57C00'
  },
  { 
    id: 'enterprise-integration',
    icon: <SchemaIcon />, 
    title: 'Cross-System Pollination', 
    description: 'Seamlessly connects with existing enterprise tools and systems, allowing agents to collaborate across platforms while maintaining security and compliance controls.',
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
  const [intakeDialogOpen, setIntakeDialogOpen] = useState(false);
  
  const handleNavigateToChat = useCallback(() => {
    navigate('/chat');
  }, [navigate]);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const heroRef = React.useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.3 });

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
            Propelling Enterprise to
            <Box component="br" />
            Autonomous Retail Leadership
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
                Beyond basic AI chat, AgentHive orchestrates your collective AI agents—solving complex problems, automating workflows, and learning collaboratively while maintaining enterprise-grade security.
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
              Start
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => setIntakeDialogOpen(true)}
              startIcon={<ChatIcon />}
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
      
      {intakeDialogOpen && (
        <Dialog 
          open={intakeDialogOpen} 
          onClose={() => setIntakeDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: 24,
            }
          }}
        >
          <DialogTitle>Request Custom Agent</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>Fill out this form to request a custom agent</Typography>
            {/* Form content would go here */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIntakeDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setIntakeDialogOpen(false)}>Submit</Button>
          </DialogActions>
        </Dialog>
      )}
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
        <IntakeDialog 
          open={intakeDialogOpen} 
          onClose={() => setIntakeDialogOpen(false)}
        />
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
            Harness the collective intelligence of your AI swarm—AgentHive orchestrates specialized AI agents that work together to solve complex problems through natural language.
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
            See how AgentHive empowers your collective intelligence across every department with specialized autonomous agents.
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
  { icon: '💬', text: 'Discord Community', href: '#' },
  { icon: '📚', text: 'Documentation', href: '#' },
  { icon: '🐛', text: 'Report Issues', href: '#' },
  { icon: '💡', text: 'Feature Requests', href: '#' },
  { icon: '🎯', text: 'Roadmap', href: '#' }
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
                    animated={true}
                    interactive={true}
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
            Join the Hive
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
            Connect with developers, share ideas, and contribute to the future of open source AI orchestration.
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
    </Box>
  );
};

export default memo(LandingPage);
