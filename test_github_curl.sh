#!/bin/bash

# GitHub Connector API Test Script
# Tests all GitHub connector endpoints with curl

BASE_URL="http://localhost:8001/api/v1/connectors/github"

echo "🚀 GitHub Connector API Test Suite"
echo "=================================="

# Function to test endpoint with curl
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo ""
    echo "🔍 Testing: $description"
    echo "   Method: $method"
    echo "   URL: $BASE_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract HTTP code and response body
    http_code=$(echo "$response" | tail -n1 | sed 's/HTTP_CODE://')
    body=$(echo "$response" | sed '$d')
    
    echo "   Status: $http_code"
    echo "   Response:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    
    if [ "$http_code" -eq 200 ]; then
        echo "   ✅ SUCCESS"
    else
        echo "   ❌ FAILED"
    fi
}

# Test 1: Health Check
test_endpoint "GET" "/health" "" "Health Check Endpoint"

# Test 2: Capabilities
test_endpoint "GET" "/capabilities" "" "Capabilities Endpoint"

# Test 3: Test Connection (Mock Mode)
test_connection_data='{
    "token": "mock_token",
    "base_url": "https://api.github.com",
    "organization": "test-org",
    "mock_mode": true
}'
test_endpoint "POST" "/test-connection" "$test_connection_data" "Test Connection (Mock Mode)"

# Test 4: Discover APIs (Mock Mode)
discover_apis_data='{
    "token": "mock_token",
    "base_url": "https://api.github.com",
    "mock_mode": true
}'
test_endpoint "POST" "/discover-apis" "$discover_apis_data" "Discover APIs (Mock Mode)"

# Test 5: Test Connection with Real Token (if provided)
if [ ! -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "🔑 Testing with Real GitHub Token"
    real_connection_data='{
        "token": "'$GITHUB_TOKEN'",
        "base_url": "https://api.github.com",
        "organization": "",
        "mock_mode": false
    }'
    test_endpoint "POST" "/test-connection" "$real_connection_data" "Test Connection (Real Token)"
else
    echo ""
    echo "ℹ️  To test with real GitHub token, set GITHUB_TOKEN environment variable"
    echo "   Example: GITHUB_TOKEN=your_token ./test_github_curl.sh"
fi

echo ""
echo "=================================="
echo "✅ GitHub Connector API Test Complete!"
echo ""
echo "📝 Usage Notes:"
echo "   - Make sure backend server is running on port 8001"
echo "   - For real API testing, provide GITHUB_TOKEN environment variable"
echo "   - All endpoints should return 200 status for successful operation"
