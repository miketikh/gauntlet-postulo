# Technical Assumptions

This section documents the recommended technical architecture and technology choices to guide the development team. These recommendations are based on project requirements, industry best practices, and team capabilities, but should be validated and refined during architecture planning.

## Repository Structure: Monorepo

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

## Service Architecture: Modular Monolith (within Monorepo)

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

## Testing Requirements: Unit + Integration + E2E

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

## Frontend Technology Stack

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

## Backend Technology Stack

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

## Infrastructure & Deployment (AWS)

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

## AI/ML Integration

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

## Additional Technical Assumptions

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

## Key Risks and Mitigation

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
