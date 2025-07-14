/**
 * Comprehensive Session Fix Script
 * Run this in the browser console to:
 * 1. Clean up duplicate default folders
 * 2. Fix all legacy session names to use "Task" terminology
 * 3. Set correct task counter based on actual sessions
 * 4. Remove any empty or invalid sessions
 */
(function() {
  console.log('🔧 Starting comprehensive session fix...');
  
  const state = window.__REDUX_STORE__.getState();
  const dispatch = window.__REDUX_STORE__.dispatch;
  
  console.log('📊 Current state:');
  console.log('Folders:', state.chat.folders);
  console.log('Sessions:', state.chat.sessions);
  console.log('Task counter:', state.chat.taskCounter);
  
  // Step 1: Clean up duplicate default folders
  const folders = state.chat.folders;
  const defaultFolders = folders.filter(f => 
    f.name === 'Default' || f.name === 'default' || f.name === 'DEFAULT'
  );
  
  if (defaultFolders.length > 1) {
    console.log('🗂️ Found multiple default folders, cleaning up...');
    const keepFolder = defaultFolders[0];
    const duplicateFolders = defaultFolders.slice(1);
    
    // Move sessions from duplicate folders to the main default folder
    duplicateFolders.forEach(dupFolder => {
      const sessionsInDupFolder = state.chat.sessions.filter(s => s.folder_id === dupFolder.id);
      sessionsInDupFolder.forEach(session => {
        dispatch({
          type: 'chat/updateSession',
          payload: {
            sessionId: session.session_id,
            updates: { folder_id: keepFolder.id }
          }
        });
      });
      
      // Remove the duplicate folder
      dispatch({
        type: 'chat/deleteFolder',
        payload: dupFolder.id
      });
    });
    
    // Ensure the kept folder has the correct name
    if (keepFolder.name !== 'Default') {
      dispatch({
        type: 'chat/updateFolder',
        payload: {
          folderId: keepFolder.id,
          updates: { name: 'Default' }
        }
      });
    }
  }
  
  // Step 2: Fix all legacy session names
  const sessions = state.chat.sessions;
  const legacyPatterns = [
    /^New Chat$/i,
    /^Chat$/i,
    /^Session$/i,
    /^New Session$/i,
    /^Untitled$/i,
    /^Chat \d+$/i,
    /^Session \d+$/i
  ];
  
  let taskCount = 0;
  const validTaskNumbers = [];
  
  // First pass: find all valid "Task N" sessions to determine next number
  sessions.forEach(session => {
    const taskMatch = session.title.match(/^Task (\d+)$/);
    if (taskMatch) {
      validTaskNumbers.push(parseInt(taskMatch[1]));
    }
  });
  
  // Start numbering from the highest existing task number + 1
  taskCount = validTaskNumbers.length > 0 ? Math.max(...validTaskNumbers) : 0;
  
  console.log(`📝 Found ${validTaskNumbers.length} existing Task sessions`);
  console.log('🔄 Fixing legacy session names...');
  
  let fixedCount = 0;
  sessions.forEach(session => {
    const isLegacy = legacyPatterns.some(pattern => pattern.test(session.title));
    
    if (isLegacy) {
      taskCount++;
      const newTitle = `Task ${taskCount}`;
      
      console.log(`  ➤ "${session.title}" → "${newTitle}"`);
      
      dispatch({
        type: 'chat/updateSession',
        payload: {
          sessionId: session.session_id,
          updates: { title: newTitle }
        }
      });
      
      fixedCount++;
    }
  });
  
  // Step 3: Update task counter
  const newTaskCounter = taskCount;
  console.log(`🔢 Setting task counter to: ${newTaskCounter}`);
  
  dispatch({
    type: 'chat/setTaskCounter',
    payload: newTaskCounter
  });
  
  // Step 4: Clean up any sessions with empty titles or other issues
  const emptySessions = sessions.filter(s => !s.title || s.title.trim() === '');
  if (emptySessions.length > 0) {
    console.log(`🧹 Cleaning up ${emptySessions.length} empty sessions...`);
    emptySessions.forEach(session => {
      dispatch({
        type: 'chat/deleteSession',
        payload: session.session_id
      });
    });
  }
  
  // Final state check
  setTimeout(() => {
    const finalState = window.__REDUX_STORE__.getState();
    console.log('✅ Fix complete! Final state:');
    console.log('Folders:', finalState.chat.folders);
    console.log('Sessions:', finalState.chat.sessions.map(s => ({ id: s.session_id, title: s.title, folder: s.folder_id })));
    console.log('Task counter:', finalState.chat.taskCounter);
    console.log(`📊 Summary: Fixed ${fixedCount} legacy sessions, task counter set to ${newTaskCounter}`);
  }, 100);
})();
