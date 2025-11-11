# Template CRUD API Documentation

**Story 3.2: Template CRUD API Endpoints**

This document provides comprehensive documentation for all template management API endpoints.

## Overview

The Template CRUD API enables law firms to create, manage, and version demand letter templates. All endpoints enforce firm-level isolation for security and support role-based access control.

### Security Features

- **Firm Isolation**: All queries automatically filter by `firmId` from JWT token
- **RBAC**: Create, Update, and Delete operations require `admin` or `attorney` role
- **404 vs 403**: Cross-firm access returns 404 (not 403) to prevent information disclosure
- **Input Validation**: All requests validated using Zod schemas

### Automatic Versioning

Every template update automatically creates a new version record in the `template_versions` table, providing complete audit trail and restore capability.

---

## Endpoints

### 1. List Templates

**GET** `/api/templates`

Returns paginated list of templates for the authenticated user's firm.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by template name or description |
| `isActive` | boolean | - | Filter by active status (true/false) |
| `page` | number | 1 | Page number (min: 1) |
| `limit` | number | 20 | Items per page (min: 1, max: 100) |

#### Success Response (200)

```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Personal Injury Template",
      "description": "Template for personal injury cases",
      "sections": [...],
      "variables": [...],
      "isActive": true,
      "firmId": "uuid",
      "version": 3,
      "createdBy": "uuid",
      "createdAt": "2025-11-11T12:00:00Z",
      "updatedAt": "2025-11-11T12:30:00Z",
      "creator": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@firm.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Example Request

```bash
curl -X GET "https://api.example.com/api/templates?search=injury&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

### 2. Get Single Template

**GET** `/api/templates/:id`

Returns a single template with full structure if it belongs to the authenticated user's firm.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Template ID |

#### Success Response (200)

```json
{
  "template": {
    "id": "uuid",
    "name": "Personal Injury Template",
    "description": "Template for personal injury cases",
    "sections": [
      {
        "id": "uuid",
        "title": "Introduction",
        "type": "static",
        "content": "Dear {{defendant_name}},",
        "promptGuidance": null,
        "required": true,
        "order": 1
      },
      {
        "id": "uuid",
        "title": "Facts",
        "type": "ai_generated",
        "content": null,
        "promptGuidance": "Summarize the case facts from uploaded documents",
        "required": true,
        "order": 2
      }
    ],
    "variables": [
      {
        "name": "defendant_name",
        "type": "text",
        "required": true,
        "defaultValue": null
      },
      {
        "name": "demand_amount",
        "type": "currency",
        "required": true,
        "defaultValue": null
      }
    ],
    "isActive": true,
    "firmId": "uuid",
    "version": 3,
    "createdBy": "uuid",
    "createdAt": "2025-11-11T12:00:00Z",
    "updatedAt": "2025-11-11T12:30:00Z",
    "creator": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@firm.com"
    }
  }
}
```

#### Error Responses

- **404 Not Found**: Template doesn't exist or belongs to different firm
- **401 Unauthorized**: Missing or invalid authentication token

---

### 3. Create Template

**POST** `/api/templates`

Creates a new template and initial version record. Requires `admin` or `attorney` role.

#### Request Body

```json
{
  "name": "Contract Dispute Template",
  "description": "Template for contract dispute cases",
  "sections": [
    {
      "id": "uuid",
      "title": "Introduction",
      "type": "static",
      "content": "Dear {{defendant_name}},",
      "promptGuidance": null,
      "required": true,
      "order": 1
    },
    {
      "id": "uuid",
      "title": "Contract Summary",
      "type": "ai_generated",
      "content": null,
      "promptGuidance": "Summarize the contract terms and parties",
      "required": true,
      "order": 2
    }
  ],
  "variables": [
    {
      "name": "defendant_name",
      "type": "text",
      "required": true,
      "defaultValue": null
    },
    {
      "name": "contract_date",
      "type": "date",
      "required": true,
      "defaultValue": null
    }
  ]
}
```

#### Validation Rules

1. **Template must have at least one section**
2. **Variable names must be unique**
3. **Variable names must be alphanumeric + underscores only**
4. **AI-generated sections must have prompt guidance**
5. **Variable references in static content must be defined**

#### Success Response (201)

```json
{
  "template": {
    "id": "uuid",
    "name": "Contract Dispute Template",
    "description": "Template for contract dispute cases",
    "sections": [...],
    "variables": [...],
    "isActive": true,
    "firmId": "uuid",
    "version": 1,
    "createdBy": "uuid",
    "createdAt": "2025-11-11T12:00:00Z",
    "updatedAt": "2025-11-11T12:00:00Z"
  },
  "message": "Template created successfully"
}
```

#### Error Responses

- **400 Bad Request**: Validation error (duplicate variables, invalid section types, etc.)
- **403 Forbidden**: User doesn't have required role (admin/attorney)

---

### 4. Update Template

**PUT** `/api/templates/:id`

Updates template and automatically creates new version. Requires `admin` or `attorney` role.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Template ID |

