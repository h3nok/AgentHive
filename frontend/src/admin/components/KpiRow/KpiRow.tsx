import React from 'react';
import Grid from '@mui/material/GridLegacy';
import KPICard from '../KPICard';

// KPI metric shape
export interface KpiMetrics {
  activeAgents: number;
  dailyRequests: number;
  p95Latency: number;
  tokenCost: number;
  errorRate: number;
  throughput: number;
  [key: string]: number;
}

interface Props {
  metrics: Partial<KpiMetrics> | undefined;
}

/**
 * KpiRow – renders six KPICard components in a 6-pack grid.
 */
const KpiRow: React.FC<Props> = ({ metrics }) => {
  if (!metrics) return null;

  const kpis = [
    { label: 'Active Agents', key: 'activeAgents' },
    { label: 'Daily Requests', key: 'dailyRequests' },
    { label: 'P95 Latency', key: 'p95Latency', unit: 'ms' },
    { label: 'Token Cost', key: 'tokenCost', unit: '$' },
    { label: 'Error Rate', key: 'errorRate', unit: '%' },
    { label: 'Throughput', key: 'throughput', unit: 'req/s' },
  ];

  return (
    <Grid container spacing={2}>
      {kpis.map(({ label, key, unit }) => {
        const value = metrics[key as keyof KpiMetrics] ?? 0;
        return (
          <Grid item xs={6} sm={4} md={2} key={key}>
            <KPICard title={label} value={value} unit={unit} />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default KpiRow;
