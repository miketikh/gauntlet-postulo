# Document Upload API Documentation

## Overview

The Document Upload API enables secure file uploads to AWS S3 with automatic database record creation, firm isolation, and presigned URL generation for downloads.

## Endpoints

### POST /api/documents/upload

Upload a document file to S3 and create a database record.

**Authentication:** Required (JWT Bearer token)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers:
  - `Authorization: Bearer <jwt_token>`

**Form Data:**
- `file` (File, required): The document file to upload
- `projectId` (string, required): UUID of the project to associate the document with

**Accepted File Types:**
- PDF (`.pdf`)
- DOCX (`.docx`)
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)

**File Size Limit:** 50MB

**Response (201 Created):**
```json
{
  "document": {
    "id": "uuid",
    "fileName": "contract.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "extractionStatus": "pending",
    "uploadedBy": "user-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "presignedUrl": "https://s3.amazonaws.com/bucket/key?signature=..."
  }
}
```

**Error Responses:**

400 Bad Request - Invalid file type:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file type: application/zip. Accepted types: PDF, DOCX, JPEG, PNG",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

400 Bad Request - File too large:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds maximum limit of 50MB. File size: 60.5MB",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

401 Unauthorized:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authentication token",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

404 Not Found - Project not found or access denied:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found or access denied",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/contract.pdf" \
  -F "projectId=550e8400-e29b-41d4-a716-446655440000"
```

---

### GET /api/documents/[id]

Retrieve document metadata and generate a presigned download URL.

**Authentication:** Required (JWT Bearer token)

**Request:**
- Method: `GET`
- Path Parameter: `id` - Document UUID
- Headers:
  - `Authorization: Bearer <jwt_token>`

**Response (200 OK):**
```json
{
  "document": {
    "id": "uuid",
    "fileName": "contract.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "s3Key": "firm-id/project-id/doc-id-contract.pdf",
    "extractionStatus": "completed",
    "extractedText": "Document text content...",
    "uploadedBy": "user-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "presignedUrl": "https://s3.amazonaws.com/bucket/key?signature=...",
    "project": {
      "id": "project-uuid",
      "title": "Client Case 2024",
      "clientName": "John Doe",
      "status": "draft"
    },
    "uploader": {
      "id": "user-uuid",
      "email": "attorney@lawfirm.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "attorney"
    }
  }
}
```

**Error Responses:**

404 Not Found:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Document not found",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/api/documents/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## S3 Storage Structure

### Key Format
Documents are stored in S3 with the following key structure:
```
{firmId}/{projectId}/{documentId}-{filename}
```

**Example:**
```
550e8400-e29b-41d4-a716-446655440000/
  ├── 7c9e6679-7425-40de-944b-e07fc1f90ae7/
  │   ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890-contract.pdf
  │   ├── b2c3d4e5-f6a7-8901-bcde-f12345678901-evidence.jpg
  │   └── c3d4e5f6-a7b8-9012-cdef-123456789012-statement.docx
```

### Encryption
All files are encrypted at rest using AWS S3 server-side encryption (AES-256).

### Metadata
Each uploaded file includes the following S3 metadata:
- `originalName`: Original filename
- `uploadedAt`: ISO 8601 timestamp

---

## Firm Isolation

### Security Model
Documents are strictly isolated by firm:
1. S3 keys are prefixed with `firmId`
2. Document queries filter by project's `firmId`
3. Cross-firm access returns 404 (not 403) to prevent information disclosure

### Access Control Flow
```
User Request
    ↓
JWT Token → Extract firmId
    ↓
Query Project → Verify project.firmId == user.firmId
    ↓
Upload to S3 → Key: {user.firmId}/{projectId}/{docId}-{filename}
    ↓
Create DB Record → Link to project (which has firmId)
```

---

## Database Schema

### source_documents Table
```sql
CREATE TABLE source_documents (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  extracted_text TEXT,
  extraction_status extraction_status NOT NULL DEFAULT 'pending',
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

## Testing

### Unit Tests
```bash
pnpm test:run lib/services/__tests__/storage.service.test.ts
```

Tests cover:
- File upload to S3
- Presigned URL generation
- Error handling
- Different file types

### Integration Tests
```bash
pnpm test:run app/api/documents/__tests__/upload.test.ts
```

Tests cover:
- File validation (type, size, extension)
- S3 key structure
- Database record creation
- Firm isolation
- Document retrieval with relationships

### Manual Testing
```bash
tsx scripts/test-document-upload.ts
```

This script:
1. Verifies S3 connection
2. Creates test firm, user, and project
3. Uploads a test document
4. Generates presigned URLs
5. Provides curl commands for API testing

---

## Environment Variables

Required environment variables in `.env`:
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=steno-documents-dev
AWS_REGION=us-east-2

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

---

## Error Handling

All endpoints follow the standard error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* Optional additional details */ },
    "timestamp": "ISO 8601 timestamp",
    "requestId": "Optional request ID"
  }
}
```

### Error Codes
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found or no access
- `VALIDATION_ERROR` (400): Invalid input data
- `CONFLICT` (409): Resource conflict
- `INTERNAL_ERROR` (500): Server error

---

## Security Considerations

### File Validation
1. **MIME Type Check**: Validates `Content-Type` header
2. **Extension Check**: Verifies file extension matches allowed list
3. **Size Limit**: Enforces 50MB maximum file size
4. **Empty File Check**: Rejects zero-byte files

### Firm Isolation
1. **Path-based Isolation**: S3 keys include firmId
2. **Query-level Filtering**: All queries filter by firmId
3. **404 on Cross-Firm Access**: Returns 404 (not 403) to prevent information disclosure

### Presigned URLs
1. **Time-limited**: URLs expire after 1 hour (configurable)
2. **Read-only**: URLs only allow GET operations
3. **Per-request**: New URL generated for each request

---

## Best Practices

### Client Implementation
1. **File Validation**: Validate file type and size before upload
2. **Progress Tracking**: Use multipart upload with progress callbacks
3. **Error Handling**: Handle all error codes appropriately
4. **Token Refresh**: Refresh JWT before expiration

### Server Considerations
1. **Rate Limiting**: Consider implementing upload rate limits
2. **Virus Scanning**: Add virus scanning for uploaded files
3. **Monitoring**: Track S3 upload failures and latency
4. **Backup**: Enable S3 versioning for document recovery

---

## Future Enhancements

Potential improvements:
1. **Chunked Upload**: Support for large files (>50MB)
2. **Direct Client Upload**: Presigned POST URLs for direct client-to-S3 upload
3. **Thumbnail Generation**: Automatic thumbnail creation for images
4. **Text Extraction**: OCR for scanned documents
5. **Virus Scanning**: Integration with ClamAV or similar
6. **Compression**: Automatic compression for large files
7. **CDN Integration**: CloudFront for faster downloads

---

## Troubleshooting

### Upload Fails with 500 Error
- Check AWS credentials in `.env`
- Verify S3 bucket exists and is accessible
- Check S3 bucket permissions
- Review server logs for detailed error

### Presigned URL Returns 403
- URL may have expired (1 hour default)
- S3 bucket policy may need adjustment
- Request a new presigned URL

### Cross-Firm Access Blocked
- This is expected behavior
- Verify user's JWT contains correct firmId
- Ensure project belongs to user's firm

### File Type Rejected
- Check file MIME type matches accepted types
- Verify file extension is in allowed list
- Ensure file is not corrupted

---

## Support

For issues or questions:
1. Check server logs: `pnpm dev`
2. Review test output: `pnpm test:run`
3. Verify environment variables
4. Check AWS S3 console for bucket status
