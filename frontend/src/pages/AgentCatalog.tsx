import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper, Button, TextField, InputAdornment, ToggleButton, ToggleButtonGroup, IconButton, Chip } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentMeta {
  name: string;
  description: string;
  icon: JSX.Element;
  detailsRoute: string;
  category: 'HR' | 'Ops' | 'Data' | 'IT' | 'Other';
  status: 'healthy' | 'degraded' | 'offline';
  capabilities: string[];
}

const agents: AgentMeta[] = [
  {
    name: 'Lease Abstraction Agent',
    description: 'See expiring leases and key clauses in seconds.',
    icon: <StorefrontIcon fontSize="large" sx={{ color: 'primary.main' }} />,
    detailsRoute: '/lease-agent',
    category: 'Ops',
    status: 'healthy',
    capabilities: ['Lease OCR', 'Key Clauses', 'Expiration Alerts'],
  },
  {
    name: 'HR Task Automation',
    description: 'Check PTO balances and request time-off without leaving chat.',
    icon: <PeopleIcon fontSize="large" sx={{ color: 'primary.main' }} />,
    detailsRoute: '/agents/hr-task',
    category: 'HR',
    status: 'offline',
    capabilities: ['PTO Balance', 'Time-Off Request', 'Benefits FAQ'],
  },
  {
    name: 'Instant Sales Insights',
    description: 'Ad-hoc revenue trends, variance analysis, and visual summaries.',
    icon: <InventoryIcon fontSize="large" sx={{ color: 'primary.main' }} />,
    detailsRoute: '/agents/sales-insights',
    category: 'Data',
    status: 'offline',
    capabilities: ['Revenue Trends', 'Variance Analysis', 'Dashboards'],
  },
  {
    name: 'Tech Support Simplified',
    description: 'Guided fixes or auto-generated ServiceNow tickets.',
    icon: <SupportAgentIcon fontSize="large" sx={{ color: 'primary.main' }} />,
    detailsRoute: '/agents/tech-support',
    category: 'IT',
    status: 'offline',
    capabilities: ['Guided Fixes', 'Ticket Creation', 'Knowledge Base'],
  },
  {
    name: 'Intelligent Request Routing',
    description: 'Automatically selects the right agent or GPT model for you.',
    icon: <EngineeringIcon fontSize="large" sx={{ color: 'primary.main' }} />,
    detailsRoute: '/agents/request-routing',
    category: 'Ops',
    status: 'offline',
    capabilities: ['Agent Selection', 'Model Routing', 'Contextual Handoff'],
  },
];

