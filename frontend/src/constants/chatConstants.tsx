import React from 'react';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// Status messages for input field
export const processingStatuses: string[] = [
  'Please wait while processing...',
  'Analyzing document...',
  'Processing request...',
  'Crunching numbers...',
  'Reviewing data...'
];

// Predefined prompts with agent hints
export const predefinedPrompts = [
  {
    text: 'What is the lease expiration date for each property?',
    icon: <InsertDriveFileOutlinedIcon fontSize="small" />,
    category: 'lease',
    agent: 'lease'
  },
  {
    text: 'Who is responsible for roof repair for each property?',
    icon: <InsertDriveFileOutlinedIcon fontSize="small" />,
    category: 'lease',
    agent: 'lease'
  },
  {
    text: 'Who is responsible for parking lot maintenance for each property?',
    icon: <InsertDriveFileOutlinedIcon fontSize="small" />,
    category: 'lease',
    agent: 'lease'
  },
  {
    text: 'For Decatur and Derby, please review further and provide an educated guess',
    icon: <LightbulbOutlinedIcon fontSize="small" />,
    category: 'analysis',
    agent: 'lease'
  },
  {
    text: 'Build a table with 6 columns. The columns should be labeled (1) property name, (2) Monthly Lease $ (3) Lease Start Date, (4) Term of Lease, (5) Parking Lot Responsibility, and (6) Roof Responsibility',
    icon: <TableChartOutlinedIcon fontSize="small" />,
    category: 'table',
    agent: 'lease'
  },
  {
    text: 'Can you show me all recurring expense schedules?',
    icon: <ScheduleOutlinedIcon fontSize="small" />,
    category: 'expense',
    agent: 'lease'
  },
  {
    text: 'List the alteration covenants along with landlord info for standalone or shopping center properties.',
    icon: <InsertDriveFileOutlinedIcon fontSize="small" />,
    category: 'lease',
    agent: 'lease'
  },
  {
    text: 'Explain the concept of natural language processing.',
    icon: <SmartToyIcon fontSize="small" />,
    category: 'general',
    agent: 'general'
  },
  {
    text: 'What are some creative ways to improve team collaboration?',
    icon: <SmartToyIcon fontSize="small" />,
    category: 'general',
    agent: 'general'
  },
  {
    text: 'How can I optimize my workflow for better productivity?',
    icon: <SmartToyIcon fontSize="small" />,
    category: 'general',
    agent: 'general'
  }
];

// Agent definitions
export const agents = [
  {
    id: 'lease',
    name: 'Lease Agent',
    description: 'Specialized in lease analysis and property management',
    icon: <InsertDriveFileOutlinedIcon />,
    color: '#c8102e', // TSC red color
    avatarBg: 'white',
    tractor: '🚜' // Tractor emoji for lease agent
  }
];

// Shared container styles – instantiated once. Consumers can import & spread
export const containerStyles = {
  flexGrow: 1,
  backgroundColor: 'transparent',
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  height: '100%',
  minHeight: 0,
  transition: 'background-color 0.3s ease-in-out'
}; 