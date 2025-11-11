# AI Integration Quick Start Guide

## Overview

This application uses Anthropic's Claude 3.5 Sonnet for AI-powered demand letter generation with real-time streaming.

## Setup

### 1. Install Dependencies

Already installed with the project:
```bash
pnpm install
```

### 2. Configure API Key

Add your Anthropic API key to `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your API key from: https://console.anthropic.com/

### 3. Verify Setup

Run tests to ensure everything is working:
```bash
pnpm test:run lib/services/__tests__/ai.service.test.ts
pnpm test:run app/api/ai/__tests__/generate.test.ts
```

## Using the API

### Endpoint

```
POST /api/ai/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

```json
{
  "projectId": "uuid",
  "templateId": "uuid",
  "variables": {
    "plaintiffName": "John Doe",
    "defendantName": "ABC Corp",
    "incidentDate": "2024-01-15"
  }
}
```

### Response (Server-Sent Events)

Streams real-time content chunks:
```
data: {"type":"content","text":"chunk of text"}

data: {"type":"done","metadata":{"tokenUsage":{...}}}

data: {"type":"error","error":"error message"}
```

## Testing

### Automated Test Script

```bash
./test-ai-generation.sh
```

### Manual Testing with curl

```bash
# 1. Login
ACCESS_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"attorney@smithlaw.com","password":"password123"}' \
  | jq -r '.accessToken')

# 2. Generate demand letter
curl -N -X POST http://localhost:3000/api/ai/generate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-uuid",
    "templateId": "your-template-uuid",
    "variables": {
      "plaintiffName": "John Doe",
      "defendantName": "ABC Corp"
    }
  }'
```

## Cost Tracking

Approximate costs per demand letter:
- **~1,200 input tokens** + **~800 output tokens** = **~$0.015** (1.5 cents)

Token usage is returned in the metadata:
```json
{
  "tokenUsage": {
    "inputTokens": 1200,
    "outputTokens": 800
  },
  "duration": 3456
}
```

## Key Files

- **AI Service:** `lib/services/ai.service.ts`
- **API Endpoint:** `app/api/ai/generate/route.ts`
- **Tests:** `lib/services/__tests__/ai.service.test.ts`
- **Integration Tests:** `app/api/ai/__tests__/generate.test.ts`

## Documentation

Full implementation details: `docs/STORY-2.6-AI-INTEGRATION.md`

## Security Notes

- API key is server-side only
- JWT authentication required
- Firm-level data isolation enforced
- Never commit `.env` to version control

## Troubleshooting

**"Invalid API key"** - Check `.env` has correct `ANTHROPIC_API_KEY`

**"No source documents"** - Upload documents to project and ensure extraction completed

**"Rate limit exceeded"** - Wait a moment and retry

**"Project not found"** - Verify project UUID and firm access
