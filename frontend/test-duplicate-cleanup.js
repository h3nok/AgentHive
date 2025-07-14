// Test script to verify duplicate folder cleanup
// Run this in the browser console when the app is loaded

function testDuplicateFolderCleanup() {
  console.log('🧹 Testing duplicate folder cleanup...');
  
  const state = window.store?.getState();
  if (!state) {
    console.error('Redux store not found. Make sure the app is running in development mode.');
    return;
  }
  
  const folders = state.chat.folders;
  const sessions = state.chat.sessions;
  
  console.log('📁 Current folders:', folders.map(f => ({ id: f.id, name: f.name })));
  console.log('📝 Current sessions:', sessions.map(s => ({ id: s.id, title: s.title, folderId: s.folderId })));
  
  // Check for default folders
  const defaultFolders = folders.filter(f => 
    f.name === "Default" || 
    f.name === "Default Session" || 
    f.name.toLowerCase().includes("default")
  );
  
  if (defaultFolders.length > 1) {
    console.warn(`⚠️  Found ${defaultFolders.length} default folders:`, defaultFolders);
    console.log('🔧 The Sidebar component should automatically clean these up...');
  } else if (defaultFolders.length === 1) {
    console.log('✅ Only one default folder found:', defaultFolders[0]);
  } else {
    console.log('❌ No default folder found');
  }
  
  // Check task counter
  console.log('🔢 Current task counter:', state.chat.taskCounter);
}

// Run the test
testDuplicateFolderCleanup();
