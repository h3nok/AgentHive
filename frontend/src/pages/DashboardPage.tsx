import React from 'react';
import WorkflowRenderer from '@/components/WorkflowRenderer';
import ProcessingTimelineView from '@/components/ProcessingTimelineView';
import ChartFactory from '@/components/ChartFactory';
import StatusBadge from '@/components/StatusBadge';
import ErrorBoundary from '@/components/ErrorBoundary';

const DashboardPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full overflow-auto p-4 space-y-6 bg-background-default dark:bg-slate-900">
        <WorkflowRenderer />

        <div className="grid md:grid-cols-2 gap-4">
          <ProcessingTimelineView />
          <ChartFactory chartId="throughput" />
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status="online" />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
