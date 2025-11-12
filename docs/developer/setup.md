# Developer Setup Guide

## Overview

This guide walks through setting up a local development environment for the Steno Demand Letter Generator.

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20 LTS | JavaScript runtime |
| npm | 9+ | Package manager |
| PostgreSQL | 15+ | Database |
| Docker | 24+ | Database containerization (optional) |
| Git | 2.x | Version control |

### Optional Tools

- **Drizzle Studio**: Database GUI
- **Postman/Insomnia**: API testing
- **VS Code**: Recommended IDE with TypeScript support

### Required Accounts

- **AWS Account**: For S3 storage (free tier sufficient for development)
- **OpenAI API Key**: For AI generation (or Anthropic for Claude)
- **Resend Account**: For email (optional, for email features)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/steno.git
cd steno
```

### 2. Install Dependencies

```bash
npm install
```

This installs all dependencies defined in `package.json`:
- Next.js framework
- React and UI libraries
- Database tools (Drizzle ORM)
- AI SDK (Vercel AI SDK)
- And more...

**Expected time**: 2-5 minutes depending on connection speed

### 3. Set Up Environment Variables

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/steno_dev"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"

# AI Service (choose one)
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# AWS S3
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="steno-dev-documents"
AWS_REGION="us-east-1"

# WebSocket URL (for local dev)
NEXT_PUBLIC_WS_URL="ws://localhost:3000"

# Email (optional)
RESEND_API_KEY="re_..."

# Export configuration (optional)
EXPORT_UPLOAD_TO_S3="true" # Set to false to skip S3 upload during export
```

**Security Note**: Never commit `.env` file to version control

### 4. Set Up Database

#### Option A: Docker (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: steno_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start database:

```bash
docker-compose up -d
```

#### Option B: Local PostgreSQL

Install PostgreSQL 15+ for your platform, then create database:

```bash
psql -U postgres
CREATE DATABASE steno_dev;
\q
```

### 5. Run Database Migrations

Push schema to database:

```bash
npm run db:push
```

This creates all tables defined in `lib/db/schema.ts`.

**Expected output**:
```
✓ Created tables: users, firms, projects, drafts, templates...
✓ Applied indexes
✓ Schema synchronized
```

### 6. Seed Database (Optional)

Load sample data for development:

```bash
npm run db:seed
```

This creates:
- Sample firm
- Admin user (admin@example.com / password123)
- Sample templates
- Test projects

**Note**: Seeding is optional but recommended for testing

### 7. Verify AWS S3 Setup

Create S3 bucket:

```bash
aws s3 mb s3://steno-dev-documents --region us-east-1
```

Configure CORS:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "POST", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

Apply CORS:

```bash
aws s3api put-bucket-cors \
  --bucket steno-dev-documents \
  --cors-configuration file://cors.json
```

### 8. Start Development Server

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- WebSocket:    ws://localhost:3000

✓ Compiled successfully
```

### 9. Verify Installation

1. Open http://localhost:3000
2. Log in with seeded credentials (if seeded):
   - Email: admin@example.com
   - Password: password123
3. Create test project
4. Upload sample document
5. Generate draft
6. Verify AI generation works

---

## Development Commands

### Common Commands

```bash
# Start dev server (includes hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format

# Type check
npm run type-check
```

### Database Commands

```bash
# Push schema changes to database
npm run db:push

# Generate Drizzle types
npm run db:generate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Run database seed
npm run db:seed

# Drop all tables (caution!)
npm run db:drop
```

### Custom Scripts

```bash
# Apply export migration (if needed)
npm run migrate:export

# Test export functionality
npm run test:export
```

---

## Project Structure

```
steno/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/           # Main application
│   │   ├── projects/
│   │   ├── templates/
│   │   └── admin/
│   └── api/                 # API routes
│       ├── auth/
│       ├── projects/
│       ├── ai/
│       ├── drafts/
│       └── admin/
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── editor/             # Rich text editor
│   ├── projects/           # Project components
│   └── templates/          # Template components
├── lib/                    # Core libraries
│   ├── services/           # Business logic
│   │   ├── ai.service.ts
│   │   ├── auth.service.ts
│   │   ├── export.service.ts
│   │   └── storage.service.ts
│   ├── db/                 # Database
│   │   ├── schema.ts       # Drizzle schema
│   │   └── client.ts       # Database client
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── utils/              # Utility functions
│   └── errors.ts           # Error classes
├── docs/                   # Documentation
├── drizzle/                # Migration files
├── public/                 # Static assets
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── next.config.ts          # Next.js config
└── tailwind.config.ts      # Tailwind CSS config
```

---

## Technology Stack

### Frontend

- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript 5**: Type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Accessible component library
- **Lexical**: Rich text editor
- **Yjs**: Real-time collaboration (CRDT)
- **Zustand**: State management
- **TanStack Query**: Server state caching

### Backend

- **Next.js API Routes**: API endpoints
- **Express**: Custom WebSocket server
- **Drizzle ORM**: Database ORM
- **PostgreSQL**: Primary database
- **JWT**: Authentication
- **bcrypt**: Password hashing

### AI Integration

- **Vercel AI SDK**: Model-agnostic AI interface
- **OpenAI GPT-4.1-mini**: AI model
- **Server-Sent Events (SSE)**: Streaming responses

### File Storage

- **AWS S3**: Document storage
- **AWS SDK v3**: S3 client
- **Presigned URLs**: Secure file access

### DevOps

- **Docker**: Database containerization
- **GitHub Actions**: CI/CD (when configured)
- **Vitest**: Frontend testing
- **Jest**: Backend testing

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/steno` |
| `JWT_SECRET` | Secret for access tokens | `generated-secret-key` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `generated-secret-key` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `...` |
| `S3_BUCKET_NAME` | S3 bucket for documents | `steno-documents` |
| `AWS_REGION` | AWS region | `us-east-1` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key (alternative to OpenAI) | - |
| `RESEND_API_KEY` | Email service API key | - |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for client | `ws://localhost:3000` |
| `EXPORT_UPLOAD_TO_S3` | Upload exports to S3 | `true` |
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |

