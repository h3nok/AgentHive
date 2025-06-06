import React from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import LiveSparkPanel from './LiveSparkPanel/LiveSparkPanel';
import ErrorLogSnippet from './ErrorLogSnippet/ErrorLogSnippet';
import { Paper, Box } from '@mui/material';

const ResponsiveGridLayout = WidthProvider(Responsive);

const layout = [
  { i: 'spark', x: 0, y: 0, w: 12, h: 6 },
  { i: 'errors', x: 0, y: 6, w: 12, h: 6 },
];

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Paper
    sx={{
      height: '100%',
      p: 1,
      borderRadius: 2,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {/* drag handle */}
    <Box className="drag-handle" sx={{ cursor: 'move', height: 16, mb: 0.5 }} />
    {children}
  </Paper>
);

const PlotsGrid: React.FC = () => (
  <ResponsiveGridLayout
    className="layout"
    layouts={{ lg: layout, md: layout, sm: layout }}
    cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
    rowHeight={25}
    draggableHandle=".drag-handle"
    isResizable
  >
    <div key="spark">
      <Card>
        <LiveSparkPanel />
      </Card>
    </div>
    <div key="errors">
      <Card>
        <ErrorLogSnippet />
      </Card>
    </div>
  </ResponsiveGridLayout>
);

export default PlotsGrid;
