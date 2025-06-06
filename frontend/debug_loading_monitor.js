// Debug Redux State Monitor for Loading Animation Issues
// Add this script to your browser console while testing the chat

// Monitor Redux store state changes
const originalDispatch = window.__REDUX_DEVTOOLS_EXTENSION__?.dispatch || (() => {});

let lastState = null;

function monitorReduxState() {
    if (window.store) {
        const currentState = window.store.getState();
        const chatState = currentState.chat;
        
        // Check if state changed
        if (JSON.stringify(chatState) !== JSON.stringify(lastState?.chat)) {
            console.group('🔍 Chat State Change');
            console.log('isLoading:', chatState.isLoading);
            console.log('processingStatus:', chatState.processingStatus);
            console.log('currentAssistantMessageId:', chatState.currentAssistantMessageId);
            console.log('activeSessionId:', chatState.activeSessionId);
            console.log('Full chat state:', chatState);
            console.groupEnd();
            
            lastState = currentState;
        }
    }
    
    // Continue monitoring
    requestAnimationFrame(monitorReduxState);
}

// Start monitoring
console.log('🚀 Starting Redux state monitor for loading animations...');
monitorReduxState();

// Helper to manually trigger a test message
window.testLoadingAnimation = function() {
    console.log('🧪 Testing loading animation...');
    
    // Find the chat input
    const input = document.querySelector('input[type="text"]') || document.querySelector('textarea');
    if (input) {
        // Simulate typing a message
        input.value = 'Test loading animation ' + Date.now();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Find and click send button
        const sendButton = document.querySelector('[type="submit"]') || 
                          document.querySelector('button[title*="Send"]') ||
                          document.querySelector('button:has(svg)');
        
        if (sendButton) {
            console.log('📤 Sending test message...');
            sendButton.click();
        } else {
            console.error('❌ Could not find send button');
        }
    } else {
        console.error('❌ Could not find input field');
    }
};

// Helper to check component states
window.checkLoadingStates = function() {
    console.group('🔍 Loading State Check');
    
    // Check if streaming dots are visible
    const streamingDots = document.querySelectorAll('[style*="animation"]');
    console.log('Elements with animations:', streamingDots.length);
    streamingDots.forEach((el, i) => {
        console.log(`Animation ${i}:`, el, el.style.animation);
    });
    
    // Check for loading indicators
    const loadingIndicators = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
    console.log('Loading indicators found:', loadingIndicators.length);
    
    // Check for processing status
    const processingText = document.querySelector('[data-testid="processing-status"]') ||
                          Array.from(document.querySelectorAll('*')).find(el => 
                              el.textContent?.includes('Connecting') || 
                              el.textContent?.includes('thinking') ||
                              el.textContent?.includes('processing')
                          );
    console.log('Processing status element:', processingText);
    
    // Check for CircularProgress components
    const circularProgress = document.querySelectorAll('svg[class*="CircularProgress"], .MuiCircularProgress-root');
    console.log('CircularProgress components:', circularProgress.length);
    
    console.groupEnd();
};

// Auto-run checks every 2 seconds
setInterval(() => {
    if (window.location.pathname === '/') {
        window.checkLoadingStates();
    }
}, 2000);

console.log('✅ Debug tools loaded! Use:');
console.log('   window.testLoadingAnimation() - Send a test message');
console.log('   window.checkLoadingStates() - Check current UI state');
