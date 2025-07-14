// Test script to manually fix session names
// Run this in the browser console if the automatic fix doesn't work

function manuallyFixSessionNames() {
  console.log('🔧 Manually fixing session names...');
  
  const state = window.store?.getState();
  if (!state) {
    console.error('Redux store not found. Make sure the app is running in development mode.');
    return;
  }
  
  // Dispatch the fix action
  window.store.dispatch({
    type: 'chat/fixOldSessionNames'
  });
  
  console.log('✅ Session names fixed! Check the sidebar.');
  
  // Log the updated state
  const newState = window.store.getState();
  console.log('📊 Updated state:');
  console.log('  Task Counter:', newState.chat.taskCounter);
  console.log('  Sessions:');
  newState.chat.sessions.forEach((session, index) => {
    console.log(`    ${index + 1}. "${session.title}" (${session.messages?.length || 0} messages)`);
  });
}

function testTaskCounterIncrement() {
  console.log('🧪 Testing task counter increment...');
  
  const state = window.store?.getState();
  if (!state) {
    console.error('Redux store not found.');
    return;
  }
  
  console.log('Current task counter:', state.chat.taskCounter);
  console.log('Next task will be: Task', state.chat.taskCounter + 1);
  
  // Test increment
  window.store.dispatch({
    type: 'chat/incrementTaskCounter'
  });
  
  const newState = window.store.getState();
  console.log('After increment:', newState.chat.taskCounter);
}

// Export functions for manual use
window.manuallyFixSessionNames = manuallyFixSessionNames;
window.testTaskCounterIncrement = testTaskCounterIncrement;

console.log('🛠️  Debug functions loaded:');
console.log('  - manuallyFixSessionNames() - Fix old session names');
console.log('  - testTaskCounterIncrement() - Test task counter');

// Auto-run the fix
manuallyFixSessionNames();
