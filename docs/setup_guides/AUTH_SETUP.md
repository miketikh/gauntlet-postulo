# Steno Authentication Setup

This document describes the complete authentication flow implementation for the Steno Demand Letter Generator.

## What Was Built

### 1. Dependencies Added
- `zustand` - Client-side state management
- `@tanstack/react-query` - Server state caching (ready for future use)
- `axios` - HTTP client
- `react-hook-form` - Form management
- `@hookform/resolvers` - Zod integration for forms
- `@radix-ui/react-label` - Accessible label primitive
- `@radix-ui/react-slot` - Slot primitive for composition
- `@radix-ui/react-select` - Select dropdown component
- `jose` - JWT verification for middleware

### 2. Auth Store (Zustand)
**File:** `/lib/stores/auth.store.ts`
- Stores user, accessToken, refreshToken, isAuthenticated
- Persists to localStorage (key: 'steno-auth')
- Actions: login, logout, setUser, setAccessToken

### 3. Auth Hooks
**File:** `/lib/hooks/use-auth.ts`
- Convenient hook to access auth store
- Returns user, tokens, auth state, and actions

### 4. API Client (Axios)
**File:** `/lib/api/client.ts`
- Auto-attaches JWT token to requests
- Intercepts 401 responses
- Attempts token refresh on 401
- Redirects to /login if refresh fails
- Type-safe error handling utilities

### 5. shadcn/ui Components
**Files:** `/components/ui/*.tsx`
- Button
- Input
- Label
- Card (with Header, Title, Description, Content, Footer)
- Form (with Field, Item, Label, Control, Message, Description)
- Select (with Trigger, Content, Item, etc.)

### 6. Auth Layout
**File:** `/app/(auth)/layout.tsx`
- Centered card design
- Professional legal branding (Scale icon + Steno logo)
- Gradient background
- Responsive layout

### 7. Login Page
**File:** `/app/(auth)/login/page.tsx`
- React Hook Form with Zod validation
- Email + password fields
- Calls `/api/auth/login`
- Stores tokens in both localStorage and cookies
- Redirects to `/dashboard` on success
- Shows inline errors

### 8. Signup Page
**File:** `/app/(auth)/signup/page.tsx`
- React Hook Form with Zod validation
- Fields: email, password, firstName, lastName, firmId
- Fetches firms from `/api/firms`
- Password requirements: 8+ chars, 1 uppercase, 1 number
- Calls `/api/auth/register`
- Shows success message
- Redirects to `/login` after 2 seconds

### 9. Firms API Endpoint
**File:** `/app/api/firms/route.ts`
- Public endpoint to list all firms
- Used by signup form dropdown

### 10. Dashboard Layout
**File:** `/app/(dashboard)/layout.tsx`
- Top navigation bar with logo and user menu
- Sidebar navigation with links:
  - Dashboard
  - Projects
  - Templates
  - Settings
- Logout button (clears localStorage and cookies)
- Shows user name and role
- Protected - requires authentication

### 11. Dashboard Home Page
**File:** `/app/(dashboard)/page.tsx`
- Welcome message with user's first name
- Stats cards (projects, drafts, templates)
- Empty state with CTA
- Quick actions section
- Recent activity section

### 12. Placeholder Pages
**Files:**
- `/app/(dashboard)/projects/page.tsx`
- `/app/(dashboard)/templates/page.tsx`
- Simple "Coming Soon" messages

### 13. Route Protection Middleware
**File:** `/middleware.ts`
- Protects `/dashboard` routes - redirects to `/login` if not authenticated
- Redirects `/login` and `/signup` to `/dashboard` if already authenticated
- Verifies JWT token using `jose` library
- Uses cookies for SSR compatibility
- Public routes: `/api/auth/*`, `/api/firms`

### 14. Root Page
**File:** `/app/page.tsx`
- Redirects to `/login`

## Installation & Setup

### 1. Install Dependencies
```bash
# There's a known issue with npm on Node v24
# Try one of these approaches:

# Option 1: Use a different Node version (recommended)
nvm use 20
npm install

# Option 2: Delete node_modules and package-lock.json, then reinstall
rm -rf node_modules package-lock.json
npm install

# Option 3: Use yarn instead
yarn install
```

### 2. Environment Variables
Make sure `.env` has:
```bash
DATABASE_URL=postgresql://localhost:5432/steno
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
```

### 3. Database Setup
```bash
# Push schema to database
npm run db:push

# Seed with test data (creates firms and users)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

## Testing the Authentication Flow

### Test Credentials
All test users have password: `password123`

**Smith & Associates:**
- `admin@smithlaw.com` (admin)
- `attorney@smithlaw.com` (attorney)
- `paralegal@smithlaw.com` (paralegal)

**Johnson Legal Group:**
- `admin@johnsonlegal.com` (admin)
- `attorney@johnsonlegal.com` (attorney)
- `paralegal@johnsonlegal.com` (paralegal)

**Davis & Partners:**
- `admin@davislegal.com` (admin)
- `attorney@davislegal.com` (attorney)

### Test Flow

#### 1. Test Unauthenticated Access
1. Navigate to `http://localhost:3000`
   - Should redirect to `/login`