---

## Troubleshooting

### Database Connection Fails

**Error**: `ECONNREFUSED` or `Connection refused`

**Solutions:**
- Verify PostgreSQL is running: `docker ps` or `pg_isready`
- Check DATABASE_URL is correct
- Ensure port 5432 is not in use
- Test connection: `psql -U postgres -h localhost`

### npm install Fails

**Error**: Dependency resolution errors

**Solutions:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Reinstall: `npm install`
- Check Node.js version: `node --version` (should be 20.x)

### Database Migration Fails

**Error**: Schema push fails

**Solutions:**
- Check database is running
- Verify DATABASE_URL is correct
- Drop and recreate database: `npm run db:drop && npm run db:push`
- Check schema.ts for syntax errors

### AI Generation Fails

**Error**: API key invalid or rate limited

**Solutions:**
- Verify OPENAI_API_KEY is correct
- Check API key has credits
- Try with test prompt: `curl -H "Authorization: Bearer $OPENAI_API_KEY" ...`
- Switch to Anthropic if available

### S3 Upload Fails

**Error**: Access denied or bucket not found

**Solutions:**
- Verify AWS credentials: `aws sts get-caller-identity`
- Check bucket exists: `aws s3 ls`
- Verify IAM permissions (s3:PutObject, s3:GetObject)
- Check bucket region matches AWS_REGION

### WebSocket Connection Fails

**Error**: WebSocket connection refused

**Solutions:**
- Verify dev server is running
- Check NEXT_PUBLIC_WS_URL is correct
- Try refreshing browser
- Check browser console for errors
- Verify firewall isn't blocking WebSocket

### TypeScript Errors

**Error**: Type errors during development

**Solutions:**
- Run type check: `npm run type-check`
- Restart TypeScript server in IDE
- Clear build cache: `rm -rf .next`
- Verify `tsconfig.json` is correct

---

## IDE Setup

### VS Code (Recommended)

**Recommended Extensions:**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### JetBrains WebStorm

1. Enable TypeScript support
2. Configure Prettier as code formatter
3. Enable ESLint
4. Set Node.js interpreter to v20

---

## Testing Setup

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Test File Naming**: `*.test.ts` or `*.test.tsx`

### Integration Tests (Jest)

```bash
# Run integration tests
npm run test:integration

# Specific test file
npm run test lib/services/__tests__/ai.service.test.ts
```

### Writing Tests

**Example unit test:**

```typescript
// components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

**Example service test:**

```typescript
// lib/services/__tests__/export.service.test.ts
import { exportDraft } from '../export.service';

describe('Export Service', () => {
  it('exports draft to docx', async () => {
    const result = await exportDraft({
      draftId: 'test-id',
      userId: 'user-id',
      format: 'docx',
    });
    expect(result.fileName).toContain('.docx');
  });
});
```

---

## Next Steps

Now that you have a working development environment:

1. **Explore Codebase**: Review [Architecture Overview](./architecture-overview.md)
2. **Review API**: Check [API Reference](./api-reference.md)
3. **Write Code**: Follow coding standards in architecture.md
4. **Test Features**: Try creating projects, uploading docs, generating drafts
5. **Make Changes**: Implement features, fix bugs, improve performance

---

## Getting Help

**Developer Resources:**
- [Architecture Documentation](./architecture-overview.md)
- [API Reference](./api-reference.md)
- [Contributing Guide](../../CONTRIBUTING.md) (if available)

**Support:**
- GitHub Issues: For bugs and feature requests
- Email: dev-support@steno.com
- Slack: #steno-dev (if available)

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create route file: `app/api/[resource]/route.ts`
2. Implement handler:
   ```typescript
   export async function GET(request: NextRequest) {
     // Handler logic
   }
   ```
3. Add validation with Zod
4. Add tests in `__tests__` directory
5. Update API documentation

### Adding a New Component

1. Create component file: `components/[feature]/[name].tsx`
2. Use TypeScript for props
3. Follow shadcn/ui patterns
4. Add tests
5. Export from index.ts

### Adding a New Database Table

1. Update `lib/db/schema.ts`
2. Run `npm run db:push`
3. Update TypeScript types
4. Add migrations if needed
5. Update seed data

### Making a Pull Request

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests: `npm run test`
4. Lint code: `npm run lint`
5. Commit changes
6. Push and create PR

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Lexical Documentation](https://lexical.dev/)
- [Yjs Documentation](https://docs.yjs.dev/)
