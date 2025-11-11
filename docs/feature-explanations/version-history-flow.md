# Draft Version History Flow

## Overview

This document describes how the draft version history system works in the Steno Demand Letter Generator.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Version History Sidebar Component                        │  │
│  │  - List all versions                                      │  │
│  │  - View version details                                   │  │
│  │  - Restore previous version                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              │ HTTP/HTTPS                         │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes (Next.js)                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/drafts/:id/versions                           │   │
│  │  - List all versions (max 50)                           │   │
│  │  - Enforce firm isolation                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/drafts/:id/versions/:version                  │   │
│  │  - Get specific version content                         │   │
│  │  - Enforce firm isolation                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/drafts/:id/restore/:version                  │   │
│  │  - Restore previous version as new snapshot             │   │
│  │  - Enforce firm isolation                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Draft Service Layer                         │
│                                                                   │
│  - createDraft()           Create draft with initial snapshot    │
│  - createSnapshot()        Create new version                    │
│  - getDraftVersions()      List all versions (max 50)           │
│  - getDraftVersion()       Get specific version                  │
│  - restoreDraftVersion()   Restore previous version             │
│  - getDraftWithProject()   Get draft with firm validation       │
│                                                                   │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│                                                                   │
│  ┌───────────────────────┐      ┌────────────────────────────┐ │
│  │  drafts               │      │  draft_snapshots           │ │
│  │  ───────────────────  │      │  ────────────────────────  │ │
│  │  id (PK)              │◄─────│  id (PK)                   │ │
│  │  project_id (FK)      │      │  draft_id (FK)             │ │
│  │  content              │      │  version                   │ │
│  │  plain_text           │      │  content                   │ │
│  │  current_version      │      │  plain_text                │ │
│  │  created_at           │      │  created_by (FK)           │ │
│  │  updated_at           │      │  change_description        │ │
│  └───────────────────────┘      │  created_at                │ │
│                                  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Version History Flow

### 1. Initial Draft Creation

```
User creates draft
       │
       ▼
createDraft({
  projectId,
  content,
  plainText,
  createdBy
})
       │
       ├─► Insert into drafts table
       │   - current_version = 1
       │
       └─► Insert into draft_snapshots table
           - version = 1
           - change_description = "Initial draft"
```

### 2. Creating New Versions

```
User edits draft
       │
       ▼
createSnapshot({
  draftId,
  content,
  plainText,
  createdBy,
  changeDescription
})
       │
       ├─► Get current version from drafts
       │   - current_version = N
       │
       ├─► Insert new snapshot
       │   - version = N + 1
       │   - content = new content
       │
       └─► Update drafts table
           - current_version = N + 1
           - content = new content
```

### 3. Viewing Version History

```
User clicks version history
       │
       ▼
GET /api/drafts/:id/versions
       │
       ├─► Verify firm isolation
       │   - Get draft with project
       │   - Check project.firmId === user.firmId
       │
       └─► Get all snapshots
           - ORDER BY version DESC
           - LIMIT 50
           - Include creator info
```

### 4. Restoring Previous Version

```
User clicks restore on version N
       │
       ▼
POST /api/drafts/:id/restore/N
       │
       ├─► Verify firm isolation
       │
       ├─► Get version N content
       │   - SELECT * FROM draft_snapshots
       │     WHERE draft_id = :id AND version = N
       │
       ├─► Create new snapshot with old content
       │   - version = current_version + 1
       │   - content = version N content
       │   - change_description = "Restored from version N"
       │
       └─► Update drafts table
           - current_version = new version
           - content = version N content
```

## Version Timeline Example

```
Time ─────────────────────────────────────────────────────────────►

v1: Initial draft           v2: First update       v3: Second update     v5: Restored v1
    "Dear [Client]"             "Dear John"            "Dear John Smith"     "Dear [Client]"
    │                           │                      │                     │
    │                           │                      │                     │
    ├───────────────────────────┼──────────────────────┼─────────────────────┤
    │                           │                      │                     │
    11:00 AM                    12:00 PM               1:00 PM     2:00 PM   3:00 PM
                                                                   │
                                                                   v4: Restore action
                                                                   (User restored v1)
```

## Database State After Operations

### After Initial Creation
```sql
-- drafts table
id: draft-1, current_version: 1, content: {...}, plain_text: "Initial draft"

-- draft_snapshots table
draft_id: draft-1, version: 1, content: {...}, change_description: "Initial draft"
```

### After Two Updates
```sql
-- drafts table
id: draft-1, current_version: 3, content: {...v3}, plain_text: "Third version"

-- draft_snapshots table
draft_id: draft-1, version: 1, content: {...v1}, change_description: "Initial draft"
draft_id: draft-1, version: 2, content: {...v2}, change_description: "First update"
draft_id: draft-1, version: 3, content: {...v3}, change_description: "Second update"
```

### After Restoring Version 1
```sql
-- drafts table
id: draft-1, current_version: 4, content: {...v1}, plain_text: "Initial draft"

-- draft_snapshots table
draft_id: draft-1, version: 1, content: {...v1}, change_description: "Initial draft"
draft_id: draft-1, version: 2, content: {...v2}, change_description: "First update"
draft_id: draft-1, version: 3, content: {...v3}, change_description: "Second update"
draft_id: draft-1, version: 4, content: {...v1}, change_description: "Restored from version 1"
```

## Firm Isolation

Every API endpoint enforces firm-level isolation:

```
Request → Auth Middleware → Get user.firmId from JWT
            │
            ▼
       Get draft → Join with project → Check project.firmId
            │
            ├─► If firmId matches → Allow access
            └─► If firmId differs → Return 404 (not 403)
```

## Version Limit (50 Versions)

To maintain performance, only the last 50 versions are returned:

```sql
SELECT * FROM draft_snapshots
WHERE draft_id = :draft_id
ORDER BY version DESC
LIMIT 50
```

Older versions are still stored in the database but not displayed in the UI. This can be configured by changing the limit in the service layer.

## UI Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Version History Sidebar                                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Version 3 (Current)                           [✓]  │    │
│  │  Second update                                      │    │
│  │  John Doe • 2 hours ago                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Version 2                                     [↩]  │◄───┤ Click to restore
│  │  First update                                       │    │
│  │  John Doe • 3 hours ago                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Version 1                                     [↩]  │    │
│  │  Initial draft                                      │    │
│  │  John Doe • 4 hours ago                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

All endpoints return standardized error responses:

```javascript
{
  "error": {
    "code": "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "timestamp": "2025-11-10T12:00:00Z"
  }
}
```

## Security Considerations

1. **Firm Isolation**: Every query filtered by firmId
2. **Authentication**: JWT token required for all endpoints
3. **Authorization**: Only users in same firm can access drafts
4. **Information Disclosure**: Return 404 (not 403) for cross-firm access
5. **Input Validation**: Version numbers validated before use
6. **SQL Injection**: Protected by Drizzle ORM parameterized queries

## Performance Considerations

1. **Version Limit**: Only 50 most recent versions returned
2. **Database Indexes**: Indexes on draft_id and version columns
3. **Eager Loading**: Creator information loaded with versions
4. **Caching**: React Query can cache version lists on client side

## Future Enhancements

1. **Diff Viewer**: Show differences between versions
2. **Version Comments**: Allow users to add notes to versions
3. **Auto-save**: Automatically create snapshots periodically
4. **Version Comparison**: Compare two versions side-by-side
5. **Version Branching**: Allow branching from any version
6. **Configurable Limit**: Admin-configurable version history limit