#### Request Body (Partial Update Supported)

```json
{
  "name": "Updated Template Name",
  "description": "Updated description",
  "sections": [
    {
      "id": "uuid",
      "title": "New Section",
      "type": "static",
      "content": "Content",
      "promptGuidance": null,
      "required": true,
      "order": 3
    }
  ]
}
```

At least one field must be provided for update.

#### Success Response (200)

```json
{
  "template": {
    "id": "uuid",
    "name": "Updated Template Name",
    "version": 4,
    "updatedAt": "2025-11-11T13:00:00Z",
    ...
  },
  "message": "Template updated successfully"
}
```

#### Automatic Versioning

When a template is updated:
1. Template `version` field increments
2. New record created in `template_versions` table
3. Previous version preserved for history/restore

---

### 5. Delete Template (Soft Delete)

**DELETE** `/api/templates/:id`

Soft deletes template by setting `isActive: false`. Requires `admin` or `attorney` role.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Template ID |

#### Success Response (200)

```json
{
  "message": "Template deleted successfully"
}
```

#### Notes

- Template record remains in database with `isActive: false`
- Template no longer appears in active template lists
- Can be reactivated by setting `isActive: true` via update endpoint

---

### 6. Get Version History

**GET** `/api/templates/:id/versions`

Returns all versions for a template.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Template ID |

#### Success Response (200)

```json
{
  "template": {
    "id": "uuid",
    "name": "Personal Injury Template",
    "currentVersion": 5
  },
  "versions": [
    {
      "id": "uuid",
      "templateId": "uuid",
      "versionNumber": 5,
      "structure": {
        "sections": [...],
        "variables": [...]
      },
      "createdBy": "uuid",
      "createdAt": "2025-11-11T13:00:00Z",
      "creator": {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@firm.com"
      }
    },
    {
      "id": "uuid",
      "templateId": "uuid",
      "versionNumber": 4,
      "structure": {...},
      "createdBy": "uuid",
      "createdAt": "2025-11-11T12:30:00Z",
      "creator": {...}
    }
  ]
}
```

Versions are sorted by version number (descending - newest first).

---

### 7. Restore Version

**POST** `/api/templates/:id/versions/:version/restore`

Restores a previous version by creating a new version with the old structure. Requires `admin` or `attorney` role.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Template ID |
| `version` | number | Version number to restore |

#### Request Body (Optional)

```json
{
  "changeDescription": "Restored to version 3 due to user feedback"
}
```

#### Success Response (200)

```json
{
  "template": {
    "id": "uuid",
    "name": "Personal Injury Template",
    "version": 6,
    "sections": [...],
    "variables": [...],
    "updatedAt": "2025-11-11T14:00:00Z"
  },
  "message": "Template restored to version 3 (now version 6)",
  "restoredFromVersion": 3,
  "newVersion": 6
}
```

#### Important Notes

- **Does NOT overwrite current version**
- **Creates NEW version** with restored structure
- Maintains complete audit trail
- All users can see version history

---

## Error Handling

All endpoints follow consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "FORBIDDEN" | "INTERNAL_ERROR",
    "message": "Human-readable error message",
    "details": { /* Optional field-specific details */ },
    "timestamp": "2025-11-11T12:00:00Z",
    "requestId": "uuid"
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions (role check failed) |
| 404 | NOT_FOUND | Resource not found or cross-firm access |
| 500 | INTERNAL_ERROR | Server error |

---

## Authentication

All endpoints require JWT authentication via `Authorization` header:

```
Authorization: Bearer <access_token>
```

JWT payload must include:
- `userId`: User's UUID
- `email`: User's email
- `role`: User's role (admin, attorney, paralegal)
- `firmId`: User's firm UUID

---

## Role-Based Access Control

| Endpoint | Admin | Attorney | Paralegal |
|----------|-------|----------|-----------|
| GET /api/templates | ✓ | ✓ | ✓ |
| GET /api/templates/:id | ✓ | ✓ | ✓ |
| POST /api/templates | ✓ | ✓ | ✗ |
| PUT /api/templates/:id | ✓ | ✓ | ✗ |
| DELETE /api/templates/:id | ✓ | ✓ | ✗ |
| GET /api/templates/:id/versions | ✓ | ✓ | ✓ |
| POST /api/templates/:id/versions/:version/restore | ✓ | ✓ | ✗ |

---

## Section Types

### Static Section
Boilerplate content that doesn't change.

```json
{
  "id": "uuid",
  "title": "Introduction",
  "type": "static",
  "content": "Dear {{defendant_name}},\n\nThis letter serves as formal notice...",
  "promptGuidance": null,
  "required": true,
  "order": 1
}
```

### AI-Generated Section
Content generated by AI based on prompt guidance.

```json
{
  "id": "uuid",
  "title": "Case Facts",
  "type": "ai_generated",
  "content": null,
  "promptGuidance": "Summarize the key facts of the case based on uploaded documents, focusing on liability and damages",
  "required": true,
  "order": 2
}
```

