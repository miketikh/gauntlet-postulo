# Demand Letter Generator Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Automate demand letter generation to reduce attorney time spent on document drafting by at least 50%
- Enable law firms to create and manage firm-specific templates that maintain consistency and adhere to firm standards
- Provide real-time collaborative editing capabilities for attorneys and paralegals to work together efficiently
- Achieve 80% user adoption rate within the first year among existing Steno clients
- Increase client retention and satisfaction through improved efficiency and productivity
- Generate new sales leads by showcasing innovative AI-powered legal solutions
- Deliver a production-ready MVP with P0 (must-have) and P1 (should-have) features for law firm workflows

### Background Context

Demand letters are a critical component in the litigation process, representing the formal notification of claims and damages before potential legal action. Currently, attorneys spend considerable time reviewing source documents—medical records, police reports, correspondence, and evidence—to manually draft these letters. This time-consuming process delays litigation progress, reduces billable hours for higher-value work, and creates bottlenecks in case management workflows.

Steno's Demand Letter Generator leverages AI to transform this workflow. By allowing attorneys to upload source materials and generate draft demand letters using firm-specific templates, the tool automates the most tedious aspects of document creation. The addition of real-time collaborative editing (Google Docs-style) enables attorneys and paralegals to refine documents together, while AI-powered refinement capabilities allow for iterative improvements based on attorney feedback. This solution addresses a clear pain point in legal practice, positioning Steno as an innovator in AI-driven legal technology.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-10 | 0.1 | Initial PRD draft | John (PM Agent) |

## Requirements

### Functional Requirements

**FR1:** Users must be able to upload multiple source documents (PDF, DOCX, JPEG, PNG formats) via drag-and-drop interface or file browser

**FR2:** System must extract text content from uploaded documents automatically, including OCR capabilities for image-based documents

**FR3:** Users must be able to create, edit, and manage firm-specific demand letter templates with customizable sections and variables

**FR4:** System must generate draft demand letters using AI (Anthropic Claude API or AWS Bedrock) based on uploaded source documents and selected template

**FR5:** AI generation must stream output to the frontend to provide responsive user experience during draft creation

**FR6:** Users must be able to refine generated content using AI with both pre-defined quick actions ("make more assertive", "add detail", etc.) and custom text prompts

**FR7:** System must support real-time collaborative editing with multiple users simultaneously editing the same document (Google Docs-style)

**FR8:** System must display live presence indicators showing which users are viewing or editing a document, including cursor positions

**FR9:** Users must be able to add in-line comment threads on text selections for feedback and discussion

**FR10:** System must track all changes with author attribution and timestamps for audit trail purposes

**FR11:** Users must be able to export finalized demand letters to Microsoft Word (.docx) format with preserved formatting

**FR12:** Templates must support three section types: static content, AI-generated content, and dynamic variables

**FR13:** System must provide version history for documents, allowing users to view and restore previous versions

**FR14:** Users must authenticate via email/password with role-based access control (admin, attorney, paralegal)

**FR15:** System must enforce firm-level data isolation, ensuring users can only access documents and templates belonging to their firm

### Non-Functional Requirements

**NFR1:** Page load times must be under 2 seconds for 95th percentile of requests

**NFR2:** API requests (excluding AI generation) must respond within 500 milliseconds for 95th percentile

**NFR3:** AI draft generation must complete within 30 seconds for typical demand letter cases

**NFR4:** Real-time collaboration sync latency must be under 100 milliseconds for document changes

**NFR5:** All data at rest must be encrypted using AWS S3 Server-Side Encryption with KMS (SSE-KMS) and PostgreSQL transparent data encryption

**NFR6:** All data in transit must use TLS 1.3 for HTTP and WebSocket connections

**NFR7:** System must maintain 99.9% uptime excluding planned maintenance windows

**NFR8:** System must support at least 1,000 concurrent users with simultaneous editing sessions without performance degradation

**NFR9:** Database queries must complete within 100 milliseconds for 95th percentile of requests

**NFR10:** System must comply with legal industry security standards including ABA Model Rules for attorney-client privilege

**NFR11:** System must provide comprehensive audit logging for all document access and modifications

**NFR12:** System must support multi-factor authentication (MFA) for enhanced security

**NFR13:** Application must be WCAG 2.1 AA compliant for accessibility, including keyboard navigation and screen reader support

**NFR14:** System must implement automated hourly incremental backups and daily full backups with disaster recovery RTO < 4 hours

**NFR15:** System must handle file uploads up to 50MB with progress indicators for files over 5MB

## User Interface Design Goals

### Overall UX Vision

The Demand Letter Generator should feel like a professional legal workspace that combines the familiarity of traditional document editing with the power of modern AI assistance. The interface prioritizes **clarity, efficiency, and confidence-building** for legal professionals who need to trust the tool with high-stakes documents.

The experience should follow a clear linear workflow for new letter creation (upload → template selection → AI generation → collaborative editing → export) while providing quick access to ongoing projects via a dashboard. Real-time collaboration should feel seamless and unobtrusive, with presence indicators and comments integrated naturally into the editing experience. AI capabilities should be discoverable but not overwhelming—attorneys should feel in control of the content at all times, with AI positioned as an intelligent assistant rather than an autonomous decision-maker.

