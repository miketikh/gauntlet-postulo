# Demand Letter Generator - Initial Product Plan

**Organization:** Steno  
**Version:** 1.0  
**Last Updated:** November 10, 2025

---

## Executive Summary

This document outlines the initial product plan for Steno's Demand Letter Generator, focusing on core features required to deliver a production-ready MVP. The system will leverage AI to automate demand letter creation while providing collaborative editing, template management, and secure document handling that meets legal industry standards.

---

## Core Requirements Coverage

### P0 Requirements (Must-Have) ✓

1. **Document Upload & AI Generation**
   - Support multiple document formats (PDF, Word, images)
   - AI-powered draft generation using uploaded source materials
   - Structured output based on firm templates

2. **Template Management System**
   - Firm-level template creation and management
   - Template structure definition (sections, variables, formatting)
   - Template selection and application during letter generation

3. **AI Refinement Capability**
   - Interactive prompts for content refinement
   - Iterative improvement based on attorney feedback
   - Context-aware suggestions

4. **Export Functionality**
   - Export to Microsoft Word format (.docx)
   - Preserve formatting and structure
   - Include all content and metadata

### P1 Requirements (Should-Have) ✓

1. **Real-Time Collaborative Editing**
   - Google Docs-style simultaneous editing
   - Live presence indicators (who's viewing/editing)
   - Character-level change tracking
   - Conflict-free merge resolution
   - In-line comment threads

2. **Customizable AI Prompts**
   - Pre-defined refinement options (tone, length, emphasis)
   - Custom prompt input for specific modifications
   - Context preservation across refinements

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Web App)     │
└────────┬────────┘
         │
    HTTPS/WSS
         │
┌────────┴────────┐
│   API Gateway   │
│  (Load Balancer)│
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┬─────────────┐
    │          │          │          │             │
┌───┴───┐  ┌──┴───┐  ┌──┴───┐  ┌──┴──────┐  ┌──┴────────┐
│ Auth  │  │ Doc  │  │ AI   │  │Template │  │WebSocket  │
│Service│  │Service│ │Service│ │ Service │  │  Server   │
└───┬───┘  └──┬───┘  └──┬───┘  └──┬──────┘  └──┬────────┘
    │         │         │          │            │
    └─────────┴─────────┴──────────┴────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────┴──────┐            ┌──────┴──────┐
    │PostgreSQL │            │   AWS S3    │
    │ Database  │            │  (Encrypted)│
    └───────────┘            └─────────────┘
