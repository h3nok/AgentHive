import React from 'react';
import { List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../../shared/utils/apiClient';

interface ErrorLog {
  id: string;
  agentId: string;
  message: string;
  timestamp: string;
}

const fetchRecentErrors = async (): Promise<ErrorLog[]> => {
  if (import.meta.env.DEV) {
    // Skip network call during local dev; return empty
    return [];
  }
  try {
    const res = await api.get('/api/logs/recent?limit=5');
    return res.data as ErrorLog[];
  } catch (err) {
    console.warn('Failed to fetch recent errors, returning empty', err);
    return [];
  }
};

const ErrorLogSnippet: React.FC = () => {
  const { data: errors = [] } = useQuery({
    queryKey: ['recent-errors'],
    queryFn: fetchRecentErrors,
    refetchInterval: 30000,
  });
  const navigate = useNavigate();

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        Recent Errors
      </Typography>
      <List dense disablePadding>
        {errors.map(err => (
          <ListItemButton
            key={err.id}
            onClick={() => navigate(`/admin/agents/${err.agentId}/logs?ts=${err.timestamp}`)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemText
              primary={err.message}
              secondary={new Date(err.timestamp).toLocaleString()}
              primaryTypographyProps={{ noWrap: true }}
            />
          </ListItemButton>
        ))}
        {errors.length === 0 && <Typography variant="body2">No recent errors 🎉</Typography>}
      </List>
    </Paper>
  );
};

export default ErrorLogSnippet;
