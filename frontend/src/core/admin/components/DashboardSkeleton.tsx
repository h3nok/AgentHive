import React from 'react';
import { Box, Skeleton, Paper } from '@mui/material';

const DashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
      {/* KPI skeletons */}
      {Array.from({ length: 6 }).map((_, idx) => (
        <Box key={idx}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
      {/* Table placeholder */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={400} />
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardSkeleton;
