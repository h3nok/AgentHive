// UKG Demo Test Script
// Test the UKG demo flows by typing these messages:

/*
TEST CASES:

1. Time-Off Request Flow:
   - Type: "I need to request time off"
   - Expected: 4 system messages → HR Agent form → fill form → 2 final messages → confirmation

2. Clock In/Out Flow:
   - Type: "I want to clock in"
   - Expected: 4 system messages → HR Agent confirmation with time/location details

3. Trigger Variations:
   - "vacation request"
   - "pto request" 
   - "punch in"
   - "check out"
   - "time clock"

EXPECTED SYSTEM MESSAGES:
1. 🔍 Analyzing your request...
2. 🏷️ Classifying as [Type] request...
3. 🎯 Routing to HR department...
4. 🔗 Connecting to HR Agent...

EXPECTED HR AGENT RESPONSES:
- Time-off: Form with Start Date, End Date, Type dropdown, Reason field
- Clock: Confirmation with current time and location details

TEST SEQUENCE:
1. Open http://localhost:5174
2. Create a new chat session if needed
3. Type a trigger message
4. Watch for system messages appearing with delays
5. Look for HR Agent typing indicator
6. Verify HR Agent response and form (if time-off)
7. Submit form and verify final confirmation
*/

console.log('UKG Demo Test Cases Ready');
console.log('Time-off triggers:', ['time off', 'vacation', 'pto', 'leave request']);
console.log('Clock triggers:', ['clock in', 'clock out', 'punch in', 'punch out', 'time clock']);
