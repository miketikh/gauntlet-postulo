# Epic 1: Foundation & Core Infrastructure

**Expanded Goal:** Establish the technical foundation for the entire application by configuring the monorepo structure, implementing user authentication and authorization, setting up the database with proper isolation, and deploying basic infrastructure to AWS. This epic creates a "walking skeleton" that enables all subsequent parallel development streams while ensuring security, scalability, and maintainability from day one. Upon completion, developers can independently work on document management, templates, and collaboration features without blocking each other.

---

## Story 1.1: Initialize Monorepo with TypeScript Configuration

As a **developer**,
I want to set up a monorepo structure with TypeScript configuration,
so that frontend and backend code can coexist with shared dependencies and type safety.

### Acceptance Criteria

1. Monorepo is initialized using Turborepo or Nx with workspace configuration
2. Package structure includes: `packages/web-app`, `packages/api-server`, `packages/shared-types`, `packages/shared-utils`
3. TypeScript is configured in strict mode for all packages with shared `tsconfig.base.json`
4. ESLint and Prettier are configured with consistent rules across packages
5. `package.json` scripts exist for building, linting, and type-checking all packages
6. README.md documents monorepo structure and setup instructions
7. Git repository is initialized with appropriate `.gitignore` for Node.js projects
8. All packages can be built successfully with `npm run build` or equivalent

---

## Story 1.2: Scaffold React Frontend Application

As a **developer**,
I want a React frontend application scaffolded with Vite and basic routing,
so that I can build UI features on a modern, performant foundation.

### Acceptance Criteria

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

## Story 1.3: Scaffold Node.js Backend API with Fastify

As a **developer**,
I want a Node.js backend API scaffolded with Fastify and TypeScript,
so that I can build secure, performant API endpoints.

### Acceptance Criteria

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

## Story 1.4: Set Up PostgreSQL Database with Prisma ORM

As a **developer**,
I want PostgreSQL database configured with Prisma ORM and initial schema,
so that I can persist application data with type-safe queries.

### Acceptance Criteria

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

## Story 1.5: Configure AWS Infrastructure Basics (S3 and RDS)

As a **developer**,
I want AWS infrastructure set up for file storage and database hosting,
so that the application can store documents securely and run in production.

### Acceptance Criteria

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

## Story 1.6: Implement User Registration API Endpoint

As a **developer**,
I want a user registration API endpoint,
so that new users can create accounts with email and password.

### Acceptance Criteria

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

## Story 1.7: Implement User Login API with JWT Authentication

As a **developer**,
I want a login API endpoint that issues JWT tokens,
so that users can authenticate and access protected resources.

### Acceptance Criteria

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

## Story 1.8: Build Frontend Authentication Pages (Signup and Login)

As a **user**,
I want signup and login pages in the web application,
so that I can create an account and access the system.

### Acceptance Criteria

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

## Story 1.9: Implement Role-Based Access Control (RBAC)

As a **system administrator**,
I want role-based access control implemented,
so that users have appropriate permissions based on their role (admin, attorney, paralegal).

### Acceptance Criteria

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

## Story 1.10: Implement Firm-Level Data Isolation

As a **law firm**,
I want my data isolated from other firms,
so that confidential case information remains secure and private.

### Acceptance Criteria

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

## Story 1.11: Build Basic Dashboard UI Shell

As a **user**,
I want a dashboard page with navigation and empty state,
so that I have a starting point for accessing application features.

### Acceptance Criteria

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

## Story 1.12: Set Up CI/CD Pipeline with GitHub Actions

As a **developer**,
I want automated CI/CD pipeline,
so that code quality is enforced and deployments are streamlined.

### Acceptance Criteria

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
