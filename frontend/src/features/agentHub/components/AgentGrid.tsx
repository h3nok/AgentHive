import React from 'react';
import { Grid } from '@mui/material';
import AgentCard, { Agent } from './AgentCard';

import { SxProps, Theme } from '@mui/material';

interface AgentGridProps {
  agents: Agent[];
  onAgentMore?: (agent: Agent) => void;
  xs?: number; // grid size overrides
  sm?: number;
  md?: number;
  lg?: number;
  sx?: SxProps<Theme>;
}

/**
 * Responsive grid that displays a collection of agents using AgentCard.
 * Keeps layout concerns separate from higher-level dashboard logic.
 */
const AgentGrid: React.FC<AgentGridProps> = ({
  agents,
  onAgentMore,
  xs = 12,
  sm = 6,
  md = 4,
  lg = 3,
  sx,
}) => {
  return (
    <Grid container spacing={3} sx={sx}>
      {agents.map((agent) => (
        <Grid key={agent.id} item xs={xs} sm={sm} md={md} lg={lg}>
          <AgentCard agent={agent} onMore={onAgentMore} />
        </Grid>
      ))}
    </Grid>
  );
};

export default AgentGrid;
