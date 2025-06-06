import React from 'react';
import { useUKGDemo } from './hooks';
import { HRAgentTypingIndicator } from './HRAgentTypingIndicator';

export const UKGDemoSystem: React.FC = () => {
  const { demoState } = useUKGDemo();

  // Return demo UI components (typing indicator, etc.)
  return (
    <>
      <HRAgentTypingIndicator show={demoState.showTypingIndicator} />
    </>
  );
};
