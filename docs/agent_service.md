# Enterprise Automation Agent Service Documentation

## Overview

The Enterprise Automation Agent Service is the core component of the AgentHive system. It processes user queries, detects their intent, and routes them to the appropriate service for handling. The service specializes in enterprise automation tasks including HR operations, IT support, and general business process automation.

## Architecture

The Enterprise Automation Agent Service is designed with a modular architecture:

1. **Query Processing**: The main entry point for processing user queries
2. **Intent Detection**: Detecting the intent of user queries  
3. **Agent Routing**: Routing queries to appropriate specialized agents (HR, IT, General)
4. **Response Generation**: Generating contextual responses based on enterprise data
5. **Clarification**: Generating clarification questions for ambiguous queries

## Components

### EnterpriseAgentService Class

The `EnterpriseAgentService` class is the main entry point for all agent interactions. It provides methods for:

- Processing user queries
- Detecting query intent
- Routing to specialized agents (HR, IT, General)
- Generating contextual responses
- Clarifying ambiguous queries

#### Key Methods

- `process_query(query: str, session_id: Optional[str] = None) -> Dict[str, Any]`: Processes a user query
- `_detect_intent(query: str) -> Dict[str, Any]`: Detects the intent of a query
- `_route_to_agent(query: str, intent_data: Dict[str, Any]) -> Dict[str, Any]`: Routes to appropriate agent
- `_generate_response(query: str, agent_data: Dict[str, Any]) -> Dict[str, Any]`: Generates responses
- `_generate_clarification(query: str, intent_data: Dict[str, Any]) -> Dict[str, Any]`: Generates clarification questions

## Integration with Specialized Agents

The Enterprise Agent Service integrates with specialized agents in the following ways:

1. **Intent Detection**: The service detects the type of enterprise query (HR, IT, General)
2. **Agent Routing**: Routes queries to the appropriate specialized agent
3. **Context Management**: Maintains conversation context across agent interactions
4. **Response Coordination**: Coordinates responses from multiple agents when needed

## Query Processing Flow

1. **Query Reception**: The user query is received by the `process_query` method
2. **Intent Detection**: The service detects the intent and domain of the query
3. **Agent Selection**: The service determines which specialized agent should handle the query
4. **Context Gathering**: The service gathers relevant enterprise context and data
5. **Response Generation**: The selected agent processes the query and generates a response
6. **Clarification**: If the query is ambiguous, the service generates clarification questions
7. **Response Delivery**: The service returns the appropriate response to the user

## Supported Intents

The Enterprise Automation Agent Service supports the following intents:

1. **HR-Related Intents**:
   - `employee_info`: Queries about employee information and records
   - `time_off`: Queries about vacation, sick leave, and time-off requests
   - `payroll`: Queries about salary, benefits, and payroll information
   - `compliance`: Queries about HR policies and compliance requirements
   - `onboarding`: Queries about new employee onboarding processes
   - `performance`: Queries about performance reviews and evaluations
   - `benefits`: Queries about health insurance, retirement plans, and other benefits
   - `training`: Queries about employee training and development programs

2. **IT Support Intents**:
   - `technical_support`: General IT support and troubleshooting
   - `system_access`: Queries about system access and permissions
   - `software_requests`: Requests for software installation or updates
   - `hardware_issues`: Hardware troubleshooting and support
   - `security`: Security-related queries and incident reporting

3. **General Business Intents**:
   - `process_automation`: Queries about business process automation
   - `workflow_management`: Workflow creation and management
   - `reporting`: Business reporting and analytics requests
   - `compliance_general`: General compliance and regulatory queries
   - `project_management`: Project tracking and management queries

4. **System Intents**:
   - `greeting`: Greeting messages
   - `farewell`: Farewell messages
   - `help`: Help requests
   - `unknown`: Unknown intents requiring clarification

## Example Queries

### HR-Related Query

**User Query**: "Show me all employees with time off requests for next month"

**Intent Detection**:
```json
{
  "intent": "time_off",
  "agent_type": "HR",
  "parameters": {
    "timeframe": "next month",
    "request_type": "all"
  },
  "is_ambiguous": false,
  "confidence": 0.95
}
```

**Agent Processing**:
The HR agent processes the request by querying the HR management system for time-off requests and employee data.

