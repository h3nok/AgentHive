// Simple test script to verify UKG demo trigger detection
// Run this in the browser console

// Test the trigger detection
const testMessage = "I need to request vacation time";
console.log("Testing message:", testMessage);

// Check if the message contains trigger words
const triggers = ['time off', 'vacation', 'pto', 'leave request', 'time-off request'];
const lowerMessage = testMessage.toLowerCase().trim();

console.log("Message (lowercase):", lowerMessage);

for (const trigger of triggers) {
  const match = lowerMessage.includes(trigger.toLowerCase());
  console.log(`Trigger "${trigger}": ${match ? 'MATCH' : 'no match'}`);
}

// Should match "vacation"
console.log("Expected result: Should match 'vacation' trigger");
