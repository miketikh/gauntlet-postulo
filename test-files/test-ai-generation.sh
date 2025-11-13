#!/bin/bash
set -e

API_URL="http://localhost:3002"

echo "Testing AI Generation Endpoint"
echo "==============================="
echo ""

# Step 1: Login to get access token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attorney@smithlaw.com",
    "password": "password123"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Successfully logged in"
echo "Access token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 2: Get first project ID
echo "2. Getting project list..."
PROJECTS_RESPONSE=$(curl -s -X GET "$API_URL/api/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

PROJECT_ID=$(echo $PROJECTS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ No projects found!"
  echo "Response: $PROJECTS_RESPONSE"
  exit 1
fi

echo "✓ Found project: $PROJECT_ID"
echo ""

# Step 3: Get first template ID
echo "3. Getting template list..."
TEMPLATES_RESPONSE=$(curl -s -X GET "$API_URL/api/templates" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

TEMPLATE_ID=$(echo $TEMPLATES_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TEMPLATE_ID" ]; then
  echo "❌ No templates found!"
  echo "Response: $TEMPLATES_RESPONSE"
  exit 1
fi

echo "✓ Found template: $TEMPLATE_ID"
echo ""

# Step 4: Test AI generation (requires ANTHROPIC_API_KEY in .env)
echo "4. Testing AI generation endpoint..."
echo "   Note: This requires ANTHROPIC_API_KEY to be set in .env"
echo ""

curl -N -X POST "$API_URL/api/ai/generate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"templateId\": \"$TEMPLATE_ID\",
    \"variables\": {
      \"plaintiffName\": \"John Doe\",
      \"defendantName\": \"ABC Corporation\",
      \"incidentDate\": \"2024-01-15\",
      \"demandAmount\": \"$100,000\"
    }
  }"

echo ""
echo ""
echo "✓ Test complete!"
