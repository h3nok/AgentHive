// UKG Demo Types and Constants
export interface UKGDemoFlow {
  id: string;
  name: string;
  trigger: string[];
  systemMessages: string[];
  hrAgentResponse: {
    type: 'form' | 'confirmation' | 'action';
    content: string;
    formFields?: Array<{
      id: string;
      label: string;
      type: 'text' | 'date' | 'select' | 'time' | 'location';
      options?: string[];
      required?: boolean;
    }>;
    actionType?: 'clock-in' | 'clock-out' | 'time-off' | 'status-check';
  };
  finalMessages?: string[];
  managerApprovalFlow?: {
    enabled: boolean;
    delayMs: number;
    messages: string[];
  };
  notificationFlow?: {
    enabled: boolean;
    delayMs: number;
    messages: string[];
  };
}

export interface DemoState {
  activeFlow: UKGDemoFlow | null;
  currentStep: number;
  isProcessing: boolean;
  formData: Record<string, string>;
  showTypingIndicator: boolean;
}

// Define the UKG demo flows
export const UKG_DEMO_FLOWS: UKGDemoFlow[] = [
  {
    id: 'time-off-request',
    name: 'Time-Off Request',
    trigger: ['time off', 'personal day', 'personal days', 'submit time off', 'submit pto', 'vacation', 'pto', 'leave request', 'time-off request', 'request time off', 'book vacation'],
    systemMessages: [
      '🔍 Analyzing your request...',
      '🏷️ Classifying as Time-Off request...',
      '🎯 Routing to HR department...',
      '🔗 Connecting to UKG Workforce Management...'
    ],
    hrAgentResponse: {
      type: 'form',
      content: 'I can help you submit a time-off request through UKG. Please fill out the following details:',
      formFields: [
        {
          id: 'startDate',
          label: 'Start Date',
          type: 'date',
          required: true
        },
        {
          id: 'endDate',
          label: 'End Date',
          type: 'date',
          required: true
        },
        {
          id: 'timeOffType',
          label: 'Type of Time Off',
          type: 'select',
          options: ['Vacation', 'Sick Leave', 'Personal Day', 'Bereavement', 'FMLA', 'Jury Duty'],
          required: true
        },
        {
          id: 'reason',
          label: 'Reason (Optional)',
          type: 'text',
          required: false
        }
      ]
    },
    finalMessages: [
      '✅ Validating request against UKG policies...',
      '📊 Checking available PTO balance...',
      '📤 Submitting to UKG for manager approval...'
    ],
    managerApprovalFlow: {
      enabled: true,
      delayMs: 8000,
      messages: [
        '📧 Manager notification sent via UKG...',
        '⏳ Awaiting manager approval...',
        '✅ Request approved by Sarah Johnson (Manager)'
      ]
    },
    notificationFlow: {
      enabled: true,
      delayMs: 12000,
      messages: [
        '📱 UKG mobile app notification sent',
        '📧 Email confirmation sent to your Tractor Supply account'
      ]
    }
  },
  {
    id: 'clock-in-out',
    name: 'Clock In/Out',
    trigger: ['clock in', 'clock out', 'punch in', 'punch out', 'time clock', 'check in', 'check out', 'start work', 'end work'],
    systemMessages: [
      '🔍 Analyzing your request...',
      '🏷️ Classifying as Time Clock action...',
      '🎯 Routing to UKG Time Management...',
      '🔗 Connecting to UKG Kronos system...'
    ],
    hrAgentResponse: {
      type: 'action',
      content: 'Processing your time clock request through UKG Kronos...',
      actionType: 'clock-in'
    },
    finalMessages: [
      '📍 Verifying location and device...',
      '⏰ Recording timestamp in UKG database...'
    ]
  },
  {
    id: 'schedule-check',
    name: 'Schedule Check',
    trigger: ['my schedule', 'work schedule', 'when do i work', 'what are my hours', 'schedule for', 'upcoming shifts'],
    systemMessages: [
      '🔍 Analyzing your request...',
      '🏷️ Classifying as Schedule inquiry...',
      '🎯 Routing to UKG Workforce Management...',
      '🔗 Accessing your UKG schedule data...'
    ],
    hrAgentResponse: {
      type: 'confirmation',
      content: 'Here is your upcoming work schedule from UKG:',
      actionType: 'status-check'
    },
    finalMessages: []
  },
  {
    id: 'benefits-inquiry',
    name: 'Benefits Inquiry',
    trigger: ['benefits', 'health insurance', '401k', 'dental', 'vision', 'retirement', 'pto balance', 'sick days'],
    systemMessages: [
      '🔍 Analyzing your request...',
      '🏷️ Classifying as Benefits inquiry...',
      '🎯 Routing to HR Benefits team...',
      '🔗 Accessing UKG benefits portal...'
    ],
    hrAgentResponse: {
      type: 'confirmation',
      content: 'Here is your current benefits information from UKG:',
      actionType: 'status-check'
    },
    finalMessages: []
  }
];
