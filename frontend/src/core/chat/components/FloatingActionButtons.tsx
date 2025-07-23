import React from 'react';
import { Box, IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import { Tune, AutoAwesome } from '@mui/icons-material';

export interface FloatingActionButtonsProps {
  isAutomationDrawerOpen: boolean;
  onToggleAutomationDrawer: () => void;
  onNavigateToAgents?: () => void;
  onNavigateToWorkflows?: () => void;
  showNavigationButtons?: boolean;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  isAutomationDrawerOpen,
  onToggleAutomationDrawer,
  onNavigateToAgents,
  onNavigateToWorkflows,
  showNavigationButtons = false
}) => {
  const theme = useTheme();

  return (
    <>
      {/* Main Automation Hub Button */}
      <Tooltip title={`${isAutomationDrawerOpen ? 'Close' : 'Open'} Automation Hub`}>
        <IconButton
          onClick={onToggleAutomationDrawer}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: isAutomationDrawerOpen ? 300 : 20, // Move left when drawer is open
            zIndex: 1200,
            width: 56,
            height: 56,
            bgcolor: alpha(theme.palette.primary.main, isAutomationDrawerOpen ? 0.9 : 0.8),
            color: 'white',
            boxShadow: theme.shadows[6],
            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: theme.palette.primary.main,
              transform: 'scale(1.05)',
              boxShadow: theme.shadows[12],
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother transition for position change
            // Pulse animation when closed
            ...(!isAutomationDrawerOpen && {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                '70%': {
                  boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0)}`,
                },
                '100%': {
                  boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
                },
              },
            }),
          }}
        >
          <Tune sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>

      {/* Optional Navigation Buttons */}
      {showNavigationButtons && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: isAutomationDrawerOpen ? 370 : 100, // Adjust position based on drawer state
            zIndex: 1200,
            display: 'flex',
            gap: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
          }}
        >
          {onNavigateToAgents && (
            <Tooltip title="Navigate to Agent Network">
              <IconButton
                onClick={onNavigateToAgents}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Hub icon would go here - commented out as original */}
                <AutoAwesome />
              </IconButton>
            </Tooltip>
          )}
          
          {onNavigateToWorkflows && (
            <Tooltip title="Navigate to Workflow Hub">
              <IconButton
                onClick={onNavigateToWorkflows}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.2),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <AutoAwesome />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </>
  );
};

export default FloatingActionButtons;
