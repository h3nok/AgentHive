// Enterprise Features Context
import { createContext } from 'react';

export interface EnterpriseFeatures {
  quantumEnhancement: boolean;
  threeDEnvironment: boolean;
  voiceInterface: boolean;
  predictiveUI: boolean;
  enterpriseMonitoring: boolean;
  smartSuggestions: boolean;
}

export interface EnterpriseFeatureContextType {
  features: EnterpriseFeatures;
  toggleFeature: (feature: keyof EnterpriseFeatures) => void;
  isAnyFeatureEnabled: boolean;
  openSettings: () => void;
}

export const defaultFeatures: EnterpriseFeatures = {
  quantumEnhancement: false,
  threeDEnvironment: false,
  voiceInterface: false,
  predictiveUI: false,
  enterpriseMonitoring: false,
  smartSuggestions: false,
};

export const EnterpriseFeatureContext = createContext<EnterpriseFeatureContextType>({
  features: defaultFeatures,
  toggleFeature: () => {},
  isAnyFeatureEnabled: false,
  openSettings: () => {},
});
