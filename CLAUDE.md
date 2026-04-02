# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A fullstack task management application (Next.js 16 / React 19 / TypeScript / Supabase / Tailwind CSS 4). Deployed at https://task-manager-fullstack-eight.vercel.app/

The React Compiler (`reactCompiler: true` in `next.config.ts`) is enabled — manual `useMemo`/`useCallback` optimizations are unnecessary and should be avoided.

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
/register   →  registration UI        (app/register/page.tsx)
/dashboard  →  task manager UI        (app/dashboard/page.tsx + DashboardClient.tsx)
```

The middleware (`proxy.ts` at the project root) protects `/dashboard/:path*` and `/api/:path*`, redirecting unauthenticated requests to `/login`.

> **Known bug:** Next.js only auto-loads middleware from a file named `middleware.ts`. The current file is `proxy.ts` — **auth protection is not active** until this file is renamed to `middleware.ts`.

### Data Flow

The dashboard is split into a Server Component (`app/dashboard/page.tsx`) that checks the session server-side via `auth()` and redirects to `/login` if unauthenticated, and a Client Component (`app/dashboard/DashboardClient.tsx`) that owns all task state. The page fetches data from Next.js API routes, which call Supabase directly. There is no separate state management library.

```
app/dashboard/page.tsx (Server)  →  DashboardClient.tsx (Client)  →  fetch('/api/tasks')  →  app/api/tasks/route.ts  →  Supabase
```

### Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout — wraps all pages with `SessionProvider`; sets `lang="es"` |
| `app/page.tsx` | Root route — server redirect to `/dashboard` |
| `app/dashboard/page.tsx` | Server Component — checks session via `auth()`, redirects to `/login`, renders `DashboardClient` |
| `app/dashboard/DashboardClient.tsx` | Client Component — task list, form, stats; receives `session` as prop |
| `app/login/page.tsx` | Login page — Credentials form + Google OAuth button |
| `app/register/page.tsx` | Registration page — name/email/password form; POSTs to `/api/register` |
| `proxy.ts` | Auth middleware — **must be renamed `middleware.ts`** to take effect in Next.js |
| `app/api/tasks/route.ts` | All CRUD handlers: GET, POST, PUT, DELETE |
| `app/api/register/route.ts` | POST — creates a new Credentials user via `createUser` from `lib/auth-utils.ts` |
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

Tasks — `app/api/tasks/route.ts`:

| Method | Purpose | Key validation |
|--------|---------|----------------|
| GET | Fetch all tasks (ordered `created_at DESC`) | — |
| POST | Create task | `title` required, trimmed |
| PUT | Toggle `completed` by `id` | `id` required, `completed` must be boolean |
| DELETE | Delete task by `id` | `id` required |

Registration — `app/api/register/route.ts`:

| Method | Purpose | Key validation |
|--------|---------|----------------|
| POST | Create new Credentials user | `name` required, `email` required, `password` ≥ 8 chars; returns 409 if email already registered |

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
- `data-testid` attributes on the **dashboard**: `welcome-message`, `signout-button`, `task-input`, `add-task-button`, `task-item`, `task-checkbox`, `task-delete`, `stats-total`, `stats-completed`, `stats-pending`
- `data-testid` attributes on the **login page**: `email-input`, `password-input`, `signin-button`, `error-message`, `success-message`, `google-signin-button`
- `data-testid` attributes on the **register page**: `name-input`, `email-input`, `password-input`, `confirm-password-input`, `register-button`, `error-message`
- Dashboard shows the signed-in user's name/email and a "Cerrar sesión" button that calls `signOut({ callbackUrl: '/login' })`
- After successful registration, the register page redirects to `/login?registered=true`; the login page detects `?registered=true` and shows a `success-message`

---

## Testing Policy

**After every code change, tests must be reviewed and updated before the work is considered done.**

### What to check on every change

| Type of change | Action required |
|---|---|
| New API route or handler | Add unit test in `__tests__/api/` covering success, 400, 401, 409, and 500 cases as applicable |
| New utility function (`lib/`) | Add unit test in `__tests__/lib/` |
| Change to existing API behavior (new field, new validation, new query scope) | Update existing unit tests to match; verify mocked chains still reflect the real call sequence |
| New page or protected route | Add E2E test; add redirect-without-session case to `e2e/auth.spec.ts` if applicable |
| Change to auth flow or session handling | Update `e2e/global-setup.ts` and `e2e/auth.spec.ts` as needed |
| Change to UI visible to Playwright selectors | Update affected E2E specs |
| Dependency or env var added | Verify tests still pass; update mock targets if the imported module changed |

### Required checks before finishing any task

```bash
npm run build                                   # Must pass with no TypeScript errors
npm run test:unit                               # All unit tests must pass
npx playwright test --project=chromium          # Chromium is the authoritative E2E target (49/49)
npm run test:e2e                                # Full suite — expect WebKit/Mobile Safari flakiness (see below)
```

> **E2E target browser:** E2E tests are optimised for **Chromium**, which always passes 100%. Run `npx playwright test --project=chromium` as the definitive pass/fail check. WebKit and Mobile Safari share a known intermittent failure mode (see below) that is not a code bug.

**Known flaky E2E tests** (WebKit/Mobile Safari environment issues, not code bugs):
- `[webkit] / [Mobile Safari]` — `auth.spec.ts` ("credenciales inválidas"), `register.spec.ts` (validation-error and success tests), and `tasks.spec.ts` (core-operations tests) intermittently fail. Root cause: Playwright's form-submission simulation — both `button.click()` and `press("Enter")` — does not always trigger React's `onSubmit` handler in WebKit. `tasks.spec.ts` is affected because it logs in explicitly via UI before each test (`loginAsUser`). **Chromium and Firefox are stable.**
- `[Mobile Safari] / [firefox]` `ui.spec.ts` — hover test is skipped (2 expected skips); "disable buttons while submitting" is an intermittent timing race unrelated to auth.

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

If component tests are added (`__tests__/components/`), use `@testing-library/react` + `happy-dom` + `@testing-library/jest-dom`. Because `app/dashboard/page.tsx` is a monolithic component, define **minimal inline components** mirroring the relevant JSX rather than importing from the page directly. `msw` is available as a devDependency for fetch mocking.

### E2E Tests (`e2e/`)

**Auth setup:** `e2e/global-setup.ts` runs once before all tests — it upserts the E2E test user into Supabase and saves the browser session to `e2e/.auth/user.json`. Most spec files inherit this session via `storageState` in `playwright.config.ts`.

**Unauthenticated tests** (`e2e/auth.spec.ts`) override `storageState` with an empty state to test route protection without a session.

**`tasks.spec.ts`** also overrides `storageState` to empty and calls `loginAsUser()` in `beforeEach`, performing an explicit UI login before every task test to demonstrate that tasks are scoped to the authenticated user. It uses `afterEach` to sign out (best-effort, short timeout).

**DB cleanup:** `e2e/helpers/db-cleanup.ts` deletes only the test user's tasks (filtered by `user_id`) before each test. `cleanupRegisterUser()` in the same file removes the registration test user between register-flow tests. Credentials live in `e2e/helpers/test-constants.ts`.

**Auth helpers** (`e2e/helpers/auth-helper.ts`):
- `loginAsUser(page, email, password)` — navigates to `/login`, fills credentials, submits with `press("Enter")`, polls until `/dashboard` is reached.
- `registerUser(page, name, email, password)` — navigates to `/register`, fills the form, submits with `press("Enter")`, polls until `/login` is reached.
- Both use `expect(page).toHaveURL()` (polling) instead of `waitForURL()` (event-based) for better cross-browser reliability.

**Env vars:** `playwright.config.ts` loads `.env.test` first, then `.env.local` with `override: true`. Locally `.env.local` wins (same as the running dev server); in CI only `.env.test` exists. This ensures global-setup and the server always target the same Supabase project.

Most spec files import `test` and `expect` from `./fixtures`. Exception: `tasks.spec.ts` and `auth.spec.ts` import directly from `@playwright/test` because they need to override `storageState` per describe-block. E2E tests run with `workers: 1` (sequential) to avoid race conditions on the shared DB.

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