2. Navigate to `http://localhost:3000/dashboard`
   - Should redirect to `/login`

#### 2. Test Login
1. Go to `http://localhost:3000/login`
2. Enter email: `attorney@smithlaw.com`
3. Enter password: `password123`
4. Click "Sign In"
5. Should redirect to `/dashboard`
6. Should see "Welcome back, Sarah" (Sarah Mitchell)
7. Should see user role in header: "(attorney)"

#### 3. Test Dashboard Navigation
1. Click "Projects" in sidebar
   - Should navigate to `/dashboard/projects` (placeholder)
2. Click "Templates" in sidebar
   - Should navigate to `/dashboard/templates` (placeholder)
3. Click "Dashboard" in sidebar
   - Should return to dashboard home

#### 4. Test Logout
1. Click "Logout" button in header
2. Should redirect to `/login`
3. Should clear localStorage (check DevTools > Application > Local Storage)
4. Try accessing `/dashboard` - should redirect to `/login`

#### 5. Test Already Authenticated
1. Login again
2. Try accessing `/login` directly
   - Should redirect to `/dashboard`

#### 6. Test Signup
1. Logout if logged in
2. Go to `http://localhost:3000/signup`
3. Fill in the form:
   - First Name: John
   - Last Name: Test
   - Email: john.test@smithlaw.com
   - Password: Password123 (must have uppercase and number)
   - Law Firm: Select "Smith & Associates Law Firm"
4. Click "Create Account"
5. Should see success message
6. Should redirect to `/login` after 2 seconds
7. Login with the new credentials

#### 7. Test Validation
**Login Page:**
- Try submitting empty form - should show validation errors
- Try invalid email - should show error
- Try wrong password - should show "Invalid email or password"

**Signup Page:**
- Try password without uppercase - should show error
- Try password without number - should show error
- Try password less than 8 chars - should show error
- Try duplicate email - should show "Email already registered"
- Try without selecting firm - should show "Please select a firm"

## Architecture Notes

### Token Storage
- **localStorage:** Stores tokens for client-side API calls
- **Cookies:** Stores accessToken for middleware (SSR compatibility)
- **Cookie expires:** 15 minutes (matches JWT access token expiry)

### Token Refresh
- API client intercepts 401 responses
- Attempts to refresh using refreshToken
- If refresh succeeds, retries original request
- If refresh fails, logs user out and redirects to /login

### Route Protection
- **Middleware:** SSR protection using cookies
- **Dashboard Layout:** Client-side check using Zustand store
- **Double layer:** Both middleware and layout check auth state

### Firm Isolation
- Each user belongs to a firm (firmId in JWT payload)
- Future API endpoints will filter by firmId
- Multi-tenant architecture ready

### Type Safety
- All forms use Zod validation
- Matches backend validation schemas
- Type inference from Zod schemas
- API client has type-safe error handling

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   └── layout.tsx              # Auth layout (centered card)
├── (dashboard)/
│   ├── layout.tsx              # Dashboard layout (nav + sidebar)
│   ├── page.tsx                # Dashboard home
│   ├── projects/page.tsx       # Projects (placeholder)
│   └── templates/page.tsx      # Templates (placeholder)
├── api/
│   ├── auth/                   # Auth endpoints (existing)
│   └── firms/route.ts          # List firms endpoint (new)
└── page.tsx                    # Root redirect to /login

components/ui/
├── button.tsx
├── card.tsx
├── form.tsx
├── input.tsx
├── label.tsx
└── select.tsx

lib/
├── api/
│   └── client.ts               # Axios instance with interceptors
├── hooks/
│   └── use-auth.ts             # Auth hook
└── stores/
    └── auth.store.ts           # Zustand auth store

middleware.ts                   # Route protection
```

## Next Steps

### Immediate (User Action Required)
1. Run `npm install` to install new dependencies
2. Test the authentication flow using the steps above
3. Verify all routes work correctly

### Future Development
1. Add settings page
2. Implement project creation
3. Implement template management
4. Add password reset functionality
5. Add email verification
6. Switch to httpOnly cookies (requires server-side token setting)
7. Add refresh token rotation
8. Add session management

## Known Issues

1. **npm install error on Node v24:** There's a bug in npm with Node 24.11.0. Use Node 20 or yarn instead.
2. **Middleware uses cookies:** For production, implement httpOnly cookies set by API endpoints.
3. **No password reset:** Users cannot reset forgotten passwords yet.
4. **No email verification:** Email addresses are not verified.

## Security Notes

- JWT tokens stored in localStorage (POC - use httpOnly cookies in production)
- Passwords hashed with bcrypt (cost factor 10)
- CSRF protection needed for production
- Rate limiting needed for auth endpoints
- Consider adding 2FA in future
