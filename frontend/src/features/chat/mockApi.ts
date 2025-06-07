// Mock API for testing frontend functionality
export interface MockSession {
  session_id: string;
  title?: string;
  pinned?: boolean;
  updated_at: string;
  preview?: string;
}

export interface MockMessage {
  id: string;
  text: string;
  sender: "user" | "assistant" | "system";
  timestamp: string;
  agent?: string;
}

// Mock data
const mockSessions: MockSession[] = [
  {
    session_id: "mock-session-1",
    title: "Store Operations Help",
    pinned: false,
    updated_at: new Date().toISOString(),
    preview: "Help with inventory management..."
  },
  {
    session_id: "mock-session-2", 
    title: "HR Policy Questions",
    pinned: true,
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    preview: "Questions about employee benefits..."
  }
];

const mockMessages: Record<string, MockMessage[]> = {
  "mock-session-1": [
    {
      id: "msg-1",
      text: "How do I check inventory levels for a specific product?",
      sender: "user",
      timestamp: new Date().toISOString()
    },
    {
      id: "msg-2",
      text: "To check inventory levels, you can access the inventory management system through the POS terminal or use the mobile app. Here's the step-by-step process:\n\n1. Open the inventory module\n2. Search for the product by SKU or name\n3. View current stock levels and location details\n\nWould you like more specific instructions for any particular system?",
      sender: "assistant",
      timestamp: new Date().toISOString()
    }
  ]
};

// Mock API functions
export const mockApi = {
  listSessions: async (): Promise<MockSession[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return mockSessions;
  },

  createSession: async (title?: string): Promise<MockSession> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newSession: MockSession = {
      session_id: `mock-session-${Date.now()}`,
      title: title || "New Chat",
      pinned: false,
      updated_at: new Date().toISOString(),
      preview: ""
    };
    mockSessions.unshift(newSession);
    return newSession;
  },

  getSession: async (sessionId: string): Promise<{ session: MockSession; messages: MockMessage[] }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const session = mockSessions.find(s => s.session_id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    return {
      session,
      messages: mockMessages[sessionId] || []
    };
  },

  sendMessage: async (sessionId: string, message: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock AI responses based on message content
    let response = "I understand your question. Let me help you with that...";
    
    if (message.toLowerCase().includes("inventory")) {
      response = "For inventory-related questions, I can help you with stock levels, reordering processes, and inventory management best practices. Enterprise uses an integrated inventory system across all locations.";
    } else if (message.toLowerCase().includes("hr") || message.toLowerCase().includes("employee")) {
      response = "For HR-related inquiries, I can assist with employee benefits, policies, scheduling, and payroll questions. All HR information is kept confidential and follows Enterprise guidelines.";
    } else if (message.toLowerCase().includes("store") || message.toLowerCase().includes("operation")) {
      response = "I can help with store operations including daily procedures, compliance checks, customer service guidelines, and operational best practices across Enterprise's global locations.";
    }
    
    return response;
  }
}; 