The visual design should convey **professionalism, security, and trustworthiness** through clean typography, generous whitespace, and a color palette that aligns with legal industry expectations (navy, slate gray, white, with accent colors for interactive elements).

### Key Interaction Paradigms

1. **Progressive Disclosure:** Complex features like template management and advanced AI refinement are accessible but not cluttering the primary workflow. The main path (create letter → edit → export) is prominent and simplified.

2. **Side-by-Side Context:** When editing drafts, users see source documents alongside the draft editor in a split-screen layout. This allows attorneys to reference source materials without context-switching between windows.

3. **Streaming Feedback:** AI generation provides real-time streaming output with visual progress indicators, allowing users to see content being created rather than waiting for completion. This builds trust and reduces perceived wait time.

4. **Inline Refinement:** AI refinement actions are contextual—users can select text and trigger refinement on specific sections rather than regenerating entire documents. Quick action buttons appear on text selection.

5. **Non-blocking Collaboration:** Presence indicators show who's editing, but collaboration never locks sections or forces turn-taking. CRDT-based conflict resolution happens automatically in the background.

6. **Smart Defaults with Flexibility:** Templates provide structure, but users can always override AI suggestions or add manual content. The system suggests but never restricts.

### Core Screens and Views

1. **Dashboard / Projects List**
   - Central hub showing all demand letter projects (drafts in progress, completed, sent)
   - Filters by status, date, attorney, case number
   - Quick stats widget (letters this month, time saved estimate)
   - Prominent "New Demand Letter" CTA button
   - Recent activity feed showing team members' actions

2. **Document Upload Wizard**
   - Large drag-and-drop zone with visual feedback
   - Multi-file upload with batch processing
   - Document preview thumbnails with extracted text preview
   - Progress indicators for upload and text extraction
   - Template selection screen (gallery view of firm templates)

3. **Case Details Form**
   - Dynamic form based on selected template's variables
   - Fields for plaintiff/defendant names, incident date, demand amount, jurisdiction
   - Auto-save functionality to prevent data loss
   - Ability to save partial information and return later

4. **AI Generation View**
   - Full-screen focus mode during initial generation
   - Streaming text output with typewriter effect
   - Section-by-section progress indicators (Header → Facts → Damages → Demand)
   - Option to pause/stop generation if content is off-track

5. **Collaborative Editor (Primary Workspace)**
   - **Left Panel:** Tabbed source document viewer (switch between uploaded PDFs/docs)
   - **Center Panel:** Rich text editor with formatting toolbar (bold, italic, lists, headings)
   - **Right Sidebar (collapsible):**
     - Presence indicators (avatars of active users)
     - Comment threads panel
     - Version history drawer
   - **Floating AI Panel:** Quick refinement actions + custom prompt input
   - **Top Bar:** Project title, save status, "Export to Word" button, share/collaboration settings

6. **Template Builder/Manager**
   - Gallery view of all firm templates
   - Visual template editor with drag-and-drop section blocks
   - Section configuration panel (type: static/AI-generated/variable)
   - Variable definition interface (name, type, required/optional)
   - Live preview pane showing template with sample data
   - Version control for template iterations

7. **Settings / Admin Panel**
   - User management (for firm admins)
   - Firm-level settings (branding, default templates, security policies)
   - Usage analytics dashboard (letters generated, time savings, adoption metrics)
   - Billing and subscription management

8. **Export Preview**
   - Final preview of formatted document before export
   - Option to select export format (Word .docx initially, potentially PDF later)
   - Download or email options

### Accessibility: WCAG 2.1 AA

The application must meet WCAG 2.1 AA compliance standards, ensuring usability for attorneys with disabilities:

- **Keyboard Navigation:** All features accessible via keyboard shortcuts (tab navigation, arrow keys for lists, Ctrl+S for save, etc.)
- **Screen Reader Support:** Proper ARIA labels on all interactive elements, semantic HTML structure, alt text for icons
- **Color Contrast:** Minimum 4.5:1 contrast ratio for text, 3:1 for UI components
- **Focus Indicators:** Visible focus states on all interactive elements
- **Text Resizing:** Support for 200% zoom without loss of functionality
- **Alternative Input Methods:** Support for voice dictation and switch controls where applicable

### Branding

**Assumption:** Steno has existing brand guidelines that should be incorporated.

