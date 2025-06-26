// src/components/markdown/plugins/ChartFactory.tsx
// -----------------------------------------------------------------------------
// Renders a chart using react-apexcharts / apexcharts. Expects props via YAML
// front-matter in fenced `````chart````` blocks, e.g.:
//
// ```chart
// type: bar
// data:
//   labels: ["A", "B", "C"]
//   series: [10,20,30]
// options:
//   chart: { height: 350 }
// ```
// -----------------------------------------------------------------------------
import React from 'react';
import Chart from 'react-apexcharts';
import { Box, useTheme } from '@mui/material';

export type ChartFactoryProps = {
  type: 'bar' | 'line' | 'pie' | string;
  data: {
    labels: string[];
    series: Array<number> | Array<{ name: string; data: number[] }>;
  };
  options?: any;
};

const ChartFactory: React.FC<ChartFactoryProps> = ({ type, data, options = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Build chartConfig based on `type` and `data`
  const commonOptions = {
    chart: { type, toolbar: { show: true } },
    dataLabels: { enabled: false },
    xaxis: { categories: data.labels },
    yaxis: { title: { text: undefined } },
    theme: { mode: isDark ? 'dark' : 'light' },
    ...options,
  };

  // If series array is simple [10,20,30], wrap into [{ name: 'Series1', data }]
  const series =
    Array.isArray(data.series) && typeof data.series[0] === 'number'
      ? [{ name: 'Series', data: data.series as number[] }]
      : (data.series as Array<{ name: string; data: number[] }>);

  // For pie charts, Apex expects { series: [44,55,41], labels: [...] }
  if (type === 'pie') {
    return (
      <Box sx={{ my: 2 }}>
        <Chart options={{ labels: data.labels, ...commonOptions }} series={data.series as number[]} type="pie" height={350} />
      </Box>
    );
  }

  // Default to line/bar/etc.
  return (
    <Box sx={{ my: 2 }}>
      <Chart options={commonOptions} series={series} type={type as any} height={350} />
    </Box>
  );
};

export default ChartFactory;
