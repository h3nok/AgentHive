#!/bin/bash

# Color codes for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for the API
BASE_URL="http://localhost:8000"

# Generate a MongoDB ObjectId-like string
# Format: 24 hexadecimal characters
SESSION_ID="507f1f77bcf86cd799439011"  # Example MongoDB ObjectId

# Function to make API calls and display results
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    echo -e "\n${BLUE}Testing ${method} ${endpoint}${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data" \
            "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            "${BASE_URL}${endpoint}")
    fi
    
    # Pretty print the JSON response
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

# Test health check endpoint
echo -e "\n${GREEN}Testing Health Check Endpoints${NC}"
make_request "GET" "/health"
make_request "GET" "/api/health"

# Test root endpoint
echo -e "\n${GREEN}Testing Root Endpoint${NC}"
make_request "GET" "/"

# Test agent query endpoint
echo -e "\n${GREEN}Testing Agent Query Endpoint${NC}"
make_request "POST" "/agent/query" \
    "{\"query\": \"What is the status of lease XYZ?\", \"session_id\": \"$SESSION_ID\"}" \
    "x-client-id: test-client"

# Test MCP context endpoints
echo -e "\n${GREEN}Testing MCP Context Endpoints${NC}"
make_request "POST" "/mcp/context" \
    "{
        \"session_id\": \"$SESSION_ID\",
        \"context_items\": [
            {
                \"type\": \"chat_history\",
                \"content\": {\"role\": \"user\", \"message\": \"Test message\"},
                \"priority\": 5
            }
        ],
        \"replace_existing\": false
    }"

make_request "GET" "/mcp/context/$SESSION_ID"

# Test sessions endpoints
echo -e "\n${GREEN}Testing Sessions Endpoints${NC}"
make_request "POST" "/sessions" \
    "{\"title\": \"Test Session\"}"

# Note: The following endpoints require authentication
# They are included but will likely return 401/403
echo -e "\n${YELLOW}Note: The following endpoints require authentication${NC}"
make_request "GET" "/sessions"
make_request "GET" "/sessions/$SESSION_ID"

echo -e "\n${GREEN}Tests completed!${NC}" 