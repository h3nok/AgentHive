import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Info,
  Schedule,
} from '@mui/icons-material';

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'pending';
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

export interface ActivityCardProps {
  title: string;
  activities: ActivityItem[];
  maxItems?: number;
  showTimestamps?: boolean;
  compact?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  activities,
  maxItems = 5,
  showTimestamps = true,
  compact = false,
}) => {
  const theme = useTheme();

  const getActivityIcon = (item: ActivityItem) => {
    if (item.icon) return item.icon;
    
    switch (item.type) {
      case 'success':
        return <CheckCircle fontSize="small" />;
      case 'warning':
        return <Warning fontSize="small" />;
      case 'error':
        return <Error fontSize="small" />;
      case 'pending':
        return <Schedule fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'pending':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

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
          {activities.length} total activities
        </Typography>
      </Box>

      {/* Activity List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {displayedActivities.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.palette.text.secondary,
            }}
          >
            <Typography variant="body2">No recent activity</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {displayedActivities.map((activity, index) => (
              <ListItem
                key={activity.id}
                sx={{
                  px: 0,
                  py: compact ? 0.5 : 1,
                  borderBottom: index < displayedActivities.length - 1 
                    ? `1px solid ${alpha(theme.palette.divider, 0.1)}` 
                    : 'none',
                  '&:hover': {
                    bgcolor: alpha(getActivityColor(activity.type), 0.05),
                    borderRadius: 1,
                  },
                  transition: 'background-color 0.2s ease',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: alpha(getActivityColor(activity.type), 0.1),
                      color: getActivityColor(activity.type),
                      '& .MuiSvgIcon-root': {
                        fontSize: '0.9rem',
                      },
                    }}
                  >
                    {getActivityIcon(activity)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: theme.palette.text.primary,
                          fontSize: compact ? '0.8rem' : '0.875rem',
                        }}
                      >
                        {activity.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={activity.type}
                        sx={{
                          height: 16,
                          fontSize: '0.65rem',
                          bgcolor: alpha(getActivityColor(activity.type), 0.1),
                          color: getActivityColor(activity.type),
                          '& .MuiChip-label': {
                            px: 0.5,
                          },
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      {activity.description && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            display: 'block',
                            mb: 0.5,
                            fontSize: compact ? '0.7rem' : '0.75rem',
                          }}
                        >
                          {activity.description}
                        </Typography>
                      )}
                      {showTimestamps && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.disabled,
                            fontSize: '0.7rem',
                          }}
                        >
                          {activity.timestamp}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      {activities.length > maxItems && (
        <Box
          sx={{
            mt: 1,
            pt: 1,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
            }}
          >
            +{activities.length - maxItems} more activities
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ActivityCard;
