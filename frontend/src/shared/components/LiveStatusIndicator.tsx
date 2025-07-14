import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  IconButton,
  Popover,
  Stack,
  alpha,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  Circle,
  Refresh,
  SignalWifi4Bar,
  SignalWifi3Bar,
  SignalWifi2Bar,
  SignalWifi1Bar,
  SignalWifiOff,
  CloudDone,
  CloudOff,
  Warning,
  AccessTime
} from '@mui/icons-material';
import { useBackendConnection } from '../hooks/useBackendConnection';

interface LiveStatusIndicatorProps {
  compact?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}

const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({ 
  compact = false, 
  showLabel = true,
  onClick 
}) => {
  const theme = useTheme();
  const { status, reconnect, isHealthy } = useBackendConnection();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const getStatusColor = () => {
    if (!status.isConnected) return theme.palette.error.main;
    
    switch (status.connectionQuality) {
      case 'excellent': return theme.palette.success.main;
      case 'good': return theme.palette.warning.light;
      case 'poor': return theme.palette.warning.main;
      default: return theme.palette.error.main;
    }
  };

  const getStatusIcon = () => {
    if (status.isConnecting) {
      return <Refresh sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} />;
    }
    
    if (!status.isConnected) {
      return <CloudOff sx={{ fontSize: 16 }} />;
    }

    switch (status.connectionQuality) {
      case 'excellent': return <SignalWifi4Bar sx={{ fontSize: 16 }} />;
      case 'good': return <SignalWifi3Bar sx={{ fontSize: 16 }} />;
      case 'poor': return <SignalWifi2Bar sx={{ fontSize: 16 }} />;
      default: return <SignalWifiOff sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusText = () => {
    if (status.isConnecting) return 'Connecting...';
    if (!status.isConnected) return 'Offline';
    
    switch (status.connectionQuality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor';
      default: return 'Offline';
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      onClick();
      return;
    }
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    reconnect();
    handleClose();
  };

  const formatLastConnected = () => {
    if (!status.lastConnected) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - status.lastConnected.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const statusColor = getStatusColor();
  const isPopoverOpen = Boolean(anchorEl);

  if (compact) {
    return (
      <>
        <Tooltip title={`Backend: ${getStatusText()}`}>
          <Box
            onClick={handleClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 0.5,
              borderRadius: 1,
              '&:hover': {
                bgcolor: alpha(statusColor, 0.1)
              }
            }}
          >
            <Circle
              sx={{
                fontSize: 8,
                color: statusColor,
                filter: status.isConnected ? 'drop-shadow(0 0 3px currentColor)' : 'none',
                animation: status.isConnecting ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }}
            />
          </Box>
        </Tooltip>
        {renderPopover()}
      </>
    );
  }

  return (
    <>
      <Chip
        icon={getStatusIcon()}
        label={showLabel ? getStatusText() : undefined}
        onClick={handleClick}
        size="small"
        sx={{
          bgcolor: alpha(statusColor, 0.1),
          color: statusColor,
          border: `1px solid ${alpha(statusColor, 0.3)}`,
          fontWeight: 600,
          fontSize: '0.75rem',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: alpha(statusColor, 0.15),
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          },
          transition: 'all 0.2s ease-in-out',
          // Pulse animation for connecting state
          ...(status.isConnecting && {
            animation: 'pulse 1.5s ease-in-out infinite'
          }),
          // Glow effect for excellent connection
          ...(status.connectionQuality === 'excellent' && {
            boxShadow: `0 0 10px ${alpha(statusColor, 0.4)}`
          }),
          // Add keyframes for animations
          '@keyframes pulse': {
            '0%': { opacity: 1 },
            '50%': { opacity: 0.5 },
            '100%': { opacity: 1 }
          },
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }}
      />
      {renderPopover()}
    </>
  );

  function renderPopover() {
    return (
      <Popover
        open={isPopoverOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            p: 2,
            minWidth: 280,
            maxWidth: 320,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.95)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.default, 0.95)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: 2
          }
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: alpha(statusColor, 0.1),
                  border: `1px solid ${alpha(statusColor, 0.3)}`
                }}
              >
                {getStatusIcon()}
              </Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Backend Status
              </Typography>
            </Stack>
            
            <IconButton
              size="small"
              onClick={handleReconnect}
              disabled={status.isConnecting}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <Refresh 
                sx={{ 
                  fontSize: 16,
                  animation: status.isConnecting ? 'spin 1s linear infinite' : 'none'
                }} 
              />
            </IconButton>
          </Stack>

          {/* Connection Status */}
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Connection
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{ color: statusColor }}
              >
                {getStatusText()}
              </Typography>
            </Stack>

            {status.isConnected && (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Latency
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {status.latency ? `${status.latency}ms` : '—'}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Quality
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getStatusIcon()}
                    <Typography variant="body2" fontWeight={500}>
                      {status.connectionQuality}
                    </Typography>
                  </Box>
                </Stack>
              </>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Last Connected
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatLastConnected()}
              </Typography>
            </Stack>

            {status.error && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Warning sx={{ fontSize: 16, color: theme.palette.error.main, mt: 0.1 }} />
                  <Typography variant="caption" color="error">
                    {status.error}
                  </Typography>
                </Stack>
              </Box>
            )}

            {status.retryCount > 0 && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccessTime sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                  <Typography variant="caption" color="warning.main">
                    Retry attempt {status.retryCount}/{3}
                  </Typography>
                </Stack>
              </Box>
            )}
          </Stack>

          {/* Connection Quality Bar */}
          {status.isConnected && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Signal Strength
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  status.connectionQuality === 'excellent' ? 100 :
                  status.connectionQuality === 'good' ? 75 :
                  status.connectionQuality === 'poor' ? 40 : 0
                }
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.divider, 0.2),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: statusColor
                  }
                }}
              />
            </Box>
          )}
        </Stack>
      </Popover>
    );
  }
};

export default LiveStatusIndicator;
