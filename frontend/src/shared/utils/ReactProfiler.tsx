import React, { Profiler, ProfilerOnRenderCallback } from 'react';

interface ProfilerData {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

const profilerData: ProfilerData[] = [];
const PERFORMANCE_THRESHOLD = 16; // 16ms for 60fps
const MAX_RENDERS_TRACKED = 100;

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  const data: ProfilerData = {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  };

  profilerData.push(data);

  // Keep only recent renders
  if (profilerData.length > MAX_RENDERS_TRACKED) {
    profilerData.shift();
  }

  // Log slow renders in development
  if (process.env.NODE_ENV === 'development' && actualDuration > PERFORMANCE_THRESHOLD) {
    console.warn(`Slow render detected in ${id}:`, {
      phase,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
    });
  }
};

export const getProfilerStats = () => {
  const slowRenders = profilerData.filter(data => data.actualDuration > PERFORMANCE_THRESHOLD);
  const unnecessaryRenders = profilerData.filter(data => 
    data.phase === 'update' && data.actualDuration < 1
  );

  return {
    totalRenders: profilerData.length,
    slowRenders: slowRenders.length,
    unnecessaryRenders: unnecessaryRenders.length,
    averageDuration: profilerData.reduce((sum, data) => sum + data.actualDuration, 0) / profilerData.length,
    data: profilerData,
  };
};

export const clearProfilerData = () => {
  profilerData.length = 0;
};

interface ReactProfilerWrapperProps {
  id: string;
  children: React.ReactNode;
}

export const ReactProfilerWrapper: React.FC<ReactProfilerWrapperProps> = ({ id, children }) => {
  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};

export default ReactProfilerWrapper;
