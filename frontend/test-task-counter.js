// Test task counter functionality
// Run this in the browser console when the app is loaded

function testTaskCounterAndMessages() {
  console.log('🧪 Testing task counter and message functionality...');
  
  const state = window.store?.getState();
  if (!state) {
    console.error('Redux store not found. Make sure the app is running in development mode.');
    return;
  }
  
  const { folders, sessions, taskCounter } = state.chat;
  
  console.log('📊 Current State:');
  console.log('  Task Counter:', taskCounter);
  console.log('  Sessions count:', sessions.length);
  console.log('  Folders count:', folders.length);
  
  // Check each session's message count
  sessions.forEach((session, index) => {
    console.log(`  Session ${index + 1}:`, {
      id: session.id,
      title: session.title,
      messageCount: session.messages?.length || 0,
      folderId: session.folderId,
      folder: folders.find(f => f.id === session.folderId)?.name || 'Unknown'
    });
  });
  
  // Check folder structure
  folders.forEach((folder, index) => {
    const folderSessions = sessions.filter(s => s.folderId === folder.id);
    console.log(`  Folder ${index + 1}:`, {
      id: folder.id,
      name: folder.name,
      sessionCount: folderSessions.length,
      sessions: folderSessions.map(s => ({ id: s.id, title: s.title }))
    });
  });
  
  // Test task counter increment
  console.log('🔢 Next task should be: Task', taskCounter + 1);
  
  return {
    taskCounter,
    sessionCount: sessions.length,
    folderCount: folders.length,
    nextTaskNumber: taskCounter + 1
  };
}

// Run the test
const result = testTaskCounterAndMessages();
console.log('📈 Test Results:', result);