**Response**:
```json
{
  "status": "success",
  "message": "Here are the employees with time off requests for next month:",
  "data": [
    {
      "employee_id": "EMP001",
      "name": "John Smith",
      "department": "Engineering",
      "request_type": "Vacation",
      "start_date": "2024-02-15",
      "end_date": "2024-02-22",
      "status": "Approved"
    },
    {
      "employee_id": "EMP002", 
      "name": "Jane Doe",
      "department": "Marketing",
      "request_type": "Sick Leave",
      "start_date": "2024-02-10",
      "end_date": "2024-02-12",
      "status": "Pending"
    }
  ]
}
```

### IT Support Query

**User Query**: "I need access to the new project management system"

**Intent Detection**:
```json
{
  "intent": "system_access",
  "agent_type": "IT",
  "parameters": {
    "system": "project management system",
    "request_type": "access"
  },
  "is_ambiguous": false,
  "confidence": 0.92
}
```

**Response**:
```json
{
  "status": "success", 
  "message": "I've created an access request for the project management system. Here's what happens next:",
  "data": {
    "ticket_id": "IT-2024-001",
    "estimated_time": "2-4 hours",
    "next_steps": [
      "Your manager will receive an approval request",
      "Once approved, IT will provision your account",
      "You'll receive login credentials via secure email",
      "Optional training session available next Tuesday"
    ]
  }
}
```

### Ambiguous Query

**User Query**: "Tell me about the policies"

**Intent Detection**:
```json
{
  "intent": "unknown",
  "parameters": {},
  "is_ambiguous": true,
  "ambiguity_reason": "The query is too vague and could refer to multiple types of policies",
  "confidence": 0.3
}
```

**Clarification**:
```json
{
  "status": "clarification_needed",
  "message": "I need more information to help you with your query about policies.",
  "clarification_question": "What specific type of policies would you like to know about? For example:\n1. HR policies (vacation, remote work, etc.)\n2. IT security policies\n3. Compliance policies\n4. General company policies",
  "session_id": "session-123"
}
```

## Configuration

The Enterprise Automation Agent Service uses the following configuration settings:

- `LLM_API_TYPE`: The LLM provider to use for intent detection and response generation
- `LLM_API_BASE`: The API base URL for the LLM provider
- `LLM_API_KEY`: The API key for the LLM provider
- `LLM_MODEL`: The model to use for intent detection and response generation
- `HR_SYSTEM_ENABLED`: Whether HR system integration is enabled
- `IT_SYSTEM_ENABLED`: Whether IT system integration is enabled
- `ENTERPRISE_DB_CONNECTION`: Database connection for enterprise data

## Error Handling

The Enterprise Automation Agent Service includes robust error handling:

1. **Intent Detection Errors**: If intent detection fails, the service defaults to a generic query
2. **Agent Routing Errors**: If agent routing fails, the service falls back to the general agent
3. **Response Generation Errors**: If response generation fails, the service returns an appropriate error message
4. **System Integration Errors**: If external system integration fails, the service provides fallback responses
5. **Clarification Errors**: If clarification generation fails, the service returns a generic clarification request

## Logging

The Lease Agent Service logs the following information:

- Query processing requests and responses
- Intent detection results
- SQL generation requests and responses
- Direct response generation requests and responses
- Clarification generation requests and responses
- Errors and exceptions

## Best Practices

When using the Lease Agent Service, follow these best practices:

1. **Intent Detection**: Use appropriate LLM models for intent detection
2. **SQL Generation**: Enable Snowflake Cortex for the best SQL generation
3. **Direct Response**: Use appropriate LLM models for direct responses
4. **Clarification**: Generate clear and specific clarification questions
5. **Error Handling**: Always handle errors appropriately
6. **Logging**: Use the logging information for debugging and monitoring

## Future Enhancements

Planned enhancements for the Lease Agent Service include:

1. **Additional Agent Types**: Support for more specialized enterprise agents (Finance, Legal, Operations)
2. **Improved Intent Detection**: More accurate intent detection using advanced ML models
3. **Enhanced Multi-Agent Coordination**: Better coordination between multiple agents for complex queries
4. **Improved Response Generation**: More contextual and helpful responses based on enterprise knowledge
5. **Enhanced Workflow Integration**: Integration with popular enterprise workflow systems
6. **Advanced Analytics**: Query history and usage analytics for better insights
7. **Proactive Assistance**: Proactive suggestions and recommendations based on user patterns
7. **User Preferences**: Support for user preferences
8. **Multi-turn Conversations**: Support for multi-turn conversations 