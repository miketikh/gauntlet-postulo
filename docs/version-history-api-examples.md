# Draft Version History API Examples

This document provides example API calls for testing the draft version history endpoints.

## Prerequisites

- User must be authenticated (JWT token required)
- Draft must exist and belong to user's firm

## Environment Variables

```bash
# Set your access token from login
TOKEN="your-jwt-token-here"

# Set draft ID (from database or previous API call)
DRAFT_ID="uuid-of-draft"
```

## API Endpoints

### 1. List All Versions

Get all versions for a draft (limited to last 50).

```bash
curl -X GET http://localhost:3000/api/drafts/$DRAFT_ID/versions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "versions": [
    {
      "id": "uuid",
      "version": 3,
      "changeDescription": "Updated draft - version 3",
      "createdAt": "2025-11-10T12:30:00Z",
      "creator": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@firm.com"
      },
      "content": { "type": "doc", "content": [...] },
      "plainText": "Draft content..."
    },
    {
      "id": "uuid",
      "version": 2,
      "changeDescription": "First update",
      "createdAt": "2025-11-10T12:00:00Z",
      "creator": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@firm.com"
      },
      "content": { "type": "doc", "content": [...] },
      "plainText": "Draft content..."
    },
    {
      "id": "uuid",
      "version": 1,
      "changeDescription": "Initial draft",
      "createdAt": "2025-11-10T11:00:00Z",
      "creator": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@firm.com"
      },
      "content": { "type": "doc", "content": [...] },
      "plainText": "Initial draft content..."
    }
  ],
  "count": 3
}
```

### 2. Get Specific Version

Retrieve a specific version by version number.

```bash
VERSION=2

curl -X GET http://localhost:3000/api/drafts/$DRAFT_ID/versions/$VERSION \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "snapshot": {
    "id": "uuid",
    "version": 2,
    "changeDescription": "First update",
    "createdAt": "2025-11-10T12:00:00Z",
    "creator": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@firm.com"
    },
    "content": { "type": "doc", "content": [...] },
    "plainText": "Draft content from version 2..."
  }
}
```

### 3. Restore Previous Version

Restore a previous version as a new snapshot (creates new version).

```bash
VERSION_TO_RESTORE=1

curl -X POST http://localhost:3000/api/drafts/$DRAFT_ID/restore/$VERSION_TO_RESTORE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Version restored successfully",
  "newVersion": 4,
  "restoredFrom": 1
}
```

## Error Responses

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authentication token",
    "timestamp": "2025-11-10T12:00:00Z"
  }
}
```

### 404 Not Found

Draft not found or belongs to different firm (firm isolation).

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Draft not found",
    "timestamp": "2025-11-10T12:00:00Z"
  }
}
```

### 400 Validation Error

Invalid version number.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid version number",
    "timestamp": "2025-11-10T12:00:00Z"
  }
}
```

## Testing Workflow

### 1. Complete Test Flow

```bash
# Set variables
TOKEN="your-jwt-token"
DRAFT_ID="your-draft-id"

# 1. List all versions
echo "Listing all versions..."
curl -s -X GET http://localhost:3000/api/drafts/$DRAFT_ID/versions \
  -H "Authorization: Bearer $TOKEN" | jq

# 2. Get specific version
echo -e "\n\nGetting version 1..."
curl -s -X GET http://localhost:3000/api/drafts/$DRAFT_ID/versions/1 \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Restore version 1
echo -e "\n\nRestoring version 1..."
curl -s -X POST http://localhost:3000/api/drafts/$DRAFT_ID/restore/1 \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. List versions again to see new version
echo -e "\n\nListing versions after restore..."
curl -s -X GET http://localhost:3000/api/drafts/$DRAFT_ID/versions \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Firm Isolation Test

Try to access draft from different firm (should return 404):

```bash
# Use token from user in different firm
TOKEN_FIRM2="other-firm-jwt-token"
DRAFT_ID_FIRM1="draft-from-firm-1"

# Should return 404
curl -s -X GET http://localhost:3000/api/drafts/$DRAFT_ID_FIRM1/versions \
  -H "Authorization: Bearer $TOKEN_FIRM2" | jq
```

### 3. Version Limit Test

If draft has more than 50 versions, API should only return last 50:

```bash
# List versions (max 50)
curl -s -X GET http://localhost:3000/api/drafts/$DRAFT_ID/versions \
  -H "Authorization: Bearer $TOKEN" | jq '.count'
```

## JavaScript/TypeScript Example

```typescript
const API_BASE = 'http://localhost:3000/api';

async function listVersions(draftId: string, token: string) {
  const response = await fetch(`${API_BASE}/drafts/${draftId}/versions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch versions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.versions;
}

async function getVersion(draftId: string, version: number, token: string) {
  const response = await fetch(`${API_BASE}/drafts/${draftId}/versions/${version}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch version: ${response.statusText}`);
  }

  const data = await response.json();
  return data.snapshot;
}

async function restoreVersion(draftId: string, version: number, token: string) {
  const response = await fetch(`${API_BASE}/drafts/${draftId}/restore/${version}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to restore version: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Usage
async function exampleUsage() {
  const token = localStorage.getItem('accessToken')!;
  const draftId = 'your-draft-id';

  // List all versions
  const versions = await listVersions(draftId, token);
  console.log('All versions:', versions);

  // Get version 1
  const version1 = await getVersion(draftId, 1, token);
  console.log('Version 1:', version1);

  // Restore version 1
  const result = await restoreVersion(draftId, 1, token);
  console.log('Restored:', result);
}
```

## Integration with UI Component

The `VersionHistorySidebar` component uses these endpoints:

```typescript
// In your editor page component
import { VersionHistorySidebar } from '@/components/drafts/version-history-sidebar';

export default function EditorPage({ draftId }: { draftId: string }) {
  return (
    <div className="flex">
      {/* Main editor area */}
      <div className="flex-1">
        {/* Editor component */}
      </div>

      {/* Version history sidebar */}
      <VersionHistorySidebar
        draftId={draftId}
        onVersionSelect={(version) => {
          console.log('Version selected:', version);
          // Load version for preview
        }}
        onVersionRestore={(version) => {
          console.log('Version restored:', version);
          // Reload editor
        }}
      />
    </div>
  );
}
```

## Notes

- All endpoints enforce firm-level isolation
- Version restoration creates a new snapshot (doesn't delete history)
- Versions are returned in descending order (newest first)
- Limited to last 50 versions for performance
- Each version includes creator information
- All timestamps in ISO 8601 format (UTC)
