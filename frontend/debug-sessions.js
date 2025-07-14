// Debug script to check current state and fix naming issues
// Run this in the browser console

function debugAndFixSessions() {
  console.log('🔍 Debugging current session state...');
  
  const state = window.store?.getState();
  if (!state) {
    console.error('Redux store not found. Make sure the app is running in development mode.');
    return;
  }
  
  const { folders, sessions, taskCounter } = state.chat;
  
  console.log('📊 Current State:');
  console.log('  Task Counter:', taskCounter);
  console.log('  Sessions count:', sessions.length);
  console.log('  Folders:', folders.map(f => ({ id: f.id, name: f.name })));
  
  // Find sessions with old naming
  const oldNamedSessions = sessions.filter(session => 
    session.title && (
      session.title.includes('New Chat') ||
      session.title.includes('Chat ') ||
      session.title.includes('Session ')
    )
  );
  
  console.log('⚠️  Found sessions with old names:', oldNamedSessions.length);
  oldNamedSessions.forEach((session, index) => {
    console.log(`  ${index + 1}. ID: ${session.id}, Title: "${session.title}"`);
  });
  
  // Check for sessions without titles
  const noTitleSessions = sessions.filter(session => !session.title);
  console.log('⚠️  Found sessions without titles:', noTitleSessions.length);
  
  // Suggest fixes
  console.log('\n🔧 Suggested fixes:');
  console.log('1. Update task counter to:', sessions.length + 1);
  console.log('2. Rename old sessions to use Task naming');
  
  // Check default folder contents
  const defaultFolder = folders.find(f => f.name === 'Default' || f.name.includes('Default'));
  if (defaultFolder) {
    const defaultFolderSessions = sessions.filter(s => s.folderId === defaultFolder.id);
    console.log(`📁 Default folder contains ${defaultFolderSessions.length} sessions:`);
    defaultFolderSessions.forEach((session, index) => {
      console.log(`  ${index + 1}. "${session.title || 'Untitled'}" (${session.messages?.length || 0} messages)`);
    });
  }
  
  return {
    totalSessions: sessions.length,
    oldNamedSessions: oldNamedSessions.length,
    taskCounter,
    suggestedTaskCounter: sessions.length + 1
  };
}

// Run the debug
debugAndFixSessions();
