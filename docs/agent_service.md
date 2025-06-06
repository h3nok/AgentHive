# TSC ChatTSC Service Documentation

## Overview

The TSC ChatTSC Service is the core component of the TSC Chat system. It processes user queries, detects their intent, and routes them to the appropriate service for handling. For SQL-related queries, it uses the Snowflake Cortex Service, which in turn may use the SQL Generator service as a fallback.

## Architecture

The TSC ChatTSC Service is designed with a modular architecture:

1. **Query Processing**: The main entry point for processing user queries
2. **Intent Detection**: Detecting the intent of user queries
3. **SQL Generation**: Generating SQL queries for database-related intents
4. **Direct Response**: Generating direct responses for non-SQL intents
5. **Clarification**: Generating clarification questions for ambiguous queries

## Components

### LeaseAgentService Class

The `LeaseAgentService` class is the main entry point for all agent interactions. It provides methods for:

- Processing user queries
- Detecting query intent
- Handling SQL queries
- Generating direct responses
- Clarifying ambiguous queries

#### Key Methods

- `process_query(query: str, session_id: Optional[str] = None) -> Dict[str, Any]`: Processes a user query
- `_detect_intent(query: str) -> Dict[str, Any]`: Detects the intent of a query
- `_intent_requires_sql(intent: str) -> bool`: Determines if an intent requires SQL
- `_handle_sql_query(query: str, intent_data: Dict[str, Any]) -> Dict[str, Any]`: Handles SQL queries
- `_generate_direct_response(query: str, intent_data: Dict[str, Any]) -> Dict[str, Any]`: Generates direct responses
- `_generate_clarification(query: str, intent_data: Dict[str, Any]) -> Dict[str, Any]`: Generates clarification questions

## Integration with SQL Generator and Snowflake Cortex

The Lease Agent Service integrates with the SQL Generator and Snowflake Cortex services in the following ways:

1. **Intent Detection**: The service detects if a query requires SQL generation
2. **SQL Generation**: If SQL is required, the service uses the Snowflake Cortex Service
3. **Fallback Mechanism**: The Snowflake Cortex Service may fall back to the SQL Generator
4. **Response Generation**: The service formats the SQL results into a user-friendly response

## Query Processing Flow

1. **Query Reception**: The user query is received by the `process_query` method
2. **Intent Detection**: The service detects the intent of the query
3. **Intent Classification**: The service determines if the intent requires SQL
4. **SQL Generation**: If SQL is required, the service uses the Snowflake Cortex Service
5. **Direct Response**: If SQL is not required, the service generates a direct response
6. **Clarification**: If the query is ambiguous, the service generates clarification questions
7. **Response Generation**: The service returns the appropriate response to the user

## Supported Intents

The Lease Agent Service supports the following intents:

1. **SQL-Related Intents**:
   - `property_ownership`: Queries about property ownership
   - `lease_expiration`: Queries about lease expiration dates
   - `covenant_status`: Queries about lease covenants
   - `disaster_recovery`: Queries about disaster recovery contacts
   - `store_closure`: Queries about store closures
   - `cti_reimbursement`: Queries about CAM, tax, insurance reimbursement
   - `landlord_default`: Queries about landlord default
   - `tenant_default`: Queries about tenant default
   - `termination_details`: Queries about termination rights
   - `landlord_contact`: Queries about landlord contacts
   - `lease_option`: Queries about lease options
   - `lease_abstract`: Queries about lease abstracts
   - `recurring_expenses`: Queries about recurring expenses
   - `financial_offsets`: Queries about financial offsets

2. **Non-SQL Intents**:
   - `generic_query`: General queries not requiring SQL
   - `greeting`: Greeting messages
   - `farewell`: Farewell messages
   - `help`: Help requests
   - `unknown`: Unknown intents

## Example Queries

### SQL-Related Query

**User Query**: "Show me all leases expiring in the next 12 months"

**Intent Detection**:
```json
{
  "intent": "lease_expiration",
  "parameters": {
    "timeframe": "12 months"
  },
  "is_ambiguous": false,
  "confidence": 0.95
}
```

**SQL Generation**:
```sql
SELECT 
    e.STORE_NO,
    e.ANSWER AS expiration_date
FROM 
    STG_EA_DATA.REAL_ESTATE_LEASE_EXTRACTED_ENTITES e
JOIN 
    STG_EA_DATA.REAL_ESTATE_LEASE_ENTITY_MASTER m ON e.ENTITY_ID = m.ENTITY_ID
WHERE 
    m.NAME = 'Lease Expiration Date'
    AND TO_DATE(e.ANSWER, 'YYYY-MM-DD') BETWEEN CURRENT_DATE() AND DATEADD(month, 12, CURRENT_DATE())
ORDER BY 
    TO_DATE(e.ANSWER, 'YYYY-MM-DD')
```

**Response**:
```json
{
  "status": "success",
  "message": "Here are the leases expiring in the next 12 months:",
  "data": [
    {
      "store_no": 123,
      "expiration_date": "2023-12-31"
    },
    {
      "store_no": 456,
      "expiration_date": "2024-01-15"
    }
  ]
}
```

### Ambiguous Query

**User Query**: "Tell me about the lease"

**Intent Detection**:
```json
{
  "intent": "generic_query",
  "parameters": {},
  "is_ambiguous": true,
  "ambiguity_reason": "The query is too vague and could refer to multiple aspects of the lease",
  "confidence": 0.3
}
```

**Clarification**:
```json
{
  "status": "clarification_needed",
  "message": "I need more information to help you with your query about the lease.",
  "clarification_question": "What specific aspect of the lease would you like to know about? For example:\n1. Lease expiration date\n2. Property ownership\n3. Roof responsibility\n4. Financial terms",
  "session_id": "session-123"
}
```

## Configuration

The Lease Agent Service uses the following configuration settings:

- `LLM_API_TYPE`: The LLM provider to use for intent detection and direct responses
- `LLM_API_BASE`: The API base URL for the LLM provider
- `LLM_API_KEY`: The API key for the LLM provider
- `LLM_MODEL`: The model to use for intent detection and direct responses
- `SNOWFLAKE_CORTEX_ENABLED`: Whether Snowflake Cortex is enabled
- `SNOWFLAKE_CORTEX_CONFIDENCE_THRESHOLD`: The confidence threshold for using Snowflake Cortex

## Error Handling

The Lease Agent Service includes robust error handling:

1. **Intent Detection Errors**: If intent detection fails, the service defaults to a generic query
2. **SQL Generation Errors**: If SQL generation fails, the service returns an error message
3. **Direct Response Errors**: If direct response generation fails, the service returns a generic error message
4. **Clarification Errors**: If clarification generation fails, the service returns a generic clarification request

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

1. **Additional Intents**: Support for additional query intents
2. **Improved Intent Detection**: More accurate intent detection
3. **Enhanced SQL Generation**: Better SQL generation with more complex queries
4. **Improved Direct Responses**: More accurate and helpful direct responses
5. **Enhanced Clarification**: More specific and helpful clarification questions
6. **Query History**: Tracking query history for better context
7. **User Preferences**: Support for user preferences
8. **Multi-turn Conversations**: Support for multi-turn conversations 