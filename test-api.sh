#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:3000"

echo "🧪 Testing Banduka POS API..."
echo ""

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - API is running"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ FAILED${NC} - API not responding (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Swagger Documentation
echo -e "${BLUE}Test 2: Swagger Documentation${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/api)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Swagger docs accessible"
else
    echo -e "${RED}❌ FAILED${NC} - Swagger not accessible (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Login Endpoint (without credentials)
echo -e "${BLUE}Test 3: Login Endpoint${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Login endpoint responding correctly"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Unexpected response (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Protected Endpoint (without auth)
echo -e "${BLUE}Test 4: Protected Endpoint (Sales)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/sales)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Authentication required (as expected)"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Expected 401, got HTTP $HTTP_CODE"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ API Tests Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Open Swagger UI: http://localhost:3000/api"
echo "2. Register a user"
echo "3. Login and get JWT token"
echo "4. Test protected endpoints"
echo ""
