# API Reference

## Overview

Complete reference for all Steno API endpoints. Base URL for local development: `http://localhost:3000/api`

**Authentication**: Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer {accessToken}
```

---

## Authentication Endpoints

### POST /api/auth/register

Register new user account.

**Request:**
```json
{
  "email": "attorney@firm.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "firmId": "firm-uuid"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "attorney@firm.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "attorney",
    "firmId": "firm-uuid"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST /api/auth/login

Authenticate and receive tokens.

**Request:**
```json
{
  "email": "attorney@firm.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Errors:**
- 401: Invalid credentials
- 429: Too many failed attempts

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## Projects Endpoints

### GET /api/projects

List all projects for authenticated user's firm.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (draft, in_review, completed, sent)
- `search`: Search by title or client name

**Response (200):**
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "title": "Smith v. Johnson",
      "clientName": "Jane Smith",
      "status": "draft",
      "createdAt": "2024-11-10T10:00:00Z",
      "updatedAt": "2024-11-10T15:30:00Z",
      "createdBy": "user-uuid",
      "template": {
        "id": "template-uuid",
        "name": "Personal Injury Demand"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### POST /api/projects

Create new project.

**Request:**
```json
{
  "title": "Smith v. Johnson",
  "clientName": "Jane Smith",
  "templateId": "template-uuid",
  "caseDetails": {
    "incidentDate": "2024-09-15",
    "caseType": "personal_injury"
  }
}
```

**Response (201):**
```json
{
  "project": {
    "id": "project-uuid",
    "title": "Smith v. Johnson",
    "clientName": "Jane Smith",
    "status": "draft",
    "draft": {
      "id": "draft-uuid",
      "currentVersion": 1
    }
  }
}
```

### GET /api/projects/:id

Get project details.

**Response (200):**
```json
{
  "project": {
    "id": "project-uuid",
    "title": "Smith v. Johnson",
    "clientName": "Jane Smith",
    "status": "draft",
    "caseDetails": {...},
    "template": {...},
    "draft": {...},
    "sourceDocuments": [...]
  }
}
```

### PATCH /api/projects/:id

Update project.

**Request:**
```json
{
  "title": "Updated Title",
  "status": "in_review",
  "caseDetails": {...}
}
```

**Response (200):**
```json
{
  "project": {...}
}
```

### DELETE /api/projects/:id

Delete project (soft delete).

**Response (204):** No content

---

## Documents Endpoints

### POST /api/documents/upload

Upload source document.

**Request:** multipart/form-data
```
file: [PDF/DOCX/Image file]
projectId: "project-uuid"
```

**Response (201):**
```json
{
  "document": {
    "id": "doc-uuid",
    "fileName": "police_report.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "s3Key": "documents/firm-uuid/...",
    "extractionStatus": "processing",
    "uploadedBy": "user-uuid",
    "createdAt": "2024-11-10T10:00:00Z"
  }
}
```

### GET /api/documents/:id

Get document with presigned URL.

**Response (200):**
```json
{
  "document": {
    "id": "doc-uuid",
    "fileName": "police_report.pdf",
    "extractedText": "Full extracted text...",
    "extractionStatus": "completed",
    "presignedUrl": "https://s3.amazonaws.com/...",
    "urlExpiresAt": "2024-11-10T11:00:00Z"
  }
}
```

---

## AI Generation Endpoints

### POST /api/ai/generate

Generate demand letter (Server-Sent Events streaming).

**Request:**
```json
{
  "projectId": "project-uuid",
  "templateId": "template-uuid",
  "variables": {
    "plaintiff_name": "Jane Smith",
    "defendant_name": "John Johnson",
    "incident_date": "2024-09-15"
  }
}
```

**Response:** SSE stream
```
data: {"type":"chunk","content":"DEMAND LETTER\n\n"}

data: {"type":"chunk","content":"To: John Johnson\n"}

data: {"type":"complete","metadata":{"tokenUsage":{"inputTokens":1500,"outputTokens":800},"duration":15000}}
```

**Client Example:**
```typescript
const eventSource = new EventSource('/api/ai/generate', {
  headers: { Authorization: `Bearer ${token}` }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chunk') {
    appendText(data.content);
  } else if (data.type === 'complete') {
    console.log('Generation complete', data.metadata);
  }
};
```

### POST /api/ai/refine

Refine section (Server-Sent Events streaming).

**Request:**
```json
{
  "sectionContent": "Original text to refine...",
  "refinementInstructions": "Make more assertive",
  "sourceText": "Context from source documents..."
}
```

**Response:** SSE stream (same format as generate)

---

## Templates Endpoints

### GET /api/templates

List templates.

**Query Parameters:**
- `published`: Filter by published status (true/false)

**Response (200):**
```json
{
  "templates": [
    {
      "id": "template-uuid",
      "name": "Personal Injury Demand Letter",
      "description": "Standard demand letter for PI cases",
      "isActive": true,
      "isDefault": true,
      "version": 2,
      "sections": [...],
      "variables": [...],
      "createdBy": "user-uuid",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/templates

Create template (admin only).

**Request:**
```json
{
  "name": "Contract Breach Demand",
  "description": "For contract dispute cases",
  "sections": [
    {
      "id": "intro",
      "title": "Introduction",
      "order": 1,
      "promptGuidance": "Introduce the case..."
    }
  ],
  "variables": [
    {
      "name": "contract_date",
      "label": "Contract Date",
      "type": "date",
      "required": true
    }
  ]
}
```

**Response (201):**
```json
{
  "template": {...}
}
```

### GET /api/templates/:id

Get template details.

### PUT /api/templates/:id

Update template.

### DELETE /api/templates/:id

Delete template.

---

## Drafts Endpoints

### GET /api/drafts/:id

Get draft content.

**Response (200):**
```json
{
  "draft": {
    "id": "draft-uuid",
    "projectId": "project-uuid",
    "content": {...}, // Lexical editor state
    "plainText": "Full text content...",
    "currentVersion": 3,
    "updatedAt": "2024-11-10T15:30:00Z"
  }
}
```

### POST /api/drafts/:id/export

Export draft to Word.

**Request:**
```json
{
  "format": "docx",
  "includeMetadata": true,
  "includeLetter head": true
}
```

**Response (200):**
```json
{
  "export": {
    "id": "export-uuid",
    "fileName": "Smith_v_Johnson_v3_2024-11-10.docx",
    "s3Key": "exports/...",
    "fileSize": 524288,
    "presignedUrl": "https://s3.amazonaws.com/...",
    "createdAt": "2024-11-10T16:00:00Z"
  }
}
```

### GET /api/drafts/:id/export

Get export history.

**Response (200):**
```json
{
  "exports": [
    {
      "id": "export-uuid",
      "version": 3,
      "fileName": "Smith_v_Johnson_v3_2024-11-10.docx",
      "exportedBy": {...},
      "createdAt": "2024-11-10T16:00:00Z"
    }
  ]
}
```

### GET /api/drafts/:id/versions

List version history.

**Response (200):**
```json
{
  "versions": [
    {
      "id": "snapshot-uuid",
      "version": 3,
      "changeDescription": "After attorney review",
      "createdBy": {...},
      "createdAt": "2024-11-10T15:00:00Z"
    }
  ]
}
```

### GET /api/drafts/:id/versions/:version

Get specific version.

### POST /api/drafts/:id/restore/:version

Restore previous version.

### GET /api/drafts/:id/diff

Compare versions.

**Query Parameters:**
- `from`: Version number to compare from
- `to`: Version number to compare to

**Response (200):**
```json
{
  "diff": {
    "additions": [...],
    "deletions": [...],
    "unchanged": [...]
  }
}
```

---

## Comments Endpoints

### GET /api/drafts/:id/comments

List comments for draft.

**Response (200):**
```json
{
  "comments": [
    {
      "id": "comment-uuid",
      "threadId": "thread-uuid",
      "content": "Please verify this amount",
      "author": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "selectionStart": 150,
      "selectionEnd": 200,
      "resolved": false,
      "createdAt": "2024-11-10T14:00:00Z",
      "replies": [...]
    }
  ]
}
```

### POST /api/drafts/:id/comments

Add comment.

**Request:**
```json
{
  "content": "Please verify this amount",
  "selectionStart": 150,
  "selectionEnd": 200,
  "threadId": null // Or existing thread ID to reply
}
```

**Response (201):**
```json
{
  "comment": {...}
}
```

### PATCH /api/comments/:id

Update comment.

**Request:**
```json
{
  "content": "Updated comment text",
  "resolved": true
}
```

### POST /api/comments/threads/:id/resolve

Resolve comment thread.

---

## Admin Endpoints

### GET /api/admin/users

List all users (admin only).

**Response (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "attorney@firm.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "attorney",
      "isActive": true,
      "lastLogin": "2024-11-10T09:00:00Z",
      "projectsCreated": 15,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/admin/users

Create user (admin only).

**Request:**
```json
{
  "email": "newuser@firm.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "paralegal",
  "password": "TempPass123"
}
```

### PATCH /api/admin/users/:id

Update user (admin only).

### POST /api/admin/users/:id/deactivate

Deactivate user (admin only).

### GET /api/admin/analytics

Get analytics data (admin only).

**Query Parameters:**
- `from`: Start date (ISO 8601)
- `to`: End date (ISO 8601)
- `metric`: Specific metric to fetch

**Response (200):**
```json
{
  "analytics": {
    "projectsCreated": 45,
    "aiGenerations": 67,
    "exports": 38,
    "activeUsers": 12,
    "tokenUsage": {
      "input": 150000,
      "output": 85000,
      "cost": 12.50
    },
    "charts": {
      "projectsOverTime": [...],
      "userActivity": [...]
    }
  }
}
```

### GET /api/admin/settings

Get firm settings (admin only).

### PATCH /api/admin/settings

Update firm settings (admin only).

**Request:**
```json
{
  "letterheadCompanyName": "Smith & Associates",
  "letterheadAddress": "123 Main St, Los Angeles, CA",
  "letterheadPhone": "(555) 123-4567",
  "exportFontFamily": "Times New Roman",
  "exportFontSize": 12,
  "exportMargins": {
    "top": 1,
    "bottom": 1,
    "left": 1,
    "right": 1
  }
}
```

### GET /api/admin/audit-logs

Get audit logs (admin only).

**Query Parameters:**
- `from`: Start date
- `to`: End date
- `userId`: Filter by user
- `action`: Filter by action type
- `resourceId`: Filter by resource

**Response (200):**
```json
{
  "logs": [
    {
      "id": "log-uuid",
      "timestamp": "2024-11-10T14:30:00Z",
      "userId": "user-uuid",
      "action": "project.create",
      "resourceType": "project",
      "resourceId": "project-uuid",
      "ipAddress": "192.168.1.1",
      "metadata": {...}
    }
  ]
}
```

---

## WebSocket Connection

### Connection

```
wss://[host]/collaboration?token={jwt}&room={draftId}
```

**Query Parameters:**
- `token`: JWT access token
- `room`: Draft ID to connect to

**Events:**

**Client to Server:**
```json
// Yjs document update
{
  "type": "update",
  "update": [0, 1, 2, ...] // Binary data
}

// Awareness update (cursor position)
{
  "type": "awareness",
  "update": {...}
}
```

**Server to Client:**
```json
// Yjs document update from other clients
{
  "type": "update",
  "update": [...]
}

// Awareness update (other users' cursors)
{
  "type": "awareness",
  "update": {...}
}

// User joined
{
  "type": "user-joined",
  "user": {
    "id": "user-uuid",
    "name": "John Doe"
  }
}

// User left
{
  "type": "user-left",
  "userId": "user-uuid"
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "timestamp": "2024-11-10T14:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `AI_GENERATION_ERROR` | 500 | AI service error |
| `TIMEOUT_ERROR` | 504 | Request timeout |

---

## Rate Limiting

**Limits:**
- Authentication endpoints: 5 requests/minute/IP
- AI generation: 10 requests/minute/user
- Standard endpoints: 100 requests/minute/user
- Admin endpoints: 50 requests/minute/user

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699632000
```

---

## Pagination

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Related Documentation

- [Architecture Overview](./architecture-overview.md)
- [Developer Setup](./setup.md)
- [Main Architecture Document](../architecture.md)
