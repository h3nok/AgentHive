// Test UKG Demo Integration - Browser Console Test
// Run this in the browser console at http://localhost:5175

console.log('🧪 UKG Demo Integration Test Starting...');

// Test 1: Check if UKG Demo components are loaded
console.log('📦 Testing component imports...');
console.log('UKGDemoSystem available:', !!window.React);

// Test 2: Trigger detection
const testMessages = [
  'I need to request time off',
  'I want to clock in',
  'vacation request',
  'punch out',
  'normal message'
];

const triggers = {
  timeOff: ['time off', 'vacation', 'pto', 'leave request', 'time-off request'],
  clockInOut: ['clock in', 'clock out', 'punch in', 'punch out', 'time clock', 'check in', 'check out']
};

console.log('🎯 Testing trigger detection...');
testMessages.forEach(message => {
  const lowerMessage = message.toLowerCase().trim();
  let triggered = false;
  let flowType = 'none';
  
  // Check time-off triggers
  for (const trigger of triggers.timeOff) {
    if (lowerMessage.includes(trigger.toLowerCase())) {
      triggered = true;
      flowType = 'time-off-request';
      break;
    }
  }
  
  // Check clock triggers
  if (!triggered) {
    for (const trigger of triggers.clockInOut) {
      if (lowerMessage.includes(trigger.toLowerCase())) {
        triggered = true;
        flowType = 'clock-in-out';
        break;
      }
    }
  }
  
  console.log(`"${message}" → ${triggered ? '✅ ' + flowType : '❌ no trigger'}`);
});

console.log('');
console.log('🚀 Manual Test Instructions:');
console.log('1. Create a new chat session');
console.log('2. Type: "I need to request time off"');
console.log('3. Expected sequence:');
console.log('   - 4 system messages with delays');
console.log('   - HR Agent typing indicator');
console.log('   - HR Agent message with form');
console.log('   - Form with Start Date, End Date, Type, Reason fields');
console.log('');
console.log('4. Fill out form and submit');
console.log('5. Expected: 2 final system messages + confirmation');
console.log('');
console.log('6. Test clock-in flow with: "I want to clock in"');
console.log('   - Should show 4 system messages + HR confirmation with time/location');
