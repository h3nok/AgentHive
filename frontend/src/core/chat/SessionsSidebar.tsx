import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Paper,
  Stack,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

export interface Session {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: string;
  messageCount?: number;
}

interface SessionsSidebarProps {
  sessions: Session[];
  activeSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  isLoading?: boolean;
}

const SessionsSidebar: React.FC<SessionsSidebarProps> = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  isLoading = false,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        width: 280,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" color="primary">
            Chat Sessions
          </Typography>
          <IconButton
            onClick={onNewSession}
            size="small"
            color="primary"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Sessions List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading sessions...
            </Typography>
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Start a new chat to begin
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {sessions.map((session) => (
              <ListItemButton
                key={session.id}
                selected={session.id === activeSessionId}
                onClick={() => onSessionSelect(session.id)}
                sx={{
                  py: 2,
                  px: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={session.id === activeSessionId ? 600 : 400}
                      noWrap
                    >
                      {session.title}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {session.lastMessage && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: '100%' }}
                        >
                          {session.lastMessage}
                        </Typography>
                      )}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(session.updatedAt), {
                            addSuffix: true,
                          })}
                        </Typography>
                        {session.messageCount && (
                          <Chip
                            label={session.messageCount}
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 18 }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  }
                />
                <IconButton size="small" sx={{ ml: 1 }}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center">
          {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Paper>
  );
};

export default SessionsSidebar;
