import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  useTheme,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import AccountTree from '@mui/icons-material/AccountTree';
import Psychology from '@mui/icons-material/Psychology';

export interface ContextDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback fired when the drawer requests to be closed */
  onClose: () => void;
  /** Optional workflow / command details to render */
  workflow?: {
    id: string;
    name: string;
    status: string;
  } | null;
}

/**
 * Minimal right-hand context drawer. Replaces the old Automation Hub drawer.
 * Will be expanded with step timelines, parameters, and controls in later iterations.
 */
const ContextDrawer: React.FC<ContextDrawerProps> = ({ open, onClose, workflow }) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '90%', sm: 380 },
          backdropFilter: 'blur(8px)',
          backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(18,18,18,0.8)'
              : 'rgba(255,255,255,0.8)',
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            {workflow ? <AccountTree /> : <Psychology />}Context
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        {workflow ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              {workflow.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: {workflow.status}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nothing running right now.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default ContextDrawer;
