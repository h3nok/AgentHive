/**
 * Immediate Fix for "New Chat" Sessions
 * Run this in the browser console to immediately fix the 5 "New Chat" sessions
 */
(function() {
  console.log('🚀 Immediate fix for "New Chat" sessions starting...');
  
  const store = window.__REDUX_STORE__;
  if (!store) {
    console.error('❌ Redux store not found. Make sure the app is running.');
    return;
  }
  
  const state = store.getState();
  const dispatch = store.dispatch;
  
  console.log('📊 Current sessions before fix:');
  state.chat.sessions.forEach(s => {
    console.log(`  - ${s.id}: "${s.title}" (folder: ${s.folderId})`);
  });
  
  // Find sessions with "New Chat" title
  const newChatSessions = state.chat.sessions.filter(s => 
    s.title === 'New Chat' || s.title === 'new chat' || s.title?.toLowerCase().includes('new chat')
  );
  
  console.log(`🔍 Found ${newChatSessions.length} "New Chat" sessions to fix`);
  
  if (newChatSessions.length === 0) {
    console.log('✅ No "New Chat" sessions found to fix!');
    return;
  }
  
  // Get the current highest Task number
  let maxTaskNumber = 0;
  state.chat.sessions.forEach(session => {
    const taskMatch = session.title?.match(/^Task (\d+)$/);
    if (taskMatch) {
      maxTaskNumber = Math.max(maxTaskNumber, parseInt(taskMatch[1]));
    }
  });
  
  console.log(`📈 Highest existing Task number: ${maxTaskNumber}`);
  
  // Fix each "New Chat" session
  let nextTaskNumber = maxTaskNumber + 1;
  newChatSessions.forEach((session, index) => {
    const newTitle = `Task ${nextTaskNumber}`;
    console.log(`  🔄 Fixing "${session.title}" → "${newTitle}"`);
    
    dispatch({
      type: 'chat/updateSessionTitle',
      payload: {
        sessionId: session.id,
        title: newTitle
      }
    });
    
    nextTaskNumber++;
  });
  
  // Update the task counter
  const newTaskCounter = nextTaskNumber - 1;
  dispatch({
    type: 'chat/incrementTaskCounter',
    payload: undefined // This will set it to the current counter + 1
  });
  
  console.log(`🔢 Updated task counter to: ${newTaskCounter}`);
  
  // Show results
  setTimeout(() => {
    const updatedState = store.getState();
    console.log('✅ Fix complete! Updated sessions:');
    updatedState.chat.sessions.forEach(s => {
      console.log(`  - ${s.id}: "${s.title}" (folder: ${s.folderId})`);
    });
    console.log(`📊 Task counter: ${updatedState.chat.taskCounter}`);
  }, 100);
  
  console.log('🎉 All "New Chat" sessions have been renamed to proper Task format!');
})();
