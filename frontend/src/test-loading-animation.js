// Quick test script to verify loading animations work
// Run this in the browser console when the app is loaded

console.log('🧪 Testing loading animations...');

// Wait for the app to be fully loaded
setTimeout(() => {
  if (window.store) {
    console.log('✅ Redux store found, testing loading states...');
    
    const store = window.store;
    const { 
      addMessage, 
      assistantRequestStarted, 
      setProcessingStatus, 
      clearProcessingStatus,
      assistantResponseFinished 
    } = window.store.getState().chat;
    
    // Test sequence
    const testMessageId = `test-loading-${Date.now()}`;
    
    console.log('📝 Step 1: Adding placeholder message...');
    store.dispatch({
      type: 'chat/addMessage',
      payload: {
        id: testMessageId,
        text: '',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        temp: true
      }
    });
    
    console.log('🚀 Step 2: Starting loading state...');
    store.dispatch({
      type: 'chat/assistantRequestStarted',
      payload: { assistantMessageId: testMessageId }
    });
    
    console.log('📡 Step 3: Setting processing status...');
    store.dispatch({
      type: 'chat/setProcessingStatus',
      payload: '🧪 Testing loading animation...'
    });
    
    // After 3 seconds, clear processing status and show dots
    setTimeout(() => {
      console.log('🔄 Step 4: Clearing processing status (should show dots)...');
      store.dispatch({
        type: 'chat/clearProcessingStatus'
      });
      
      // After 3 more seconds, add some text
      setTimeout(() => {
        console.log('📝 Step 5: Adding some text...');
        store.dispatch({
          type: 'chat/updateAssistantMessage',
          payload: {
            id: testMessageId,
            text: 'Hello! This is a test message to verify the loading animations work correctly.'
          }
        });
        
        // After 2 more seconds, finish the response
        setTimeout(() => {
          console.log('✅ Step 6: Finishing response...');
          store.dispatch({
            type: 'chat/assistantResponseFinished'
          });
          
          console.log('🎉 Loading animation test completed!');
        }, 2000);
      }, 3000);
    }, 3000);
    
  } else {
    console.error('❌ Redux store not found. Make sure you\'re in development mode.');
  }
}, 1000);