```

### Technology Stack Recommendations

#### Frontend
- **Framework:** React 18+
- **State Management:** Zustand or Redux Toolkit
- **Rich Text Editor:** Lexical (Meta) or TipTap (Prosemirror)
- **Collaborative Editing:** Yjs (CRDT library)
- **Real-time Sync:** y-websocket
- **PDF Viewer:** react-pdf or PDF.js
- **UI Components:** Radix UI + Tailwind CSS
- **HTTP Client:** Axios or React Query

#### Backend
- **API Framework:** Node.js + Express or Fastify
- **Language:** TypeScript
- **WebSocket Server:** ws library with Yjs integration
- **Document Processing:**
  - pdf-parse (PDF text extraction)
  - mammoth (Word document parsing)
  - sharp (image processing/optimization)
  - tesseract.js (OCR if needed)
- **AI Integration:** Anthropic API SDK
- **Authentication:** JWT tokens, bcrypt for passwords
- **File Storage:** AWS SDK for S3 operations

#### Database
- **Primary Database:** PostgreSQL 14+
- **ORM:** Prisma or TypeORM
- **Caching:** Redis (for session management and performance)

#### Infrastructure
- **Cloud Provider:** AWS
- **Compute:** AWS Lambda (serverless) or ECS (containerized)
- **Storage:** S3 with KMS encryption
- **CDN:** CloudFront
- **Load Balancer:** Application Load Balancer
- **Monitoring:** CloudWatch, DataDog, or Sentry

#### AI/ML
- **Primary AI:** Anthropic Claude API (Claude Sonnet 4.5)
- **Alternative:** AWS Bedrock (for multi-model support)
- **Prompt Management:** LangChain (optional, for complex workflows)

---

## Key Components

### 1. Document Processing Pipeline

**Purpose:** Extract and structure content from uploaded documents

**Workflow:**
1. User uploads documents via drag-and-drop interface
2. Files stored in encrypted S3 bucket
3. Background job extracts text content
4. Extracted text stored in database with document metadata
5. Text indexed for searchability and AI processing

**Key Features:**
- Support for PDF, DOCX, JPEG, PNG formats
- Automatic text extraction and OCR
- File validation and virus scanning
- Progress indicators for large file processing
- Document preview capabilities

### 2. AI Generation Engine

**Purpose:** Generate draft demand letters using source documents and templates

**Workflow:**
1. Gather source document text
2. Load selected template structure
3. Build context-rich prompt for Claude API
4. Stream generation response to frontend
5. Parse AI response into structured document
6. Save draft with version tracking

**Key Features:**
- Template-driven generation
- Streaming output for responsive UX
- Error handling and retry logic
- Prompt optimization for legal writing
- Context window management for large cases

### 3. Collaborative Editor

**Purpose:** Enable real-time multi-user editing with change tracking

**Workflow:**
1. Document loaded into Yjs shared type
2. WebSocket connection established
3. Local changes broadcast to all connected clients
4. Automatic conflict resolution via CRDT
5. Changes attributed to users with timestamps
6. Periodic snapshots saved to database

**Key Features:**
- Character-level real-time sync
- Presence awareness (cursors, selections)
- Comment threads on text selections
- Change history with author attribution
- Offline editing with sync on reconnect
- Rich text formatting (bold, italic, lists, etc.)

### 4. Template Management System

**Purpose:** Create, store, and manage firm-specific letter templates

**Template Structure:**
```json
{
  "id": "template-uuid",
  "name": "Personal Injury Demand Letter",
  "firm_id": "firm-uuid",
  "sections": [
    {
      "id": "header",
      "title": "Header",
      "type": "static",
      "content": "{{firm_name}}\n{{firm_address}}",
      "required": true
    },
    {
      "id": "opening",
      "title": "Opening Statement",
      "type": "ai_generated",
      "prompt_guidance": "Professional introduction...",
      "required": true
    },
    {
      "id": "facts",
      "title": "Statement of Facts",
      "type": "ai_generated",
      "prompt_guidance": "Chronological facts...",
      "required": true
    },
    {
      "id": "damages",
      "title": "Damages",
      "type": "ai_generated",
      "prompt_guidance": "Itemized damages...",
      "required": true
    },
    {
      "id": "demand",
      "title": "Demand Amount",
      "type": "variable",
      "variables": ["demand_amount"],
      "required": true
    },
    {
      "id": "closing",
      "title": "Closing",
      "type": "static",
      "content": "Sincerely,\n{{attorney_name}}",
      "required": true
    }
  ],
  "variables": [
    {"name": "plaintiff_name", "type": "text", "required": true},
    {"name": "defendant_name", "type": "text", "required": true},
    {"name": "incident_date", "type": "date", "required": true},
    {"name": "demand_amount", "type": "currency", "required": true}
  ],
  "tone_preset": "professional",
  "jurisdiction": "California"
}
```

**Key Features:**
- Visual template builder interface
- Section reordering and customization
- Variable definition and validation
- Template versioning
- Template preview with sample data
- Firm-level access control

### 5. AI Refinement System

**Purpose:** Allow attorneys to iteratively improve generated content

**Interaction Patterns:**
- **Quick Actions:** Pre-defined refinement buttons
  - "Make more assertive"
  - "Add more detail"
  - "Shorten this section"
  - "Emphasize liability"
  - "Soften tone"
  
- **Custom Prompts:** Free-form text input
  - "Focus more on emotional distress damages"
  - "Add precedent references for this jurisdiction"
  - "Rewrite opening paragraph in a more formal tone"

**Key Features:**
- Section-specific refinements
- Full document refinements
- Refinement history tracking
- Undo/redo functionality
- Context preservation across iterations

### 6. Export System

**Purpose:** Generate Word documents from edited drafts

**Output Format:**
- Microsoft Word (.docx) format
- Preserved formatting (fonts, spacing, styling)
- Firm letterhead (if configured)
- Page numbers and headers/footers
- Proper legal document structure

**Key Features:**
- One-click export
- Template-based styling
- Automatic filename generation
- Version tagging in metadata
- Email attachment generation

---

## Database Schema (Core Tables)

### Users & Authentication
```sql
users
  - id (uuid, primary key)
  - email (unique)
  - password_hash
  - first_name
  - last_name
  - firm_id (foreign key)
  - role (enum: admin, attorney, paralegal)
  - created_at
  - last_login_at

firms
  - id (uuid, primary key)
  - name
  - settings (jsonb)
  - subscription_tier
  - created_at
