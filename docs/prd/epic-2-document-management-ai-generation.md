# Epic 2: Document Management & AI Generation

**Expanded Goal:** Enable attorneys to upload case-related source documents (medical records, police reports, correspondence) and automatically generate draft demand letters using AI. This epic delivers the core value proposition—dramatically reducing the time required to create initial drafts by leveraging Claude's natural language understanding and generation capabilities. The system must handle various document formats, extract text accurately, and produce contextually appropriate legal documents based on the source materials and selected templates.

---

## Story 2.1: Build Document Upload UI with Drag-and-Drop

As an **attorney**,
I want to upload multiple source documents via drag-and-drop or file browser,
so that I can quickly provide case materials for demand letter generation.

### Acceptance Criteria

1. Document upload page accessible from dashboard "New Demand Letter" button
2. Drag-and-drop zone accepts PDF, DOCX, JPEG, PNG files (up to 50MB per file)
3. File browser button allows multi-file selection
4. Upload queue displays selected files with name, size, and type
5. Individual files can be removed from queue before upload
6. Upload progress bar shows percentage complete for each file
7. Error messages displayed for unsupported file types or oversized files
8. Successful uploads show checkmark and preview thumbnail
9. "Continue" button enabled after at least one successful upload
10. Mobile-responsive design adapts drag-drop zone for touch devices

**Prerequisites:** Story 1.11 (dashboard UI)

---

## Story 2.2: Implement Document Upload API and S3 Storage

As a **developer**,
I want a document upload API that stores files in S3,
so that documents are securely persisted with encryption.

### Acceptance Criteria

1. `POST /api/documents/upload` endpoint accepts multipart form data
2. Endpoint validates file type (PDF, DOCX, JPEG, PNG) and size (max 50MB)
3. Files uploaded to S3 bucket with KMS encryption enabled
4. S3 key structure: `{firmId}/{projectId}/{documentId}-{filename}`
5. Database record created in `source_documents` table with metadata (filename, type, S3 key, upload date, user)
6. Endpoint returns 201 Created with document ID and metadata
7. Endpoint returns 400 Bad Request for invalid files with descriptive error
8. Presigned URL generated for secure download access
9. Unit tests verify file validation logic
10. Integration test uploads file to S3 and verifies database record

**Prerequisites:** Story 1.5 (AWS S3 setup), Story 1.10 (firm isolation)

---

## Story 2.3: Implement PDF Text Extraction

As a **developer**,
I want automated text extraction from uploaded PDFs,
so that content is available for AI processing without manual transcription.

### Acceptance Criteria

1. Background job extracts text from PDF files after upload using `pdf-parse` library
2. Extracted text stored in `extracted_text` column of `source_documents` table
3. Text extraction handles multi-page PDFs correctly (preserves page order)
4. Job completion updates document status to `processed` or `extraction_failed`
5. Extraction errors logged with document ID for debugging
6. Maximum extraction time: 2 minutes per document (timeout protection)
7. Extracted text preview (first 500 characters) displayed in UI
8. Unit tests verify text extraction from sample PDFs
9. Integration test uploads PDF and verifies extracted text in database

**Prerequisites:** Story 2.2 (document upload API)

---

## Story 2.4: Implement Word Document and Image OCR Processing

As an **attorney**,
I want text extracted from Word documents and scanned images,
so that all my source materials are usable regardless of format.

### Acceptance Criteria

1. Word document (.docx) text extraction implemented using `mammoth` library
2. Image (JPEG, PNG) text extraction implemented using Tesseract.js OCR
3. Extraction jobs handle both formats with appropriate libraries
4. OCR confidence scores logged (warn if below 80% accuracy)
5. Extracted text from all formats normalized (consistent encoding, whitespace)
6. Documents with extraction failures marked with status and error message
7. UI displays warning icon for low-confidence OCR results
8. Users can manually edit extracted text if needed (future story, noted in backlog)
9. Unit tests verify Word and image extraction with sample files
10. Integration test verifies mixed document types processed correctly

**Prerequisites:** Story 2.3 (PDF extraction)

---

## Story 2.5: Build Document Viewer for Uploaded Files

As an **attorney**,
I want to view uploaded source documents in the browser,
so that I can reference them while reviewing generated drafts.

### Acceptance Criteria

1. Document viewer component displays PDFs using `react-pdf` or PDF.js
2. Document viewer displays images directly using `<img>` tags
3. Word documents display as plain text preview (or converted to PDF for rendering)
4. Viewer includes navigation controls: page up/down, zoom in/out, full screen
5. Viewer displays document metadata: filename, upload date, page count
6. Multiple documents accessible via tabbed interface
7. Document list shows thumbnails and allows quick switching
8. Viewer loads documents via presigned S3 URLs (no direct S3 access from frontend)
9. Loading spinner displayed while document fetches
10. Mobile-responsive design scales viewer for tablet/phone screens

**Prerequisites:** Story 2.2 (upload API), Story 2.3 (text extraction)

---

