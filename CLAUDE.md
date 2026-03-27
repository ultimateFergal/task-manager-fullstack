# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A fullstack task management application (Next.js 16 / React 19 / TypeScript / Supabase / Tailwind CSS 4). Deployed at https://task-manager-fullstack-eight.vercel.app/

---

## Commands

```bash
npm run dev                  # Start dev server
npm run build                # TypeScript check + production build
npm run lint                 # ESLint

# Unit/integration tests (Vitest)
npm run test:unit            # Run once
npm run test:unit:watch      # Watch mode
npm run test:unit:ui         # Interactive Vitest UI
npm run test:unit:coverage   # Coverage report (80% threshold)

# E2E tests (Playwright)
npm run test:e2e             # Run all E2E tests (headless)
npm run test:e2e:ui          # Interactive Playwright UI
npm run test:e2e:headed      # Visible browser
npm run test:e2e:debug       # Playwright Inspector
npx playwright show-report   # View HTML report

npm test                     # test:unit + test:e2e
```

To run a single unit test file:
```bash
npx vitest run __tests__/api/tasks-get.test.ts
```

To run a single E2E spec:
```bash
npx playwright test e2e/tasks.spec.ts
```

---

## Architecture

### Routing Structure

```
/           →  redirects to /dashboard  (app/page.tsx)
/login      →  login UI               (app/login/page.tsx)
/dashboard  →  task manager UI        (app/dashboard/page.tsx)
```

The middleware (`proxy.ts` at the project root) protects `/dashboard/:path*` and `/api/:path*`, redirecting unauthenticated requests to `/login`. **Important:** Next.js middleware must be named `middleware.ts` — `proxy.ts` is the current filename but will not be auto-loaded unless renamed.

### Data Flow

All task state lives in the dashboard component (`app/dashboard/page.tsx`). The page fetches data from Next.js API routes, which call Supabase directly. There is no separate state management library.

```
app/dashboard/page.tsx  →  fetch('/api/tasks')  →  app/api/tasks/route.ts  →  Supabase
```

### Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Root route — server redirect to `/dashboard` |
| `app/dashboard/page.tsx` | Entire task UI — list, form, stats (single "use client" component) |
| `app/login/page.tsx` | Login page — Credentials form + Google OAuth button |
| `proxy.ts` | Auth middleware — protects `/dashboard` and `/api`, redirects to `/login` (must be renamed `middleware.ts` to take effect in Next.js) |
| `app/api/tasks/route.ts` | All CRUD handlers: GET, POST, PUT, DELETE |
| `lib/supabase.ts` | Supabase anon client + exported `Task` type (for client-side use) |
| `lib/supabase-server.ts` | Supabase admin client (service_role key, bypasses RLS — server-side only) |
| `lib/auth.ts` | NextAuth.js v5 config: Google OAuth + Credentials providers, JWT sessions |
| `lib/auth-utils.ts` | `validateCredentials`, `createUser`, `upsertOAuthUser` — hit Supabase `users` table with bcryptjs |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth.js catch-all route handler |

### `Task` Type

Defined and exported from `lib/supabase.ts`:
```typescript
export type Task = {
  id: string
  title: string
  completed: boolean
  created_at: string
  user_id: string
}
```

Import it with: `import type { Task } from '@/lib/supabase'`

### `@` Alias

`@` resolves to the **project root** (not `src/`). Configured in both `tsconfig.json` and `vitest.config.ts`.

### API Routes

All in one file — `app/api/tasks/route.ts`:

| Method | Purpose | Key validation |
|--------|---------|----------------|
| GET | Fetch all tasks (ordered `created_at DESC`) | — |
| POST | Create task | `title` required, trimmed |
| PUT | Toggle `completed` by `id` | `id` required, `completed` must be boolean |
| DELETE | Delete task by `id` | `id` required |

The entire app is in **Spanish** — UI text, inline comments, and API error messages (e.g., `'El título es requerido'`). Match this convention throughout.

### Auth Architecture

Authentication uses **NextAuth.js v5** (configured in `lib/auth.ts`) with two providers:
- **Google OAuth** — reads `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` automatically
- **Credentials** — email/password validated against the Supabase `users` table via `lib/auth-utils.ts` (bcryptjs, `supabaseAdmin`)

Sessions use the JWT strategy (required when using the Credentials provider). The JWT `sub` field carries the user ID and is exposed as `session.user.id`. Sign-in page is at `/login`; auth errors also redirect there.

#### OAuth user ID mapping

Google OAuth returns a numeric string as `user.id` (e.g. `"1029384756"`), not a UUID. Since `tasks.user_id` is a `uuid` column, inserting a Google ID directly causes a Supabase type error (500). To fix this, the `jwt` callback in `lib/auth.ts` detects `account.provider === "google"` and calls `upsertOAuthUser(email, name)` from `lib/auth-utils.ts`, which does an `INSERT ... ON CONFLICT (email) DO UPDATE` on the `users` table and returns the internal UUID. That UUID is stored as `token.sub`, so `session.user.id` is always a valid UUID regardless of provider. This mapping only runs on the first sign-in (when `user` is present in the token callback).

Two Supabase clients exist for different contexts:
- `supabase` (from `lib/supabase.ts`) — anon key, for client-side use and existing API routes
- `supabaseAdmin` (from `lib/supabase-server.ts`) — service_role key, bypasses RLS; **only import in server-side code** (API routes, auth-utils); never expose to the client or `NEXT_PUBLIC_` variables

### UI Patterns

