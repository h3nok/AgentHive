import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  description?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  progress?: number; // 0-100
  status?: 'healthy' | 'warning' | 'critical';
  animated?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendValue,
  description,
  icon,
  color = 'primary',
  progress,
  status,
  animated = true,
}) => {
  const theme = useTheme();

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp fontSize="small" sx={{ color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDown fontSize="small" sx={{ color: theme.palette.error.main }} />;
      case 'stable':
        return <TrendingFlat fontSize="small" sx={{ color: theme.palette.warning.main }} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'critical':
        return theme.palette.error.main;
      default:
        return theme.palette[color].main;
    }
  };

  const getGradientBackground = () => {
    const statusColor = getStatusColor();
    return theme.palette.mode === 'dark'
      ? `
        linear-gradient(135deg, ${alpha(statusColor, 0.15)} 0%, transparent 70%),
        radial-gradient(circle at 80% 20%, ${alpha(statusColor, 0.08)} 0%, transparent 50%)
      `
      : `
        linear-gradient(135deg, ${alpha(statusColor, 0.08)} 0%, transparent 70%),
        radial-gradient(circle at 80% 20%, ${alpha(statusColor, 0.04)} 0%, transparent 50%)
      `;
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: getGradientBackground(),
        borderRadius: 2,
        overflow: 'hidden',
        '&::before': animated ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${alpha(getStatusColor(), 0.1)}, transparent)`,
          animation: 'shimmer 3s infinite',
        } : {},
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      }}
    >
      {/* Header with Icon and Status */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(getStatusColor(), 0.1),
                color: getStatusColor(),
                '& .MuiSvgIcon-root': {
                  fontSize: '1.2rem',
                },
              }}
            >
              {icon}
            </Avatar>
          )}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.75rem',
            }}
          >
            {title}
          </Typography>
        </Box>

        {status && (
          <Chip
            size="small"
            label={status}
            sx={{
              bgcolor: alpha(getStatusColor(), 0.1),
              color: getStatusColor(),
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 20,
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
        )}
      </Box>

      {/* Main Value */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${getStatusColor()}, ${alpha(getStatusColor(), 0.7)})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {unit && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              {unit}
            </Typography>
          )}
        </Box>

        {/* Trend Indicator */}
        {(trend || trendValue) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getTrendIcon()}
            {trendValue && (
              <Typography
                variant="caption"
                sx={{
                  color: trend === 'up' 
                    ? theme.palette.success.main 
                    : trend === 'down' 
                    ? theme.palette.error.main 
                    : theme.palette.warning.main,
                  fontWeight: 600,
                }}
              >
                {trendValue}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Progress Bar */}
      {progress !== undefined && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(getStatusColor(), 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: `linear-gradient(90deg, ${getStatusColor()}, ${alpha(getStatusColor(), 0.8)})`,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              mt: 0.5,
              display: 'block',
            }}
          >
            {progress}% of target
          </Typography>
        </Box>
      )}

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.8rem',
            lineHeight: 1.4,
            mt: 'auto',
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default MetricCard;
