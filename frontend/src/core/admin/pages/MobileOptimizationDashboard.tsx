import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  IconButton,
  Drawer,
  useTheme,
  alpha,
  Fab,
  Collapse,
  Button,
  useMediaQuery
} from '@mui/material';
import {
  Smartphone,
  Tablet,
  Computer,
  TouchApp,
  Accessibility,
  Speed,
  Visibility,
  VisibilityOff,
  Settings,
  TrendingUp,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMetrics {
  touchTargetSize: number; // Percentage of targets that meet 44px minimum
  viewportCompatibility: number; // Percentage score
  textReadability: number; // Percentage score
  navigationEfficiency: number; // Percentage score
  loadTimeOnMobile: number; // Milliseconds
  batteryImpact: number; // 1-100 scale
  dataUsage: number; // KB
  gestureSupport: number; // Percentage score
}

interface DeviceSimulation {
  type: 'mobile' | 'tablet' | 'desktop';
  name: string;
  width: number;
  height: number;
  userAgent: string;
}

const MobileOptimizationDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [metrics, setMetrics] = useState<MobileMetrics>({
    touchTargetSize: 92,
    viewportCompatibility: 98,
    textReadability: 94,
    navigationEfficiency: 89,
    loadTimeOnMobile: 1200,
    batteryImpact: 15,
    dataUsage: 245,
    gestureSupport: 96
  });
  
  const [selectedDevice, setSelectedDevice] = useState<DeviceSimulation>({
    type: 'mobile',
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const devices: DeviceSimulation[] = [
    {
      type: 'mobile',
      name: 'iPhone 14 Pro',
      width: 393,
      height: 852,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
    },
    {
      type: 'mobile',
      name: 'Samsung Galaxy S23',
      width: 360,
      height: 780,
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B)'
    },
    {
      type: 'tablet',
      name: 'iPad Pro 12.9"',
      width: 1024,
      height: 1366,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)'
    },
    {
      type: 'tablet',
      name: 'Samsung Galaxy Tab S8',
      width: 800,
      height: 1280,
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X706B)'
    }
  ];

  const runMobileOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update metrics with improved values
    setMetrics(prev => ({
      ...prev,
      touchTargetSize: Math.min(100, prev.touchTargetSize + 5),
      viewportCompatibility: Math.min(100, prev.viewportCompatibility + 2),
      textReadability: Math.min(100, prev.textReadability + 3),
      navigationEfficiency: Math.min(100, prev.navigationEfficiency + 6),
      loadTimeOnMobile: Math.max(800, prev.loadTimeOnMobile - 100),
      batteryImpact: Math.max(5, prev.batteryImpact - 3),
      dataUsage: Math.max(150, prev.dataUsage - 20),
      gestureSupport: Math.min(100, prev.gestureSupport + 2)
    }));
    
    setLastUpdate(new Date());
    setIsOptimizing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getLoadTimeColor = (time: number) => {
    if (time <= 1000) return 'success';
    if (time <= 2000) return 'warning';
    return 'error';
  };

  const optimizationSuggestions = [
    {
      category: 'Touch Targets',
      suggestion: 'Increase button size to minimum 44px',
      impact: 'High',
      effort: 'Low'
    },
    {
      category: 'Images',
      suggestion: 'Implement responsive images with srcset',
      impact: 'Medium',
      effort: 'Medium'
    },
    {
      category: 'Navigation',
      suggestion: 'Add swipe gestures for better UX',
      impact: 'High',
      effort: 'High'
    },
    {
      category: 'Performance',
      suggestion: 'Enable service worker for offline support',
      impact: 'High',
      effort: 'Medium'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ 
          background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          fontWeight: 'bold'
        }}>
          Mobile Optimization Dashboard
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={showOptimizations ? 'contained' : 'outlined'}
            onClick={() => setShowOptimizations(!showOptimizations)}
            startIcon={showOptimizations ? <VisibilityOff /> : <Visibility />}
            size="small"
          >
            {showOptimizations ? 'Hide' : 'Show'} Suggestions
          </Button>
          <Button
            variant="contained"
            onClick={runMobileOptimization}
            disabled={isOptimizing}
            startIcon={isOptimizing ? <Settings /> : <TrendingUp />}
            sx={{ 
              background: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
              '&:hover': {
                background: 'linear-gradient(45deg, #388E3C, #4CAF50)'
              }
            }}
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
        </Stack>
      </Box>

      {/* Device Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Smartphone sx={{ mr: 1 }} />
            Device Simulation
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {devices.map((device) => (
              <Chip
                key={device.name}
                label={device.name}
                onClick={() => setSelectedDevice(device)}
                variant={selectedDevice.name === device.name ? 'filled' : 'outlined'}
                color={selectedDevice.name === device.name ? 'primary' : 'default'}
                icon={
                  device.type === 'mobile' ? <Smartphone /> : 
                  device.type === 'tablet' ? <Tablet /> : <Computer />
                }
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Current: {selectedDevice.width}x{selectedDevice.height}px
          </Typography>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
        gap: 3,
        mb: 3
      }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.light, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TouchApp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Touch Targets</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {metrics.touchTargetSize}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Meet 44px minimum
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {metrics.touchTargetSize >= 90 ? 
                  <CheckCircle color="success" sx={{ fontSize: 16, mr: 1 }} /> :
                  <Warning color="warning" sx={{ fontSize: 16, mr: 1 }} />
                }
                <Typography variant="caption">
                  {metrics.touchTargetSize >= 90 ? 'Excellent' : 'Needs improvement'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Load Time</Typography>
              </Box>
              <Typography variant="h4" color="primary.main">
                {metrics.loadTimeOnMobile}ms
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Mobile Loading
              </Typography>
              <Chip
                size="small"
                label={
                  metrics.loadTimeOnMobile <= 1000 ? 'Fast' :
                  metrics.loadTimeOnMobile <= 2000 ? 'Good' : 'Slow'
                }
                color={getLoadTimeColor(metrics.loadTimeOnMobile)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.light, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Accessibility sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Readability</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {metrics.textReadability}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Text Clarity
              </Typography>
              <Chip
                size="small"
                label={`Score: ${metrics.textReadability}`}
                color={getScoreColor(metrics.textReadability)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.light, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Data Usage</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {metrics.dataUsage}KB
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Initial Load
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Battery Impact: {metrics.batteryImpact}%
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Box>

      {/* Optimization Suggestions */}
      <AnimatePresence>
        {showOptimizations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Optimization Suggestions
                </Typography>
                <Stack spacing={2}>
                  {optimizationSuggestions.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.category}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {item.suggestion}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={`Impact: ${item.impact}`}
                          size="small"
                          color={item.impact === 'High' ? 'error' : item.impact === 'Medium' ? 'warning' : 'success'}
                        />
                        <Chip
                          label={`Effort: ${item.effort}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Footer */}
      <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 1 }}>
        <Typography variant="caption" color="textSecondary">
          Last optimized: {lastUpdate.toLocaleTimeString()} | 
          Device: {selectedDevice.name} | 
          Overall Mobile Score: {Math.round((metrics.touchTargetSize + metrics.viewportCompatibility + metrics.textReadability + metrics.navigationEfficiency) / 4)}%
        </Typography>
      </Box>

      {/* Floating Action Button for Quick Optimization */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={runMobileOptimization}
          disabled={isOptimizing}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            background: 'linear-gradient(45deg, #4CAF50, #66BB6A)'
          }}
        >
          {isOptimizing ? <Settings /> : <TrendingUp />}
        </Fab>
      )}
    </Box>
  );
};

export default MobileOptimizationDashboard;
