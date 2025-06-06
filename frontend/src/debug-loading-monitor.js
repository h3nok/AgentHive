// Debug loading state monitoring
// This script monitors Redux state changes and logs them to console

const originalDispatch = window.__REDUX_DEVTOOLS_EXTENSION__?.dispatch;
let reduxStore = null;

// Try to get Redux store from various possible locations
const checkForStore = () => {
  if (window.store) {
    reduxStore = window.store;
    return true;
  }
  
  // Check React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (reactDevTools.renderers) {
      for (let [id, renderer] of reactDevTools.renderers) {
        try {
          const fiber = renderer.findFiberByHostInstance?.(document.body);
          if (fiber && fiber.stateNode && fiber.stateNode.store) {
            reduxStore = fiber.stateNode.store;
            return true;
          }
        } catch (e) {
          // Continue searching
        }
      }
    }
  }
  
  return false;
};

const monitorLoadingState = () => {
  if (!reduxStore && !checkForStore()) {
    console.log('🔍 Redux store not found, retrying in 1s...');
    setTimeout(monitorLoadingState, 1000);
    return;
  }
  
  if (reduxStore) {
    console.log('✅ Found Redux store, monitoring loading state...');
    
    let lastState = null;
    
    const logStateChanges = () => {
      try {
        const currentState = reduxStore.getState();
        const chatState = currentState.chat;
        
        if (!lastState || 
            lastState.isLoading !== chatState.isLoading ||
            lastState.processingStatus !== chatState.processingStatus ||
            lastState.currentAssistantMessageId !== chatState.currentAssistantMessageId) {
          
          console.log('🔄 Redux Loading State Change:', {
            isLoading: chatState.isLoading,
            processingStatus: chatState.processingStatus,
            currentAssistantMessageId: chatState.currentAssistantMessageId,
            timestamp: new Date().toISOString()
          });
          
          lastState = {
            isLoading: chatState.isLoading,
            processingStatus: chatState.processingStatus,
            currentAssistantMessageId: chatState.currentAssistantMessageId
          };
        }
      } catch (error) {
        console.error('Error monitoring Redux state:', error);
      }
      
      requestAnimationFrame(logStateChanges);
    };
    
    logStateChanges();
  }
};

// Monitor DOM for loading animations
const monitorLoadingAnimations = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check for CircularProgress components
        const circularProgress = document.querySelectorAll('[role="progressbar"]');
        const animatedDots = document.querySelectorAll('[style*="animation"]');
        
        if (circularProgress.length > 0 || animatedDots.length > 0) {
          console.log('🎭 Loading animations detected:', {
            circularProgress: circularProgress.length,
            animatedDots: animatedDots.length,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('👀 Started DOM monitoring for loading animations');
};

// Start monitoring
console.log('🚀 Starting loading state debug monitor...');
monitorLoadingState();
monitorLoadingAnimations();

// Export for manual testing
window.debugLoadingState = () => {
  if (reduxStore) {
    const state = reduxStore.getState();
    console.log('Current Redux state:', state.chat);
  } else {
    console.log('Redux store not available');
  }
};
