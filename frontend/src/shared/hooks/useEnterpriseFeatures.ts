// Enterprise Features Hook
import { useContext } from 'react';
import { EnterpriseFeatureContext } from '../../app/providers/EnterpriseFeatureContext';

export const useEnterpriseFeatures = () => {
  const context = useContext(EnterpriseFeatureContext);
  if (!context) {
    throw new Error('useEnterpriseFeatures must be used within EnterpriseFeatureProvider');
  }
  return context;
};