```

### Projects & Documents
```sql
projects
  - id (uuid, primary key)
  - user_id (foreign key)
  - firm_id (foreign key)
  - template_id (foreign key)
  - title
  - case_number
  - status (enum: draft, in_review, completed, sent)
  - metadata (jsonb)
  - created_at
  - updated_at

source_documents
  - id (uuid, primary key)
  - project_id (foreign key)
  - filename
  - file_type
  - s3_key
  - extracted_text (text)
  - upload_date
  - uploaded_by (foreign key to users)
```

### Templates
```sql
templates
  - id (uuid, primary key)
  - firm_id (foreign key)
  - name
  - description
  - structure (jsonb)
  - is_active
  - created_by (foreign key to users)
  - created_at
  - updated_at

template_versions
  - id (uuid, primary key)
  - template_id (foreign key)
  - version_number
  - structure (jsonb)
  - created_at
```

### Drafts & Collaboration
```sql
drafts
  - id (uuid, primary key)
  - project_id (foreign key)
  - yjs_document (bytea) -- Yjs encoded state
  - current_version
  - created_at
  - updated_at

draft_snapshots
  - id (uuid, primary key)
  - draft_id (foreign key)
  - version_number
  - content (text or jsonb)
  - snapshot_type (auto, manual, export)
  - created_by (foreign key to users)
  - created_at

comments
  - id (uuid, primary key)
  - draft_id (foreign key)
  - user_id (foreign key)
  - position (jsonb) -- text position/selection
  - content (text)
  - resolved (boolean)
  - created_at

draft_collaborators
  - draft_id (foreign key)
  - user_id (foreign key)
  - permission (enum: view, comment, edit)
  - last_seen_at
```

### AI Operations
```sql
ai_generations
  - id (uuid, primary key)
  - project_id (foreign key)
  - prompt (text)
  - response (text)
  - model_used
  - tokens_used
  - generation_time_ms
  - created_at

ai_refinements
  - id (uuid, primary key)
  - draft_id (foreign key)
  - refinement_type (enum: quick_action, custom_prompt)
  - instruction (text)
  - section_id (optional)
  - result (text)
  - applied (boolean)
  - created_at
```

---

## Security & Compliance

### Encryption Strategy

**Data at Rest:**
- AWS S3 Server-Side Encryption with KMS (SSE-KMS)
- Database encryption enabled (transparent data encryption)
- Encrypted backups

**Data in Transit:**
- TLS 1.3 for all HTTP/WebSocket connections
- Certificate pinning for mobile apps (future)

**Access Control:**
- Row-level security in PostgreSQL
- Firm-level data isolation
- Role-based access control (RBAC)
- Document-level permissions

### Compliance Considerations

**Legal Industry Standards:**
- ABA Model Rules compliance (attorney-client privilege)
- State bar ethics rules adherence
- Audit logging for all document access

**Data Privacy:**
- SOC 2 Type II certification (target)
- GDPR compliance (for EU clients)
- CCPA compliance (California)
- Data retention policies

**Authentication & Authorization:**
- Multi-factor authentication (MFA) support
- Password complexity requirements
- Session timeout policies
- IP whitelisting for firms (optional)

---

## User Experience Overview

### Primary User Flows

#### 1. Create New Demand Letter
```
Dashboard → "New Demand Letter" →
  → Upload Documents (drag/drop) →
  → Select Template →
  → Fill Key Details Form →
  → Generate Draft (AI processing) →
  → Review & Edit →
  → Export to Word
```

#### 2. Collaborate on Draft
```
Dashboard → Select Project →
  → Open Editor →
  → Real-time editing with team →
  → Add comments →
  → Review changes →
  → Approve/Export
```

#### 3. Manage Templates
```
Settings → Templates →
  → Create New Template →
  → Define Sections →
  → Set Variables →
  → Save & Test →
  → Share with Firm
