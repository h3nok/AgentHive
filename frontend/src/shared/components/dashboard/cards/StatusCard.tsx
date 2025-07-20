import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Avatar,
  Stack,
} from '@mui/material';

export interface StatusItem {
  id: string;
  label: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  description?: string;
  progress?: number; // 0-100
}

export interface StatusCardProps {
  title: string;
  items: StatusItem[];
  compact?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  items,
  compact = false,
}) => {
  const theme = useTheme();

  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'critical':
        return theme.palette.error.main;
      case 'offline':
        return theme.palette.text.disabled;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status: StatusItem['status']) => {
    return (
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: getStatusColor(status),
          boxShadow: `0 0 8px ${alpha(getStatusColor(status), 0.4)}`,
          animation: status === 'healthy' ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { boxShadow: `0 0 8px ${alpha(getStatusColor(status), 0.4)}` },
            '50%': { boxShadow: `0 0 16px ${alpha(getStatusColor(status), 0.8)}` },
            '100%': { boxShadow: `0 0 8px ${alpha(getStatusColor(status), 0.4)}` },
          },
        }}
      />
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {items.length} components
        </Typography>
      </Box>

      {/* Status Items */}
      <Stack spacing={compact ? 1 : 2} sx={{ flex: 1 }}>
        {items.map((item) => (
          <Box
            key={item.id}
            sx={{
              p: compact ? 1 : 1.5,
              borderRadius: 2,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(getStatusColor(item.status), 0.05)} 0%, transparent 70%)`
                : `linear-gradient(135deg, ${alpha(getStatusColor(item.status), 0.03)} 0%, transparent 70%)`,
              border: `1px solid ${alpha(getStatusColor(item.status), 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(getStatusColor(item.status), 0.15)}`,
              },
            }}
          >
            {/* Item Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: compact ? 0.5 : 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(item.status)}
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: compact ? '0.8rem' : '0.875rem',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: getStatusColor(item.status),
                    fontSize: compact ? '0.8rem' : '0.875rem',
                  }}
                >
                  {item.value}
                </Typography>
                <Chip
                  size="small"
                  label={item.status}
                  sx={{
                    height: compact ? 16 : 20,
                    fontSize: compact ? '0.6rem' : '0.7rem',
                    bgcolor: alpha(getStatusColor(item.status), 0.1),
                    color: getStatusColor(item.status),
                    '& .MuiChip-label': {
                      px: compact ? 0.5 : 1,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Progress Bar */}
            {item.progress !== undefined && (
              <Box sx={{ mb: compact ? 0.5 : 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={item.progress}
                  sx={{
                    height: compact ? 4 : 6,
                    borderRadius: 3,
                    bgcolor: alpha(getStatusColor(item.status), 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${getStatusColor(item.status)}, ${alpha(getStatusColor(item.status), 0.8)})`,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: compact ? '0.65rem' : '0.7rem',
                    mt: 0.5,
                    display: 'block',
                  }}
                >
                  {item.progress}%
                </Typography>
              </Box>
            )}

            {/* Description */}
            {item.description && !compact && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  lineHeight: 1.3,
                }}
              >
                {item.description}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default StatusCard;