### Variable Section
Content with variable placeholders.

```json
{
  "id": "uuid",
  "title": "Demand",
  "type": "variable",
  "content": "We demand payment of {{demand_amount}} by {{deadline_date}}.",
  "promptGuidance": null,
  "required": true,
  "order": 3
}
```

---

## Variable Types

### Text
Plain text input.

```json
{
  "name": "plaintiff_name",
  "type": "text",
  "required": true,
  "defaultValue": "John Doe"
}
```

### Number
Numeric input.

```json
{
  "name": "case_number",
  "type": "number",
  "required": true,
  "defaultValue": null
}
```

### Date
Date input.

```json
{
  "name": "incident_date",
  "type": "date",
  "required": true,
  "defaultValue": null
}
```

### Currency
Monetary amount.

```json
{
  "name": "demand_amount",
  "type": "currency",
  "required": true,
  "defaultValue": 50000
}
```

---

## Testing

### Unit Tests
- Location: `/lib/validations/__tests__/template.test.ts`
- Coverage: All validation schemas and rules
- Run: `npm test -- lib/validations/__tests__/template.test.ts`

### Integration Tests
- **CRUD Operations**: `/app/api/templates/__tests__/templates-crud.test.ts`
- **Firm Isolation**: `/app/api/templates/__tests__/firm-isolation.test.ts`
- Run: `npm test -- app/api/templates/__tests__/`

All tests passing: 49/49 ✓

---

## Implementation Notes

### Files Created/Modified

1. **API Routes**:
   - `/app/api/templates/route.ts` - List and create templates
   - `/app/api/templates/[id]/route.ts` - Get, update, delete single template
   - `/app/api/templates/[id]/versions/route.ts` - Get version history
   - `/app/api/templates/[id]/versions/[version]/restore/route.ts` - Restore version

2. **Validation**:
   - `/lib/validations/template.ts` - Zod schemas for all operations

3. **Tests**:
   - `/lib/validations/__tests__/template.test.ts` - Unit tests (25 tests)
   - `/app/api/templates/__tests__/templates-crud.test.ts` - Integration tests (11 tests)
   - `/app/api/templates/__tests__/firm-isolation.test.ts` - Security tests (13 tests)

### Database Schema
Uses existing schema from Story 3.1:
- `templates` table - Main template storage
- `template_versions` table - Version history

---

## Sample Request/Response Examples

### Create Template Example

**Request:**
```bash
curl -X POST https://api.example.com/api/templates \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Personal Injury Template",
    "description": "Standard template for PI cases",
    "sections": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Introduction",
        "type": "static",
        "content": "Dear {{defendant_name}},",
        "promptGuidance": null,
        "required": true,
        "order": 1
      }
    ],
    "variables": [
      {
        "name": "defendant_name",
        "type": "text",
        "required": true,
        "defaultValue": null
      }
    ]
  }'
```

**Response:**
```json
{
  "template": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Personal Injury Template",
    "version": 1,
    "firmId": "firm-uuid",
    "createdAt": "2025-11-11T12:00:00Z"
  },
  "message": "Template created successfully"
}
```

### Update Template Example

**Request:**
```bash
curl -X PUT https://api.example.com/api/templates/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Personal Injury Template"
  }'
```

**Response:**
```json
{
  "template": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Updated Personal Injury Template",
    "version": 2,
    "updatedAt": "2025-11-11T13:00:00Z"
  },
  "message": "Template updated successfully"
}
```

---

## Story 3.2 Acceptance Criteria Status

All 11 acceptance criteria have been implemented and tested:

- ✅ AC #1: GET /api/templates returns firm-filtered list
- ✅ AC #2: GET /api/templates/:id returns single template
- ✅ AC #3: POST /api/templates creates template with validation
- ✅ AC #4: PUT /api/templates/:id updates and auto-creates version
- ✅ AC #5: DELETE /api/templates/:id soft-deletes (isActive: false)
- ✅ AC #6: All endpoints enforce firm-level isolation
- ✅ AC #7: Validation ensures required fields and valid section types
- ✅ AC #8: GET /api/templates/:id/versions returns version history
- ✅ AC #9: POST /api/templates/:id/versions/:version/restore restores version
- ✅ AC #10: Unit tests cover CRUD and validation (25 tests passing)
- ✅ AC #11: Integration tests verify firm isolation and versioning (24 tests passing)

**Total Tests:** 49 passing ✓

---

## Next Steps

This implementation completes Story 3.2. Next stories in Epic 3:

- **Story 3.3**: Build Template Gallery View (frontend)
- **Story 3.4**: Build Template Builder UI - Section Management
- **Story 3.5**: Build Template Builder UI - Variable Definition
- **Story 3.6**: Implement Template Validation and Publishing
- **Story 3.7**: Implement Template Preview with Sample Data
- **Story 3.8**: Implement Template Versioning and History (UI)
- **Story 3.9**: Implement Template Access Control and Sharing (UI)
- **Story 3.10**: Seed Default Templates for Common Use Cases
