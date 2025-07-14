/**
 * Quick Session Title Fix
 * Run this in the browser console to fix legacy "New Chat" titles
 */
(function() {
  console.log('🔧 Fixing legacy session titles...');
  
  const state = window.__REDUX_STORE__.getState();
  const dispatch = window.__REDUX_STORE__.dispatch;
  
  console.log('📊 Current sessions:', state.chat.sessions.map(s => ({ id: s.id, title: s.title })));
  
  const legacyTitles = ['New Chat', 'Chat', 'Session', 'New Session', 'Untitled'];
  let taskNumber = state.chat.taskCounter || 1;
  let fixedCount = 0;
  
  // Find all existing Task N sessions to get the next number
  const existingTaskNumbers = state.chat.sessions
    .map(s => s.title.match(/^Task (\d+)$/))
    .filter(match => match)
    .map(match => parseInt(match[1]));
  
  if (existingTaskNumbers.length > 0) {
    taskNumber = Math.max(...existingTaskNumbers) + 1;
  }
  
  // Fix legacy sessions
  state.chat.sessions.forEach(session => {
    if (legacyTitles.includes(session.title) || session.title.match(/^Chat \d+$/)) {
      const newTitle = `Task ${taskNumber}`;
      console.log(`  ➤ "${session.title}" → "${newTitle}"`);
      
      dispatch({
        type: 'chat/updateSessionTitle',
        payload: {
          sessionId: session.id,
          title: newTitle
        }
      });
      
      taskNumber++;
      fixedCount++;
    }
  });
  
  // Update task counter
  dispatch({
    type: 'chat/setTaskCounter',
    payload: taskNumber - 1
  });
  
  console.log(`✅ Fixed ${fixedCount} legacy sessions, task counter set to ${taskNumber - 1}`);
  
  // Show updated state
  setTimeout(() => {
    const updatedState = window.__REDUX_STORE__.getState();
    console.log('📊 Updated sessions:', updatedState.chat.sessions.map(s => ({ id: s.id, title: s.title })));
  }, 100);
})();
