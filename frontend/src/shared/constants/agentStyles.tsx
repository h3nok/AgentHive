import React from 'react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CodeIcon from '@mui/icons-material/Code';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StorageIcon from '@mui/icons-material/Storage';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

/**
 * A centralised definition for all chat/agent avatars that appear across the UI.
 *
 * The avatar definition is intentionally kept framework-agnostic; each entry
 * exposes colours and the rendered icon component so it can be consumed by both
 * MUI-driven and Tailwind-driven components without duplication.
 *
 * NOTE: When you introduce a brand-new agent, simply extend this object – no
 * additional code-changes should be necessary in the consumer components.
 */
export const agentStyles = {
  lease: {
    icon: <InsertDriveFileOutlinedIcon fontSize="small" />,
    color: '#c8102e', // Red colour
    bgColor: 'rgba(200, 16, 46, 0.1)',
    borderColor: '#c8102e',
    name: 'Lease Agent',
  },
  assistant: {
    icon: <SmartToyIcon fontSize="small" />,
    color: '#1976d2', // MUI blue
    bgColor: 'rgba(25, 118, 210, 0.1)',
    borderColor: '#1976d2',
    name: 'Assistant',
  },
  agent: {
    icon: <SmartToyIcon fontSize="small" />,
    color: '#1976d2',
    bgColor: 'rgba(25, 118, 210, 0.1)',
    borderColor: '#1976d2',
    name: 'Agent',
  },
  gura: {
    icon: <SmartToyIcon fontSize="small" />,
    color: '#8C54FF', // Purple
    bgColor: 'rgba(140, 84, 255, 0.1)',
    borderColor: '#8C54FF',
    name: 'Hey GURA',
  },
  hr: {
    icon: <PsychologyIcon fontSize="small" />,
    color: '#00897B', // Teal
    bgColor: 'rgba(0, 137, 123, 0.1)',
    borderColor: '#00897B',
    name: 'Ask HR',
  },
  deisy: {
    icon: <EmojiEmotionsIcon fontSize="small" />,
    color: '#FF6D00', // Orange
    bgColor: 'rgba(255, 109, 0, 0.1)',
    borderColor: '#FF6D00',
    name: 'Deisy',
  },
  coder: {
    icon: <CodeIcon fontSize="small" />,
    color: '#8250DF', // Purple
    bgColor: 'rgba(130, 80, 223, 0.1)',
    borderColor: '#8250DF',
    name: 'Code Assistant',
  },
  analyst: {
    icon: <AnalyticsIcon fontSize="small" />,
    color: '#2E7D32', // Green
    bgColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: '#2E7D32',
    name: 'Data Analyst',
  },
  database: {
    icon: <StorageIcon fontSize="small" />,
    color: '#0288D1', // Blue
    bgColor: 'rgba(2, 136, 209, 0.1)',
    borderColor: '#0288D1',
    name: 'Database Expert',
  },
  general: {
    icon: <SmartToyIcon fontSize="small" />,
    color: '#d97706', // Rich honey/amber color
    bgColor: 'rgba(217, 119, 6, 0.08)', // Subtle honey background
    borderColor: '#d97706',
    name: 'General Assistant',
  },
} as const;

export type AgentKey = keyof typeof agentStyles;
export type AgentStyle = (typeof agentStyles)[AgentKey]; 