- Tasks are ordered newest-first (matching the API's `created_at DESC` ordering)
- Optimistic UI for toggle and delete in `app/dashboard/page.tsx`: update state immediately, rollback with `alert()` on failure
- `data-testid` attributes used by Playwright: `task-input`, `add-task-button`, `task-item`, `task-checkbox`, `task-delete`, `stats-total`, `stats-completed`, `stats-pending`
- Dashboard shows the signed-in user's name/email and a "Cerrar sesión" button that calls `signOut({ callbackUrl: '/login' })`

---

## Testing Policy

**After every code change, tests must be reviewed and updated before the work is considered done.**

### What to check on every change

| Type of change | Action required |
|---|---|
| New API route or handler | Add unit test in `__tests__/api/` covering success, 400, 401, and 500 cases |
| New utility function (`lib/`) | Add unit test in `__tests__/lib/` |
| Change to existing API behavior (new field, new validation, new query scope) | Update existing unit tests to match; verify mocked chains still reflect the real call sequence |
| New page or protected route | Add E2E test; add redirect-without-session case to `e2e/auth.spec.ts` if applicable |
| Change to auth flow or session handling | Update `e2e/global-setup.ts` and `e2e/auth.spec.ts` as needed |
| Change to UI visible to Playwright selectors | Update affected E2E specs |
| Dependency or env var added | Verify tests still pass; update mock targets if the imported module changed |

### Required checks before finishing any task

```bash
npm run build          # Must pass with no TypeScript errors
npm run test:unit      # All unit tests must pass
npm run test:e2e       # All E2E tests must pass (2 mobile-hover skips are expected)
```

If an existing test breaks due to a legitimate change (e.g. a mock targets the old client), **fix the test — do not delete it or skip it**.

---

## Testing Architecture

### Unit/Integration Tests (`__tests__/`)

API route tests mock **both** `@/lib/supabase-server` (the admin client) and `@/lib/auth` (the session). Pattern:

```typescript
import type { Session } from 'next-auth'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

const mockOrder = vi.fn()
vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: mockOrder })) }))
    }))
  }
}))

// In each test — set the session before calling the handler:
vi.mocked((await import('@/lib/auth')).auth).mockResolvedValue({
  user: { id: 'user-uuid-123', email: 'test@test.com', name: 'Test' },
  expires: '2099-01-01',
} as Session)

// Always add a 401 test for the unauthenticated case:
vi.mocked((await import('@/lib/auth')).auth).mockResolvedValue(null)
const response = await GET()
expect(response.status).toBe(401)
```

Mock the chain depth to match the real query. For example, DELETE now has two `.eq()` calls (`eq('id', ...)` then `eq('user_id', ...)`); the mock must reflect that.

Component tests (`__tests__/components/`) use `@testing-library/react` + `happy-dom` + `@testing-library/jest-dom`. Because `app/page.tsx` is a monolithic component (not split into separate files), component tests define **minimal inline components** that mirror the relevant JSX from the page. Do not import from `app/page.tsx` directly in unit tests. `msw` is also available as a devDependency for fetch mocking when needed.

### E2E Tests (`e2e/`)

**Auth setup:** `e2e/global-setup.ts` runs once before all tests — it upserts the E2E test user into Supabase and saves the browser session to `e2e/.auth/user.json`. All spec files inherit this session via `storageState` in `playwright.config.ts`.

**Unauthenticated tests** (`e2e/auth.spec.ts`) override `storageState` with an empty state to test route protection without a session.

**DB cleanup:** `e2e/helpers/db-cleanup.ts` deletes only the test user's tasks (filtered by `user_id`) before each test. The test user credentials live in `e2e/helpers/test-constants.ts`.

**Env vars:** `playwright.config.ts` loads `.env.test` first, then `.env.local` with `override: true`. Locally `.env.local` wins (same as the running dev server); in CI only `.env.test` exists. This ensures global-setup and the server always target the same Supabase project.

All spec files must import `test` and `expect` from `./fixtures` (not directly from `@playwright/test`). E2E tests run with `workers: 1` (sequential) to avoid race conditions on the shared DB.

---

## Conventions

### TypeScript
- Strict mode; no `any`
- Use `interface` for object shapes, type aliases for unions/primitives
- JSDoc single-line comment above every function and component (explain *what*, not *how*)

### API Response Format
```typescript
return NextResponse.json(data, { status: 200 })          // success
return NextResponse.json({ error: '...' }, { status: 400 }) // error
// DELETE returns: new NextResponse(null, { status: 204 })
```

### Styling
Tailwind CSS only (v4). Dark mode supported via `dark:` variants. No custom CSS beyond `globals.css`.

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://zyuthilumfrtedrceeqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>        # server-side only, used by supabaseAdmin
AUTH_SECRET=<random-string>            # NextAuth.js session signing key
AUTH_GOOGLE_ID=<key>                   # Google OAuth client ID
AUTH_GOOGLE_SECRET=<key>               # Google OAuth client secret
```

Same variables must be set in Vercel dashboard for production/preview deployments.

---

## External Documentation

Before implementing features, use Context7 MCP to fetch current docs:
- Next.js: `context7 fetch nextjs.org/llms.txt`
- Supabase: `context7 fetch supabase.com/llms.txt`
- Tailwind CSS: `context7 fetch tailwindcss.com/llms.txt`

## Skills Reference

Skills in `.claude/skills/` (see `.claude/README.md`):

| Category | Skills |
|----------|--------|
| `core/` | `nextjs-skill`, `tailwind-skill`, `typescript-skill`, `supabase-skill` |
| `features/` | `auth-skill`, `api-skill` |
| `practices/` | `documentation-skill`, `error-handling-skill`, `security-skill` |
| `testing/` | `unit-testing-skill`, `integration-testing-skill`, `e2e-testing-skill`, `testing-conventions-skill` |