```

### Key UI Components

**Dashboard:**
- Project list with filters (status, date, attorney)
- Quick stats (drafts in progress, completed this month)
- Recent activity feed
- "New Demand Letter" prominent CTA

**Document Upload Interface:**
- Large drag-and-drop zone
- File type icons and validation
- Upload progress bars
- Document preview thumbnails
- Bulk upload support

**Editor Interface:**
- Split-screen layout:
  - Left: Source document viewer (tabbed)
  - Right: Draft editor with formatting toolbar
- Floating AI refinement panel
- Comment sidebar (collapsible)
- Version history drawer
- Export button (always visible)

**Template Builder:**
- Visual section blocks (drag to reorder)
- Section type selector (static, AI-generated, variable)
- Variable definition panel
- Live preview pane
- Template metadata form

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader support (ARIA labels)
- High contrast mode
- Adjustable font sizes
- Focus indicators

---

## Performance Requirements

### Response Time Targets
- Page load: < 2 seconds
- API requests: < 500ms (excluding AI generation)
- AI draft generation: < 30 seconds for typical case
- Real-time sync latency: < 100ms
- Document upload: Progress indicators for files > 5MB

### Scalability Targets
- Concurrent users: 1,000+ simultaneous editors
- Document storage: Unlimited (S3 scaling)
- Database queries: < 100ms for 95th percentile
- WebSocket connections: 10,000+ concurrent

### Availability
- Uptime: 99.9% (excluding planned maintenance)
- Backup frequency: Hourly incremental, daily full
- Disaster recovery: < 4 hour RTO, < 1 hour RPO

---

## Development Milestones

### Phase 1: Core Infrastructure (Foundation)
- User authentication and authorization
- Database setup and migrations
- S3 bucket configuration with encryption
- Basic API gateway and routing

### Phase 2: Document Processing
- File upload and storage
- Text extraction from PDFs/Word
- Document viewer implementation
- File validation and security scanning

### Phase 3: AI Integration
- Anthropic API integration
- Prompt engineering for demand letters
- Template system backend
- Basic draft generation workflow

### Phase 4: Editor & Collaboration
- Rich text editor implementation
- Yjs/CRDT integration
- WebSocket server setup
- Real-time sync functionality
- Comment system

### Phase 5: Refinement & Export
- AI refinement interface
- Quick action buttons
- Custom prompt handling
- Word document export
- Template application

### Phase 6: Polish & Launch
- UI/UX refinements
- Performance optimization
- Security audit
- Beta testing with pilot firms
- Production deployment

---

## Integration Points

### External Services

**Required:**
- Anthropic API (or AWS Bedrock)
- AWS S3 (file storage)
- Email service (SendGrid, AWS SES) for notifications
- Payment processor (Stripe) for subscriptions

**Optional (Future):**
- Document management systems (NetDocuments, iManage)
- Practice management software (Clio, MyCase)
- Calendar systems (Google Calendar, Outlook)
- E-signature providers (DocuSign, Adobe Sign)

### API Design

**REST API Endpoints:**
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
POST   /api/projects/:id/documents
POST   /api/projects/:id/generate
POST   /api/projects/:id/refine
GET    /api/templates
POST   /api/templates
PUT    /api/templates/:id
POST   /api/drafts/:id/export
GET    /api/drafts/:id/versions
```

**WebSocket Events:**
```
connect        → authentication, room joining
document:sync  → Yjs document updates
cursor:update  → user cursor position
presence:join  → user entered editor
presence:leave → user left editor
comment:new    → new comment added
```

---

## Success Metrics

### User Adoption
- Active users per month
- Demand letters generated per user
- Template creation rate
- Collaboration session frequency

### Efficiency Gains
- Time to draft (before/after AI)
- Number of AI refinements per letter
- Export completion rate
- User satisfaction (NPS score)

### Technical Performance
- AI generation success rate
- Average generation time
- Real-time sync latency
- System uptime percentage

### Business Metrics
- Customer retention rate
- Upsell conversion (basic → premium features)
- Support ticket volume
- Feature adoption rates

---

## Risk Mitigation

### Technical Risks
- **AI generation quality:** Extensive prompt testing, human review loop
- **Real-time sync conflicts:** CRDT algorithm, thorough testing
- **Performance at scale:** Load testing, caching strategy
- **Data loss:** Automated backups, version history

### Security Risks
- **Data breaches:** Encryption, access controls, security audits
- **Unauthorized access:** MFA, session management, audit logs
- **API abuse:** Rate limiting, authentication, monitoring

### Business Risks
- **Low adoption:** User training, intuitive UX, pilot program
- **Competitive pressure:** Unique features, superior AI quality
- **Compliance violations:** Legal review, compliance certification

---

## Conclusion

This product plan provides a comprehensive roadmap for building the Demand Letter Generator MVP with all required P0 and P1 features. The architecture is designed for scalability, security, and collaborative editing while leveraging cutting-edge AI capabilities. With the recommended technology stack and phased development approach, the system will deliver significant value to law firms while maintaining the flexibility to add enhanced features in future iterations.
