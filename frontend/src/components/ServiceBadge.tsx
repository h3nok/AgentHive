import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface ServiceBadgeProps {
  icon: React.ReactNode;
  label: string;
  delay?: number;
}

export const ServiceBadge = ({ icon, label, delay = 0 }: ServiceBadgeProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.05 }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 1,
        minWidth: 120,
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Box sx={{ fontSize: 40, mb: 1 }}>{icon}</Box>
      <Typography variant="caption" align="center" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  </motion.div>
);
