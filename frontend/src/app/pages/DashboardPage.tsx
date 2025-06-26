import React from 'react';
import WorkflowRenderer from '@/components/WorkflowRenderer';
import ProcessingTimelineView from '@/components/ProcessingTimelineView';
import ChartFactory from '@/components/ChartFactory';
import StatusBadge from '@/components/StatusBadge';
import ErrorBoundary from '@/components/ErrorBoundary';

const DashboardPage: React.FC = () => {
  // Mock data for components - replace with real data from your state management
  const mockSteps = [
    { id: '1', name: 'Initialize', type: 'system', status: 'completed' as const, timestamp: new Date() },
    { id: '2', name: 'Process', type: 'agent', status: 'running' as const, timestamp: new Date() },
    { id: '3', name: 'Complete', type: 'system', status: 'pending' as const, timestamp: new Date() }
  ];

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full overflow-auto p-4 space-y-6 bg-background-default dark:bg-slate-900">
        <WorkflowRenderer steps={mockSteps} />

        <div className="grid md:grid-cols-2 gap-4">
          <ProcessingTimelineView sessionId="dashboard-session" />
          <ChartFactory 
            type="line"
            options={{ title: 'Throughput Metrics' }}
            series={[{ name: 'Throughput', data: [10, 20, 30, 40, 50] }]}
          />
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status="online" />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
