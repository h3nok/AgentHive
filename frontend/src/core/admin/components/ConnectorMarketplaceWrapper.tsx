import React, { useState } from 'react';
import ConnectorMarketplace from './ConnectorMarketplace';
import GitHubConnectorConfig from './GitHubConnectorConfig';

/**
 * Wrapper component that provides navigation logic for the ConnectorMarketplace
 * when rendered as a standalone route (not within DashboardPage tabs)
 */
export const ConnectorMarketplaceWrapper: React.FC = () => {
  const [showConnectorConfig, setShowConnectorConfig] = useState(false);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);

  const handleInstallConnector = (connectorId: string) => {
    console.log('Installing connector:', connectorId);
    if (connectorId === 'github-enterprise') {
      setSelectedConnectorId(connectorId);
      setShowConnectorConfig(true);
    }
  };

  const handleConfigureConnector = (connectorId: string) => {
    console.log('Configuring connector:', connectorId);
    if (connectorId === 'github-enterprise') {
      setSelectedConnectorId(connectorId);
      setShowConnectorConfig(true);
    }
  };

  const handleUninstallConnector = (connectorId: string) => {
    console.log('Uninstalling connector:', connectorId);
  };

  const handleBack = () => {
    setShowConnectorConfig(false);
    setSelectedConnectorId(null);
  };

  const handleSave = (config: any) => {
    console.log('Saving GitHub config:', config);
    setShowConnectorConfig(false);
    setSelectedConnectorId(null);
  };

  const handleTest = (connectorId: string) => {
    console.log('Testing connector:', connectorId);
  };

  const handleDelete = (connectorId: string) => {
    console.log('Deleting connector:', connectorId);
    setShowConnectorConfig(false);
    setSelectedConnectorId(null);
  };

  if (showConnectorConfig && selectedConnectorId === 'github-enterprise') {
    return (
      <GitHubConnectorConfig 
        connectorId={selectedConnectorId}
        onSave={handleSave}
        onTest={handleTest}
        onDelete={handleDelete}
        onBack={handleBack}
      />
    );
  }

  return (
    <ConnectorMarketplace 
      onInstallConnector={handleInstallConnector}
      onConfigureConnector={handleConfigureConnector}
      onUninstallConnector={handleUninstallConnector}
    />
  );
};
