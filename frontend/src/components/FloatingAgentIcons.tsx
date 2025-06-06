import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import HubIcon from '@mui/icons-material/Hub';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CodeIcon from '@mui/icons-material/Code';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StorageIcon from '@mui/icons-material/Storage';

interface AgentIcon {
  icon: React.ReactElement;
  label: string;
  x: string;
  y: string;
  delay: number;
  size?: number;
}

const icons: AgentIcon[] = [
  { icon: <InsertDriveFileOutlinedIcon fontSize="inherit" />, label: 'Lease Agent', x: '10%', y: '18%', delay: 0 },
  { icon: <SmartToyIcon fontSize="inherit" />, label: 'General Assistant', x: '80%', y: '22%', delay: 0.6 },
  { icon: <CodeIcon fontSize="inherit" />, label: 'Code Assistant', x: '15%', y: '70%', delay: 1.2 },
  { icon: <AnalyticsIcon fontSize="inherit" />, label: 'Data Analyst', x: '75%', y: '75%', delay: 1.8 },
  { icon: <StorageIcon fontSize="inherit" />, label: 'Database Expert', x: '50%', y: '10%', delay: 2.4 },
];

const FloatingAgentIcons: React.FC = () => {
  return (
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {icons.map(({ icon, label, x, y, delay, size = 32 }, idx) => (
        <Tooltip key={idx} title={label} placement="top" arrow>
          <motion.div
            style={{ position: 'absolute', left: x, top: y, fontSize: size, color: '#c8102e', filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
            animate={{ 
              y: [-12, 12, -12], 
              x: [0, 24, -24, 0],
              rotate: [0, 6, -6, 0],
              opacity: [0, 0.85, 0.85, 0]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            {icon}
          </motion.div>
        </Tooltip>
      ))}
    </Box>
  );
};

export default FloatingAgentIcons; 