- **Typography:** Professional serif font for document content (mimicking legal documents), clean sans-serif for UI elements
- **Color Palette:**
  - Primary: Navy blue (#1E3A5F) for headers, primary actions
  - Secondary: Slate gray (#475569) for body text
  - Accent: Professional teal (#0891B2) or gold (#D97706) for interactive elements and success states
  - Semantic colors: Red for destructive actions, green for confirmations
- **Logo Placement:** Steno logo in top-left navigation, firm logos in generated document headers (configurable per firm)
- **Tone:** Professional, trustworthy, intelligent but not intimidating

### Target Device and Platforms: Desktop-First with Basic Mobile Responsiveness

**Primary Target:** Desktop browsers (Chrome, Firefox, Safari, Edge) on macOS and Windows
- Optimized for screen resolutions 1920x1080 and above
- Split-screen layouts and multi-panel views assume desktop real estate
- Keyboard shortcuts and hover interactions designed for desktop use

**Secondary Support:** Tablet and mobile browsers (iOS Safari, Chrome)
- **Tablets (iPad, Android tablets):** Functional editing interface with adapted layout (single-panel view instead of split-screen)
- **Mobile phones:**
  - View-only mode for reading drafts on the go
  - Light editing capabilities (text changes, comments)
  - Document upload via camera/photo library
  - Core features like template building and AI generation are desktop-only
  - Navigation simplified to hamburger menu

**Responsive Breakpoints:**
- Desktop: 1280px and above (full feature set)
- Tablet: 768px - 1279px (adapted layouts, full features)
- Mobile: Below 768px (limited features, view-focused)

**No native mobile apps** in MVP scope.

## Technical Assumptions

This section documents the recommended technical architecture and technology choices to guide the development team. These recommendations are based on project requirements, industry best practices, and team capabilities, but should be validated and refined during architecture planning.

### Repository Structure: Monorepo

**Recommendation:** Use a **monorepo** structure with separate packages for frontend, backend services, and shared libraries.

**Rationale:**
- Simplifies dependency management and versioning across frontend/backend
- Enables code sharing (TypeScript types, validation schemas, constants)
- Facilitates atomic commits that span frontend and backend changes
- Reduces merge conflicts compared to polyrepo when features require coordinated changes
- Tools like Turborepo or Nx provide excellent monorepo support with caching and parallel builds

**Structure Example:**
```
/packages
  /web-app          (React frontend)
  /api-server       (Node.js backend)
  /shared-types     (TypeScript interfaces, Zod schemas)
  /shared-utils     (Common utilities)
```

**Alternative:** Polyrepo if teams are strictly separated, but this goes against the parallelization goal.

### Service Architecture: Modular Monolith (within Monorepo)

**Recommendation:** Build a **modular monolithic backend** rather than microservices for MVP.

**Rationale:**
- Simpler deployment and operations (single API server)
- Easier debugging and testing (no distributed system complexity)
- Reduced latency (in-process communication vs. network calls)
- Can be decomposed into microservices later if specific scaling needs emerge
- Well-organized modules (auth, documents, AI, templates, collaboration) within a single codebase

**Modular Structure:**
- **Auth Module:** User authentication, JWT management, RBAC
- **Documents Module:** File upload, storage, text extraction
- **AI Module:** Anthropic/Bedrock integration, prompt management, streaming
- **Templates Module:** Template CRUD, versioning
- **Collaboration Module:** WebSocket server, Yjs document sync
- **Export Module:** Word document generation

**Alternative:** Serverless functions (AWS Lambda) for specific compute-heavy tasks (AI generation, document processing) while keeping core API as monolith. This hybrid approach could optimize costs.

### Testing Requirements: Unit + Integration + E2E

**Recommendation:** Implement **full testing pyramid** with emphasis on integration tests.

**Testing Strategy:**
1. **Unit Tests:**
   - All business logic, utilities, and pure functions
   - Target: 80%+ coverage for critical paths
   - Tools: Jest, Vitest

2. **Integration Tests:**
   - API endpoints with real database (test database)
   - AI integration mocking (to avoid API costs in CI)
   - File upload/processing workflows
   - Tools: Supertest, Testcontainers (for PostgreSQL)

3. **End-to-End Tests:**
   - Critical user flows (create letter, collaborate, export)
   - Smoke tests for production deployment
   - Tools: Playwright or Cypress

4. **Manual Testing:**
   - Provide developer-friendly seeding scripts for realistic test data
   - Document setup for local testing with sample cases
   - Include sample PDFs, templates, and user accounts

**Rationale:** Legal industry requires high reliability. Integration tests catch database/API issues that unit tests miss. E2E tests are expensive but critical for user-facing workflows.

### Frontend Technology Stack

**Framework & Language:**
- **React 18+** with **TypeScript** (strict mode)
- **Vite** for build tooling (faster than Create React App)

**State Management:**
- **Zustand** or **Redux Toolkit** (preference: Zustand for simplicity)
- **React Query** for server state management and caching

**Real-Time Collaboration:**
- **Yjs** (CRDT library) for conflict-free document editing
- **y-websocket** for real-time synchronization
- **Lexical** (Meta) or **TipTap** (ProseMirror-based) for rich text editor

**UI Components & Styling:**
- **Radix UI** (unstyled, accessible primitives)
- **Tailwind CSS** for styling
- **Headless UI** for complex components (modals, dropdowns)
- **shadcn/ui** patterns for composed components

**Document Handling:**
- **react-pdf** or **PDF.js** for PDF viewing
- **mammoth.js** for Word document preview (if needed)

**HTTP & WebSockets:**
- **Axios** or **Fetch API** (with React Query wrapper)
- Native **WebSocket API** (abstracted by y-websocket)

**Form Management:**
- **React Hook Form** with **Zod** validation

**Rationale:**
- React is team-standard and has mature ecosystem
- TypeScript catches errors at compile time (critical for legal app)
- Yjs is industry-leading CRDT solution (used by Notion, Linear)
- Lexical/TipTap provide extensible editing without building from scratch
- Radix + Tailwind balance accessibility, customization, and speed

**Alternatives to Consider:**
- **Lexical vs. TipTap:** Lexical is newer (Meta-backed), TipTap more mature. Both excellent choices.
- **Zustand vs. Redux Toolkit:** Zustand simpler for smaller apps; Redux provides more structure if app grows complex.

### Backend Technology Stack

**Runtime & Language:**
- **Node.js 20+** with **TypeScript**
- **Express** or **Fastify** (recommendation: **Fastify** for performance and TypeScript support)

**Database & ORM:**
- **PostgreSQL 15+** (primary database)
- **Prisma** (ORM - excellent TypeScript support, migrations)
- **Redis** (optional for MVP, useful for session management and WebSocket pub/sub)

**Document Processing:**
- **pdf-parse** (PDF text extraction)
- **mammoth** (Word document parsing)
- **sharp** (image optimization)
- **Tesseract.js** (OCR for scanned documents)

**AI Integration:**
- **Anthropic SDK** (TypeScript client for Claude API)
- **Streaming support** for real-time generation
- Fallback to **AWS Bedrock SDK** if multi-model support needed

**Authentication:**
- **JWT** tokens (access + refresh token pattern)
- **bcrypt** for password hashing
- **Passport.js** or custom middleware

**File Storage:**
- **AWS SDK v3** for S3 operations
- **Presigned URLs** for secure uploads

**WebSocket Server:**
- **ws** library
- **y-websocket** integration for Yjs sync

**Validation:**
- **Zod** (shared with frontend)

**Testing:**
- **Jest** (unit tests)
- **Supertest** (API integration tests)

**Rationale:**
- Node.js enables TypeScript code sharing with frontend
- Fastify provides better performance than Express with native TypeScript
- Prisma simplifies database operations and migrations
- Anthropic SDK is first-class for Claude integration
- AWS SDK is required for S3 operations

**Alternatives:**
- **Python backend** (FastAPI) if AI workflows become very complex, but sacrifices code sharing benefits
- **TypeORM vs. Prisma:** Prisma has better DX and type safety

### Infrastructure & Deployment (AWS)

**Compute:**
- **AWS ECS (Fargate)** for containerized API server (recommendation for MVP)
- Alternative: **AWS Lambda** for serverless (requires more architecture changes)

**Storage:**
- **AWS S3** with **KMS encryption** for documents
- **S3 lifecycle policies** for archival

**Database:**
- **AWS RDS (PostgreSQL)** with Multi-AZ for production
- **Automated backups** (point-in-time recovery)

**Networking:**
- **Application Load Balancer (ALB)** for API routing
- **CloudFront CDN** for frontend static assets

**WebSockets:**
- **ALB supports WebSocket** upgrade (no separate infrastructure needed)

**CI/CD:**
- **GitHub Actions** or **AWS CodePipeline**
- **Docker** for containerization
- **Terraform** or **AWS CDK** for infrastructure as code (optional for MVP)

**Monitoring & Logging:**
- **AWS CloudWatch** for logs and basic metrics
- **Sentry** for error tracking
- **DataDog** or **New Relic** for APM (optional)

**Security:**
- **AWS WAF** for web application firewall
- **AWS Secrets Manager** for API keys and database credentials
- **VPC** with private subnets for RDS

**Rationale:**
- ECS Fargate simplifies container orchestration without managing EC2 instances
- RDS handles database operations, backups, and scaling
- ALB native WebSocket support avoids separate infrastructure
- CloudFront reduces latency for global users

**Alternatives:**
- **AWS Lambda + API Gateway** for fully serverless (reduces costs at low usage, but WebSocket support via API Gateway is more complex)
- **Vercel** for frontend hosting (simpler than CloudFront + S3)

### AI/ML Integration

**Primary Provider:** **Anthropic Claude API** (Claude 3.5 Sonnet or Claude 4.5 Sonnet)

**Integration Approach:**
- **Direct API calls** via Anthropic SDK
- **Streaming responses** for real-time generation feedback
- **Prompt templates** stored in codebase (not database initially)
- **Token usage tracking** for cost monitoring

**Alternative Provider:** **AWS Bedrock** (multi-model support: Claude, Llama, Titan)

**Prompt Management:**
- **Hardcoded templates** in TypeScript (simple, version-controlled)
- Alternative: **LangChain** if complex prompt chaining is needed (likely overkill for MVP)

**Rationale:**
- Claude excels at long-form, structured content generation
- Streaming improves UX dramatically
- Anthropic SDK is simpler than Bedrock for single-model use case
- Bedrock provides vendor diversification if needed

### Additional Technical Assumptions

1. **Version Control:** Git (GitHub or GitLab)

2. **API Design:** RESTful JSON APIs + WebSocket for collaboration

3. **Authentication Flow:** JWT access tokens (15min expiry) + refresh tokens (7 days)

4. **CORS Policy:** Frontend domain whitelisted; strict for production

5. **Rate Limiting:** Implemented at API gateway level (prevent abuse)

6. **Email Service:** **AWS SES** or **SendGrid** for transactional emails (password reset, notifications)

7. **Logging Strategy:** Structured JSON logs with request IDs for tracing

8. **Environment Management:** Separate environments (dev, staging, production) with environment variables

9. **Document Retention:** Indefinite storage in S3 (user controls deletion)

10. **Compliance Tracking:** Audit logs stored in separate database table (immutable, append-only)

### Key Risks and Mitigation

**Risk: AI generation costs exceed budget**
- Mitigation: Implement token usage monitoring and alerts; provide cost estimates to users; optimize prompts for brevity

**Risk: Real-time collaboration performance at scale**
- Mitigation: Load test WebSocket server; implement connection pooling; add Redis pub/sub for multi-instance deployments

**Risk: PDF text extraction quality issues (scanned documents)**
- Mitigation: Implement OCR with quality validation; allow manual text correction; provide preview of extracted text

**Risk: WCAG compliance gaps**
- Mitigation: Accessibility audit during development; automated testing with axe-core; manual testing with screen readers

**Risk: S3 encryption key management**
- Mitigation: Use AWS KMS with proper IAM policies; key rotation policies; backup key recovery procedures

## Epic List

This section presents the high-level breakdown of work into epics. Each epic represents a significant, deployable increment of functionality. The structure prioritizes **parallel development opportunities** to maximize team efficiency while respecting logical dependencies.

### Development Flow & Parallelization Strategy

**Phase 1: Foundation (Sequential)**
- Epic 1 must complete first to establish infrastructure

**Phase 2: Parallel Streams (After Epic 1)**
- Epic 2 (Document & AI) and Epic 3 (Templates) can be developed in parallel
- Epic 4 (Collaborative Editor - frontend work) can begin in parallel

**Phase 3: Integration & Advanced Features**
- Epic 5 integrates outputs from Epics 2, 3, 4
- Epic 6 finalizes and polishes

---

### Epic 1: Foundation & Core Infrastructure
**Goal:** Establish project foundation, authentication, database, and deployment pipeline to enable all subsequent parallel development.

This epic delivers a working skeleton application with health checks, user authentication, and database connectivity. While not user-facing, it's the critical enabler for all parallel work streams.

**Key Deliverables:**
- Monorepo structure with TypeScript configuration
- React frontend with routing and basic UI framework
- Node.js backend API with Fastify
- PostgreSQL database with Prisma ORM
- AWS infrastructure setup (S3, RDS, ECS/Fargate)
- User authentication (JWT, signup/login)
- Role-based access control (admin, attorney, paralegal)
- Firm-level data isolation
- CI/CD pipeline for automated testing and deployment
- Basic dashboard UI (empty state, navigation shell)

**Parallelization Note:** Once Epic 1 is complete, multiple teams can work simultaneously on Epics 2, 3, and 4 with minimal merge conflicts.

---

### Epic 2: Document Management & AI Generation
**Goal:** Enable users to upload source documents and generate draft demand letters using AI, delivering the core value proposition of automated letter creation.

This epic delivers end-to-end functionality for the primary user workflow: upload documents → generate AI draft → view draft. It provides immediate measurable value (time savings).

**Key Deliverables:**
- Document upload interface (drag-and-drop, multi-file)
- File storage in encrypted S3 buckets
- Text extraction from PDFs, Word docs, and images (OCR)
- Document viewer for uploaded files
- Anthropic Claude API integration with streaming
- Prompt engineering for demand letter generation
- AI generation workflow (template selection → case details form → generation)
- Draft display with basic text rendering
- Version history and snapshots

**Dependencies:** Epic 1 (infrastructure, auth, database)

**Parallel Opportunity:** Can be developed simultaneously with Epic 3 (Templates) since template system can start with hardcoded templates, and AI integration can use placeholder templates initially.

---

### Epic 3: Template Management System
**Goal:** Enable firms to create, customize, and manage demand letter templates that define structure, sections, and variables for AI generation.

This epic delivers firm-specific customization capabilities, allowing templates to enforce consistency and meet firm standards. Provides differentiation and stickiness (firms invest time in template creation).

**Key Deliverables:**
- Template CRUD APIs (create, read, update, delete)
- Template data model (sections, variables, types)
- Template builder UI (visual editor with drag-and-drop sections)
- Section type configuration (static, AI-generated, variable)
- Variable definition interface
- Template gallery/selection view
- Template versioning
- Firm-level template access control
- Default template seeding (1-2 sample templates)

**Dependencies:** Epic 1 (infrastructure, auth, database)

**Parallel Opportunity:** Can be developed simultaneously with Epic 2 (Document & AI). Integration point is minimal—Epic 2 can consume templates via API once Epic 3 exposes them.

---

### Epic 4: Collaborative Editing Platform
**Goal:** Provide real-time collaborative editing with presence awareness, comments, and conflict-free document sync to enable attorney-paralegal teamwork.

This epic transforms the application from single-user to multi-user, delivering the "Google Docs for legal" experience. Significantly enhances value for law firm teams.

**Key Deliverables:**
- Rich text editor integration (Lexical or TipTap)
- Yjs CRDT implementation for conflict-free editing
- WebSocket server for real-time sync
- Presence indicators (who's viewing/editing, cursors)
- In-line comment threads
- Change tracking with author attribution
- Document locking/permissions UI
- Real-time draft updates across multiple clients
- Offline editing with reconnection sync

**Dependencies:**
- Epic 1 (infrastructure, WebSocket infrastructure)
- Partial dependency on Epic 2 (needs basic draft display, but can work with mock data initially)

**Parallel Opportunity:** Frontend editor work (Lexical/TipTap integration, UI) can start early. Backend WebSocket work requires Epic 1 infrastructure but is independent from Epic 2/3 business logic.

---

### Epic 5: AI Refinement & Export Capabilities
**Goal:** Allow users to iteratively refine AI-generated content and export finalized demand letters to Word format for official use.

This epic closes the loop on the user workflow (upload → generate → refine → export), delivering polish and production-readiness for letters. Export to Word is critical for legal workflows.

**Key Deliverables:**
- AI refinement UI (section selection, quick action buttons)
- Pre-defined quick actions ("make more assertive", "add detail", etc.)
- Custom prompt input for flexible refinement
- Refinement history tracking
- Context preservation across refinement iterations
- Word document export (.docx generation)
- Export formatting (preserve rich text, letterhead, structure)
- Export preview screen
- Download and email options for exports
- Version tagging in exported documents

**Dependencies:**
- Epic 2 (AI generation)
- Epic 4 (editor integration for refinement UI)

**Parallel Opportunity:** Export functionality (Word generation) can be developed independently from refinement UI if APIs are well-defined.

---

### Epic 6: Production Readiness & Polish
**Goal:** Ensure system reliability, security, performance, and compliance for production launch with paying law firm clients.

This epic focuses on quality, reliability, and legal industry requirements. While less visible to users, it's critical for trust and adoption in the legal market.

**Key Deliverables:**
- Comprehensive test coverage (unit, integration, E2E)
- Performance optimization (database query optimization, caching, frontend bundle size)
- Security audit and penetration testing
- WCAG 2.1 AA accessibility compliance verification
- Error handling and user-friendly error messages
- Loading states and progress indicators
- Responsive design refinement (desktop, tablet, mobile)
- Production monitoring setup (CloudWatch, Sentry, DataDog)
- Audit logging for compliance
- Data backup and disaster recovery testing
- Production deployment and smoke testing
- User documentation and onboarding flows
- Admin panel for firm management
- Usage analytics dashboard

**Dependencies:** All previous epics (this is the final polish pass)

**Parallel Opportunity:** Testing can be performed incrementally throughout development (unit tests alongside feature work), but comprehensive E2E and security audit happen at the end.

## Epic 1: Foundation & Core Infrastructure

**Expanded Goal:** Establish the technical foundation for the entire application by configuring the monorepo structure, implementing user authentication and authorization, setting up the database with proper isolation, and deploying basic infrastructure to AWS. This epic creates a "walking skeleton" that enables all subsequent parallel development streams while ensuring security, scalability, and maintainability from day one. Upon completion, developers can independently work on document management, templates, and collaboration features without blocking each other.

---

### Story 1.1: Initialize Monorepo with TypeScript Configuration

As a **developer**,
I want to set up a monorepo structure with TypeScript configuration,
so that frontend and backend code can coexist with shared dependencies and type safety.

#### Acceptance Criteria

1. Monorepo is initialized using Turborepo or Nx with workspace configuration
2. Package structure includes: `packages/web-app`, `packages/api-server`, `packages/shared-types`, `packages/shared-utils`
3. TypeScript is configured in strict mode for all packages with shared `tsconfig.base.json`
4. ESLint and Prettier are configured with consistent rules across packages
5. `package.json` scripts exist for building, linting, and type-checking all packages
6. README.md documents monorepo structure and setup instructions
7. Git repository is initialized with appropriate `.gitignore` for Node.js projects
8. All packages can be built successfully with `npm run build` or equivalent

---

### Story 1.2: Scaffold React Frontend Application

As a **developer**,
I want a React frontend application scaffolded with Vite and basic routing,
so that I can build UI features on a modern, performant foundation.

#### Acceptance Criteria

1. React 18+ application created in `packages/web-app` using Vite
2. TypeScript configured with React-specific types
3. React Router v6 installed and configured with basic route structure
4. Tailwind CSS installed and configured with basic utility classes working
5. Basic layout component created (Header, Main, Footer structure)
6. Development server starts successfully on `http://localhost:3000`
7. Hot module replacement (HMR) works for React components
8. Build process generates optimized production bundle
9. Basic health check page displays "Application Running" at root route

---

### Story 1.3: Scaffold Node.js Backend API with Fastify

As a **developer**,
I want a Node.js backend API scaffolded with Fastify and TypeScript,
so that I can build secure, performant API endpoints.

#### Acceptance Criteria

1. Node.js project created in `packages/api-server` with TypeScript
2. Fastify framework installed and configured with TypeScript types
3. Basic server starts successfully on `http://localhost:4000`
4. Health check endpoint `GET /api/health` returns `{ status: "ok", timestamp: ISO8601 }`
5. Environment variable configuration using `dotenv` with `.env.example` template
6. Request logging middleware configured (using `pino` logger)
7. CORS middleware configured to allow frontend origin
8. Error handling middleware catches and formats errors consistently
9. TypeScript compilation produces clean JavaScript in `dist` folder
10. `npm run dev` starts server with hot reload using `tsx` or `nodemon`

---

### Story 1.4: Set Up PostgreSQL Database with Prisma ORM

As a **developer**,
I want PostgreSQL database configured with Prisma ORM and initial schema,
so that I can persist application data with type-safe queries.

#### Acceptance Criteria

1. Prisma installed in `packages/api-server` with PostgreSQL connector
2. Prisma schema file created with database connection configuration
3. Initial schema includes `User`, `Firm`, `Session` tables with appropriate fields
4. Database migration created and applied successfully to local PostgreSQL instance
5. Prisma Client generated with TypeScript types for all models
6. Database connection utility module created with error handling
7. Seed script created to populate development database with sample data (1 firm, 2 users)
8. `npm run db:migrate` applies migrations successfully
9. `npm run db:seed` populates database with test data
10. Database connection health check integrated into API health endpoint

**Prerequisites:** Story 1.3 (backend API scaffold)

---

### Story 1.5: Configure AWS Infrastructure Basics (S3 and RDS)

As a **developer**,
I want AWS infrastructure set up for file storage and database hosting,
so that the application can store documents securely and run in production.

#### Acceptance Criteria

1. AWS S3 bucket created with name `steno-demand-letters-{environment}` with KMS encryption enabled
2. S3 bucket policy configured to block public access
3. IAM role created for application with S3 read/write permissions
4. AWS SDK v3 installed in backend with S3 client configuration
5. S3 connection test succeeds (upload, download, delete test file)
6. AWS RDS PostgreSQL instance provisioned (or configuration documented for manual setup)
7. RDS security group configured to allow connections from application
8. Environment variables documented for AWS credentials and S3 bucket names
9. Connection to RDS database succeeds from local development environment
10. Documentation includes setup instructions for AWS credentials and infrastructure

**Prerequisites:** Story 1.3 (backend API), Story 1.4 (database schema)

---

### Story 1.6: Implement User Registration API Endpoint

As a **developer**,
I want a user registration API endpoint,
so that new users can create accounts with email and password.

#### Acceptance Criteria

1. `POST /api/auth/register` endpoint accepts `{ email, password, firstName, lastName, firmId }`
2. Password is hashed using bcrypt before storage (minimum cost factor 10)
3. Email validation ensures valid format and uniqueness (returns 400 if duplicate)
4. Password validation enforces minimum 8 characters, 1 uppercase, 1 number
5. User record created in database with hashed password
6. Endpoint returns 201 Created with user object (excluding password) on success
7. Endpoint returns 400 Bad Request with validation errors for invalid input
8. Unit tests cover successful registration, duplicate email, invalid password
9. Integration test verifies user record persisted in database

**Prerequisites:** Story 1.4 (database setup)

---

### Story 1.7: Implement User Login API with JWT Authentication

As a **developer**,
I want a login API endpoint that issues JWT tokens,
so that users can authenticate and access protected resources.

#### Acceptance Criteria

1. `POST /api/auth/login` endpoint accepts `{ email, password }`
2. Endpoint verifies password against hashed password using bcrypt
3. JWT access token generated with 15-minute expiry containing `{ userId, email, role, firmId }`
4. JWT refresh token generated with 7-day expiry
5. Tokens signed using secret key from environment variables
6. Endpoint returns 200 OK with `{ accessToken, refreshToken, user }` on successful login
7. Endpoint returns 401 Unauthorized for invalid credentials
8. `POST /api/auth/refresh` endpoint accepts refresh token and issues new access token
9. JWT middleware created to verify and decode access tokens for protected routes
10. Unit tests cover successful login, invalid credentials, token refresh
11. Integration test verifies JWT payload contains correct user data

**Prerequisites:** Story 1.6 (user registration)

---

### Story 1.8: Build Frontend Authentication Pages (Signup and Login)

As a **user**,
I want signup and login pages in the web application,
so that I can create an account and access the system.

#### Acceptance Criteria

1. Signup page accessible at `/signup` with form fields: email, password, first name, last name
2. Login page accessible at `/login` with form fields: email, password
3. Both forms use React Hook Form with Zod validation matching API requirements
4. Signup form displays validation errors inline (e.g., "Email already exists")
5. Login form displays error message for invalid credentials
6. Successful signup redirects to login page with success message
7. Successful login stores JWT tokens in localStorage (or httpOnly cookie)
8. Successful login redirects to `/dashboard`
9. Forms include "Remember me" checkbox on login (extends refresh token expiry)
10. Forms are accessible via keyboard navigation and screen readers
11. Loading states displayed during API calls (disable submit button, show spinner)
12. Unit tests verify form validation logic
13. Integration tests verify successful signup and login flows

**Prerequisites:** Story 1.6 (registration API), Story 1.7 (login API), Story 1.2 (frontend scaffold)

---

### Story 1.9: Implement Role-Based Access Control (RBAC)

As a **system administrator**,
I want role-based access control implemented,
so that users have appropriate permissions based on their role (admin, attorney, paralegal).

#### Acceptance Criteria

1. User model includes `role` enum field with values: `admin`, `attorney`, `paralegal`
2. Database migration adds `role` column with default value `attorney`
3. JWT payload includes `role` field
4. Backend middleware function `requireRole(roles: string[])` created to protect endpoints
5. Protected route example: `GET /api/admin/users` requires `admin` role
6. Unauthorized role access returns 403 Forbidden with error message
7. Frontend auth context stores user role from JWT
8. Frontend `ProtectedRoute` component checks user role before rendering
9. Navigation menu conditionally displays items based on user role
10. Unit tests verify role-based middleware correctly allows/denies access
11. Integration test verifies admin-only endpoint rejects non-admin users

**Prerequisites:** Story 1.7 (JWT authentication), Story 1.8 (frontend auth pages)

---

### Story 1.10: Implement Firm-Level Data Isolation

As a **law firm**,
I want my data isolated from other firms,
so that confidential case information remains secure and private.

#### Acceptance Criteria

1. All data models requiring isolation include `firmId` foreign key field
2. Database row-level security policies configured to filter queries by `firmId` (Prisma middleware or manual filtering)
3. API middleware automatically injects `firmId` from authenticated user's JWT into queries
4. `GET /api/projects` endpoint only returns projects belonging to user's firm
5. Attempt to access another firm's resource returns 404 Not Found (not 403, to avoid information disclosure)
6. User registration requires valid `firmId` (firms seeded in database or created separately)
7. Firm model includes fields: `id`, `name`, `createdAt`
8. Database seed script creates 2-3 sample firms
9. Unit tests verify firm isolation for CRUD operations
10. Integration test verifies User A cannot access User B's data from different firm

**Prerequisites:** Story 1.4 (database schema), Story 1.9 (RBAC)

---

### Story 1.11: Build Basic Dashboard UI Shell

As a **user**,
I want a dashboard page with navigation and empty state,
so that I have a starting point for accessing application features.

#### Acceptance Criteria

1. Dashboard page accessible at `/dashboard` (protected route requiring authentication)
2. Dashboard includes top navigation bar with: logo, user profile dropdown, logout button
3. Dashboard includes sidebar navigation with menu items: Dashboard, Projects, Templates, Settings
4. Dashboard main content area displays empty state message: "Welcome! Create your first demand letter."
5. "New Demand Letter" prominent CTA button displayed (currently non-functional, placeholder)
6. User profile dropdown displays user name, role, and firm name
7. Logout button clears tokens and redirects to login page
8. Unauthenticated users accessing `/dashboard` are redirected to `/login`
9. Dashboard is fully responsive (mobile displays hamburger menu)
10. All navigation links have proper ARIA labels for accessibility

**Prerequisites:** Story 1.8 (auth pages), Story 1.9 (RBAC), Story 1.2 (frontend scaffold)

---

### Story 1.12: Set Up CI/CD Pipeline with GitHub Actions

As a **developer**,
I want automated CI/CD pipeline,
so that code quality is enforced and deployments are streamlined.

#### Acceptance Criteria

1. GitHub Actions workflow created in `.github/workflows/ci.yml`
2. Workflow triggers on push to `main` branch and pull requests
3. CI pipeline includes steps: install dependencies, lint, type-check, run unit tests
4. CI pipeline runs for both frontend and backend packages
5. CI fails if any linting, type-checking, or test errors occur
6. CD pipeline (optional for MVP) includes step to build Docker image
7. CD pipeline deploys to staging environment (or documents manual deployment process)
8. Status badges added to README.md showing CI status
9. Test coverage report generated and uploaded (e.g., to Codecov)
10. Pipeline completes in under 10 minutes for typical changes

**Prerequisites:** Story 1.1 (monorepo), Story 1.2 (frontend), Story 1.3 (backend), Story 1.4 (database)

## Epic 2: Document Management & AI Generation

**Expanded Goal:** Enable attorneys to upload case-related source documents (medical records, police reports, correspondence) and automatically generate draft demand letters using AI. This epic delivers the core value proposition—dramatically reducing the time required to create initial drafts by leveraging Claude's natural language understanding and generation capabilities. The system must handle various document formats, extract text accurately, and produce contextually appropriate legal documents based on the source materials and selected templates.

---

### Story 2.1: Build Document Upload UI with Drag-and-Drop

As an **attorney**,
I want to upload multiple source documents via drag-and-drop or file browser,
so that I can quickly provide case materials for demand letter generation.

#### Acceptance Criteria

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

### Story 2.2: Implement Document Upload API and S3 Storage

As a **developer**,
I want a document upload API that stores files in S3,
so that documents are securely persisted with encryption.

#### Acceptance Criteria

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

### Story 2.3: Implement PDF Text Extraction

As a **developer**,
I want automated text extraction from uploaded PDFs,
so that content is available for AI processing without manual transcription.

#### Acceptance Criteria

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

### Story 2.4: Implement Word Document and Image OCR Processing

As an **attorney**,
I want text extracted from Word documents and scanned images,
so that all my source materials are usable regardless of format.

#### Acceptance Criteria

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

### Story 2.5: Build Document Viewer for Uploaded Files

As an **attorney**,
I want to view uploaded source documents in the browser,
so that I can reference them while reviewing generated drafts.

#### Acceptance Criteria

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

### Story 2.6: Integrate Anthropic Claude API for AI Generation

As a **developer**,
I want Anthropic Claude API integrated with streaming support,
so that we can generate demand letters with real-time progress feedback.

#### Acceptance Criteria

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

### Story 2.7: Engineer Prompts for Demand Letter Generation

As a **product manager**,
I want well-engineered prompts for demand letter generation,
so that AI output is accurate, professional, and legally appropriate.

#### Acceptance Criteria

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

### Story 2.8: Build AI Generation Workflow UI

As an **attorney**,
I want a guided workflow for generating demand letters,
so that I can easily provide necessary information and trigger AI generation.

#### Acceptance Criteria

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

### Story 2.9: Implement Draft Storage and Version History

As an **attorney**,
I want generated drafts automatically saved with version history,
so that I can track changes and restore previous versions if needed.

#### Acceptance Criteria

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

### Story 2.10: Build Projects Dashboard with Draft List

As an **attorney**,
I want a projects dashboard showing all my demand letters,
so that I can easily find and resume work on existing drafts.

#### Acceptance Criteria

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