const AgentCatalog: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'HR' | 'Ops' | 'Data' | 'IT' | 'Other'>('All');

  // Debounce helper
  const useDebounce = (value: string, delay = 100) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
  };

  const debouncedQuery = useDebounce(query);

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (filter !== 'All') {
      list = list.filter((a) => a.category === filter);
    }
    if (debouncedQuery) {
      list = list.filter((a) =>
        (a.name + a.description).toLowerCase().includes(debouncedQuery.toLowerCase()),
      );
    }
    return list;
  }, [debouncedQuery, filter]);

  // Ensure user always starts at top of page when arriving here
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Ref for the search field to support Alt + /
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Global key shortcut to focus search (Alt + /)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: theme.palette.mode === 'dark' ? '#1E1E1E' : '#F8F0E8', py: 8 }}>
      <Container maxWidth="lg">
        {/* Heading removed; now in TopNav */}
        {/* Search + Filters */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, gap: 2 }}>
          {/* Filters */}
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, val) => val && setFilter(val)}
            size="small"
            color="primary"
          >
            {['All', 'HR', 'Ops', 'Data', 'IT'].map((label) => (
              <ToggleButton key={label} value={label} sx={{ textTransform: 'none', px: 2 }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Search Bar */}
          <TextField
            placeholder="Search agents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            variant="outlined"
            size="small"
            inputRef={searchRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', md: '480px' },
              backgroundColor: theme.palette.mode === 'dark' ? '#2b2b2b' : '#fff',
              borderRadius: 2,
            }}
            aria-label="Search agents"
          />
        </Box>

        {/* CARD GRID */}
        <Box component={motion.div} layout sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(auto-fit, minmax(220px, 1fr))',
            md: 'repeat(auto-fit, minmax(260px, 1fr))',
            xl: 'repeat(auto-fit, minmax(280px, 1fr))',
          },
          gap: { xs: 2, md: 4 },
        }}>
          <AnimatePresence>
            {filteredAgents.map((agent) => (
              <motion.div key={agent.name} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                <Paper variant="outlined" sx={{
                  p: { xs: 2, md: 3 },
                  height: '100%',
                  borderRadius: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(30,30,30,0.95)'
                    : 'rgba(255,255,255,0.95)',
                  boxShadow: 'none',
                  transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: theme.shadows[1],
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                  },
                }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(agent.detailsRoute);
                  }}
                  role="button"
                  aria-label={`Launch ${agent.name}`}
                >
                  {/* Status Dot */}
                  <Box sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: agent.status === 'healthy'
                      ? 'success.main'
                      : agent.status === 'degraded'
                      ? 'warning.main'
                      : 'error.main',
                    animation: ['degraded', 'offline'].includes(agent.status) ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.6)', opacity: 0.6 },
                      '100%': { transform: 'scale(1)', opacity: 1 },
                    },
                  }}
                    aria-label={`${agent.status} status`}
                  />

                  {/* Hover Actions */}
                  <Box
                    className="card-actions"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 36,
                      display: 'flex',
                      gap: 1,
                      opacity: 0,
                      transform: 'translateY(-6px)',
                      transition: 'opacity 0.2s ease-in-out 0.15s, transform 0.2s ease-out 0.15s',
                      pointerEvents: 'none',
                    }}
                  >
                    <IconButton size="small" aria-label="Docs" tabIndex={-1} onClick={() => navigate(`${agent.detailsRoute}/docs`)}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="Permissions" tabIndex={-1} onClick={() => navigate(`${agent.detailsRoute}/permissions`)}>
                      <LockOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #c8102e1A 0%, #ff4b2b1A 100%)'
                      : 'linear-gradient(135deg, #8B45131A 0%, #A67B5B1A 100%)',
                    mb: 2,
                  }}>
                    {agent.icon}
                  </Box>
                  <Typography variant="h6" sx={{
                    mt: 2,
                    mb: 1,
                    fontWeight: 700,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #c8102e 0%, #ff4b2b 100%)'
                      : 'linear-gradient(90deg, #8B4513 0%, #A67B5B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {agent.name}
                  </Typography>
                  <Typography variant="body2" sx={{
                    opacity: 0.8,
                    color: theme.palette.text.secondary,
                    mb: 1.5,
                  }}>
                    {agent.description}
                  </Typography>
                  {/* Capabilities Quick Glance */}
                  <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    justifyContent: 'center',
                    mb: 2,
                  }}>
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <Chip key={cap} label={cap} size="small" variant="outlined" sx={{ fontSize: '0.65rem', borderRadius: 1 }} />
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 3,
                      py: 1.2,
                      px: 3,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(90deg, #c8102e 0%, #ff4b2b 100%)'
                        : 'linear-gradient(90deg, #8B4513 0%, #A67B5B 100%)',
                      color: '#fff',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 2px 8px #c8102e33'
                        : '0 2px 8px #8B451333',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(90deg, #ff4b2b 0%, #c8102e 100%)'
                          : 'linear-gradient(90deg, #A67B5B 0%, #8B4513 100%)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 12px #c8102e44'
                          : '0 4px 12px #8B451344',
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(agent.detailsRoute);
                    }}
                  >
                    Launch ▶
                  </Button>
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  );
};

export default AgentCatalog;