## Story 2.6: Integrate Anthropic Claude API for AI Generation

As a **developer**,
I want Anthropic Claude API integrated with streaming support,
so that we can generate demand letters with real-time progress feedback.

### Acceptance Criteria

1. Anthropic SDK installed and configured with API key from environment variables
2. API client wrapper created with error handling and retry logic
3. Streaming response handler implemented to send chunks via Server-Sent Events (SSE)
4. `POST /api/ai/generate` endpoint accepts `{ projectId, templateId, variables }`
5. Endpoint retrieves source document text and template structure from database
6. Prompt constructed combining template instructions, source text, and variables
7. Claude API called with streaming enabled (model: Claude 3.5 Sonnet)
8. Response streamed to client in real-time (200-500ms chunks)
9. Token usage tracked and stored for billing/analytics
10. Error handling for API failures (rate limits, network errors) with user-friendly messages
11. Unit tests verify prompt construction logic
12. Integration test mocks Claude API and verifies streaming behavior

**Prerequisites:** Story 1.5 (AWS setup - may use Bedrock alternative), Story 2.3 (text extraction)

---

## Story 2.7: Engineer Prompts for Demand Letter Generation

As a **product manager**,
I want well-engineered prompts for demand letter generation,
so that AI output is accurate, professional, and legally appropriate.

### Acceptance Criteria

1. Base prompt template created for demand letter generation with clear instructions
2. Prompt includes sections: system role, context (case facts), source documents, template structure, output format
3. Prompt instructs Claude to generate formal legal language appropriate for demand letters
4. Prompt emphasizes factual accuracy and directs Claude to cite source documents
5. Prompt includes examples of acceptable output format (section structure, tone)
6. Template-specific prompt variations created for different letter types (personal injury, contract dispute, etc.)
7. Prompts tested with 5-10 sample cases and outputs reviewed for quality
8. Prompt engineering documentation created explaining design rationale
9. Token usage optimized (prompts under 4,000 tokens for typical cases)
10. Prompt versions tracked in codebase with comments explaining changes

**Prerequisites:** Story 2.6 (Claude API integration)

---

## Story 2.8: Build AI Generation Workflow UI

As an **attorney**,
I want a guided workflow for generating demand letters,
so that I can easily provide necessary information and trigger AI generation.

### Acceptance Criteria

1. After document upload, user proceeds to template selection screen
2. Template selection displays gallery of available firm templates with previews
3. After template selection, dynamic form displays based on template variables
4. Form includes fields like: plaintiff name, defendant name, incident date, demand amount, jurisdiction
5. Form validation ensures required fields completed before generation
6. "Generate Draft" button triggers AI generation and navigates to streaming view
7. Streaming view displays real-time generated text with typewriter effect
8. Section headers animate in as generation progresses (e.g., "Header complete... generating Facts...")
9. User can pause or stop generation if content is off-track
10. Upon completion, user redirected to draft editor view
11. Generation errors display with options to retry or contact support
12. Loading states and progress indicators throughout workflow

**Prerequisites:** Story 2.6 (Claude API), Story 2.7 (prompt engineering)

---

## Story 2.9: Implement Draft Storage and Version History

As an **attorney**,
I want generated drafts automatically saved with version history,
so that I can track changes and restore previous versions if needed.

### Acceptance Criteria

1. Generated draft content stored in `drafts` table with `project_id` foreign key
2. Each generation creates new snapshot in `draft_snapshots` table
3. Snapshots include: version number, content (JSON or text), timestamp, created_by user
4. `GET /api/drafts/:id/versions` endpoint returns list of all snapshots
5. `GET /api/drafts/:id/versions/:version` endpoint returns specific version content
6. `POST /api/drafts/:id/restore/:version` endpoint restores previous version as new snapshot
7. UI displays version history in sidebar with timestamps and author names
8. Clicking version loads readonly preview
9. "Restore this version" button creates new current version from historical snapshot
10. Version history limited to last 50 versions per draft (configurable)
11. Unit tests verify snapshot creation logic
12. Integration test verifies version restoration workflow

**Prerequisites:** Story 2.8 (generation workflow), Story 1.4 (database schema)

---

## Story 2.10: Build Projects Dashboard with Draft List

As an **attorney**,
I want a projects dashboard showing all my demand letters,
so that I can easily find and resume work on existing drafts.

### Acceptance Criteria

1. Projects page at `/projects` displays table/grid of all projects for user's firm
2. Each project card shows: case title, client name, status, last modified date, assigned attorney
3. Status badges: Draft, In Review, Completed, Sent
4. Filters available: status, date range, assigned user
5. Search box filters projects by case title or client name
6. Clicking project navigates to draft editor view
7. "New Demand Letter" button prominent at top-right
8. Empty state displayed when no projects exist with helpful CTA
9. Pagination implemented for >20 projects (or infinite scroll)
10. Mobile-responsive card layout for small screens

**Prerequisites:** Story 2.9 (draft storage), Story 1.11 (dashboard shell)
