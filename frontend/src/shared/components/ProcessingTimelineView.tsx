import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProcessingStep } from '../features/processing/processingSlice';
import { Box, Chip, useTheme, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { Theme } from '@mui/material/styles';

interface Props {
  sessionId: string | null;
}

const stateColor = (state: 'pending' | 'ok' | 'error', theme: Theme) => {
  switch (state) {
    case 'ok':
      return theme.palette.success.main;
    case 'error':
      return theme.palette.error.main;
    default:
      return theme.palette.text.secondary;
  }
};

const ProcessingTimelineView: React.FC<Props> = ({ sessionId }) => {
  const theme = useTheme<Theme>();
  const timeline = useSelector<RootState, ProcessingStep[]>(
    (s: any) => (sessionId && s.processing ? s.processing[sessionId] : []) || []
  );

  if (!sessionId || timeline.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 2 }}>
      <AnimatePresence initial={false}>
        {timeline.map((step) => (
          <motion.div
            key={step.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <Chip
              icon={
                step.state === 'pending' ? (
                  <CircularProgress size={14}>
                    {/* placeholder */}
                  </CircularProgress>
                ) : undefined
              }
              label={step.label}
              variant={step.state === 'pending' ? 'outlined' : 'filled'}
              sx={{
                bgcolor:
                  step.state === 'pending' ? 'transparent' : stateColor(step.state, theme) + '20',
                color:
                  step.state === 'pending' ? theme.palette.text.secondary : stateColor(step.state, theme),
                borderColor: stateColor(step.state, theme),
                fontWeight: 500,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default ProcessingTimelineView; 