// Enterprise Feature Toggle System
import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Switch, 
  FormControlLabel, 
  Typography,
  Chip,
  Divider,
  IconButton,
  useTheme
} from '@mui/material';
import {
  AutoFixHigh as QuantumIcon,
  ThreeDRotation as ThreeDIcon,
  RecordVoiceOver as VoiceIcon,
  Psychology as PredictiveIcon,
  Visibility as MonitorIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  EnterpriseFeatureContext, 
  defaultFeatures, 
  type EnterpriseFeatures 
} from '../../app/providers/EnterpriseFeatureContext';

export const EnterpriseFeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [features, setFeatures] = useState<EnterpriseFeatures>(defaultFeatures);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleFeature = useCallback((feature: keyof EnterpriseFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  }, []);

  const isAnyFeatureEnabled = Object.values(features).some(Boolean);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const featureConfigs = [
    {
      key: 'quantumEnhancement' as keyof EnterpriseFeatures,
      label: 'Quantum Enhancement',
      description: 'Advanced quantum field effects and neural network visualizations',
      icon: <QuantumIcon />,
      color: '#ff6b6b',
      experimental: true,
    },
    {
      key: 'threeDEnvironment' as keyof EnterpriseFeatures,
      label: '3D Environment',
      description: 'Immersive three-dimensional chat visualization',
      icon: <ThreeDIcon />,
      color: '#4ecdc4',
      experimental: true,
    },
    {
      key: 'voiceInterface' as keyof EnterpriseFeatures,
      label: 'Voice Interface',
      description: 'Advanced voice commands and real-time audio analysis',
      icon: <VoiceIcon />,
      color: '#45b7d1',
      experimental: false,
    },
    {
      key: 'predictiveUI' as keyof EnterpriseFeatures,
      label: 'Predictive UI',
      description: 'AI-powered intent prediction and contextual suggestions',
      icon: <PredictiveIcon />,
      color: '#f39c12',
      experimental: false,
    },
    {
      key: 'enterpriseMonitoring' as keyof EnterpriseFeatures,
      label: 'Enterprise Monitoring',
      description: 'Real-time performance and accessibility analytics',
      icon: <MonitorIcon />,
      color: '#8e44ad',
      experimental: false,
    },
    {
      key: 'smartSuggestions' as keyof EnterpriseFeatures,
      label: 'Smart Suggestions',
      description: 'Contextual AI suggestions and conversation enhancement',
      icon: <PredictiveIcon />,
      color: '#27ae60',
      experimental: false,
    },
  ];

  return (
    <EnterpriseFeatureContext.Provider value={{ features, toggleFeature, isAnyFeatureEnabled, openSettings }}>
      {children}

      {/* Enterprise Features Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(200,16,46,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(200,16,46,0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(200,16,46,0.3)' : 'rgba(200,16,46,0.2)'}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #c8102e 0%, #a50d24 100%)'
            : 'linear-gradient(135deg, #c8102e 0%, #a50d24 100%)',
          color: 'white',
          mb: 2,
          fontWeight: 600
        }}>
          Settings
          <IconButton 
            onClick={() => setSettingsOpen(false)} 
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Enable cutting-edge enterprise features to enhance your chat experience with AI-powered capabilities.
          </Typography>
          
          {featureConfigs.map((config, index) => (
            <Box key={config.key}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                py: 2,
                px: 1,
                borderRadius: 2,
                '&:hover': {
                  background: 'rgba(0,0,0,0.02)',
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ 
                    mr: 2, 
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `${config.color}20`,
                  }}>
                    {config.icon}
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {config.label}
                      </Typography>
                      {config.experimental && (
                        <Chip 
                          label="EXPERIMENTAL" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#ff6b6b', 
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }} 
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {config.description}
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features[config.key]}
                      onChange={() => toggleFeature(config.key)}
                      sx={{
                        '& .MuiSwitch-thumb': {
                          background: features[config.key] ? config.color : undefined,
                        },
                        '& .MuiSwitch-track': {
                          background: features[config.key] ? `${config.color}40` : undefined,
                        }
                      }}
                    />
                  }
                  label=""
                />
              </Box>
              {index < featureConfigs.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
          
          {isAnyFeatureEnabled && (
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              borderRadius: 2, 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                ⚡ Enhanced Experience Active
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Your chat interface now includes revolutionary AI-powered features. 
                Performance monitoring is active to ensure optimal experience.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </EnterpriseFeatureContext.Provider>
  );
};
