import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './shared/store';
import App from './App';
// Import Roboto Slab font for Enterprise theme
import '@fontsource/roboto-slab/300.css';
import '@fontsource/roboto-slab/400.css';
import '@fontsource/roboto-slab/500.css';
import '@fontsource/roboto-slab/600.css';
import '@fontsource/roboto-slab/700.css';
// Add global CSS if needed
import './shared/styles/global.css';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './shared/utils/msalInstance';
import { Toaster } from 'sonner';
import { initializeBrowserErrorHandling } from './shared/utils/browserErrorHandler';

// Initialize browser error handling to filter extension errors
initializeBrowserErrorHandling();

// Debug log environment variables
console.log('Environment variables:', import.meta.env);

// Expose store globally for debugging
if (import.meta.env.MODE === 'development') {
  (window as { store?: typeof store }).store = store;
  console.log('🔍 Redux store exposed globally as window.store for debugging');
  
  // Add real-time state monitoring for loading animations
  let lastChatState: {
    isLoading: boolean;
    processingStatus: string | null;
    currentAssistantMessageId: string | null;
    messagesCount: number;
  } | null = null;
  
  store.subscribe(() => {
    const currentState = store.getState();
    
    // Only log if important UI state fields changed (using consolidated store)
    const importantFields = {
      isLoading: (currentState as any).ui?.isLoading || false,
      processingStatus: (currentState as any).ui?.processingStatus || 'idle',
      currentAssistantMessageId: (currentState as any).ui?.currentAssistantMessageId || null,
      messagesCount: Object.keys((currentState as any).entities?.messages?.entities || {}).length
    };
    
    if (JSON.stringify(importantFields) !== JSON.stringify(lastChatState)) {
      console.log('🔄 Redux State Monitor:', importantFields);
      if (lastChatState) {
        // Log what changed
        Object.keys(importantFields).forEach(key => {
          const typedKey = key as keyof typeof importantFields;
          if (importantFields[typedKey] !== lastChatState![typedKey]) {
            console.log(`   📝 ${key}: ${lastChatState![typedKey]} → ${importantFields[typedKey]}`);
          }
        });
      }
      lastChatState = importantFields;
    }
  });
}

// Check if authentication is disabled via environment variable
const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === 'false';

console.log('Authentication disabled:', isAuthDisabled);

// DEV: runtime store instrumentation – logs key chat metrics
if (import.meta.env.MODE === 'development') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – file only exists in dev builds
  void import('./debugTrace');
}

// Create the app content
const appContent = (
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-right" expand />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// Render with or without MsalProvider based on auth setting
if (isAuthDisabled) {
  console.log('Authentication is disabled - rendering without MsalProvider');
  ReactDOM.createRoot(document.getElementById('root')!).render(appContent);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <MsalProvider instance={msalInstance}>
      {appContent}
    </MsalProvider>
  );
}

