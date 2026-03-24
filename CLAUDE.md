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

### Data Flow

All state lives in the single page component (`app/page.tsx`). The page fetches data from Next.js API routes, which call Supabase directly. There is no separate state management library.

```
app/page.tsx  →  fetch('/api/tasks')  →  app/api/tasks/route.ts  →  Supabase
```

### Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Entire UI — task list, form, stats (single "use client" component) |
| `app/api/tasks/route.ts` | All CRUD handlers: GET, POST, PUT, DELETE |
| `lib/supabase.ts` | Supabase anon client + exported `Task` type (for client-side use) |
| `lib/supabase-server.ts` | Supabase admin client (service_role key, bypasses RLS — server-side only) |
| `lib/auth.ts` | NextAuth.js v5 config: Google OAuth + Credentials providers, JWT sessions |
| `lib/auth-utils.ts` | `validateCredentials` and `createUser` — hit Supabase `users` table with bcryptjs |
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

Two Supabase clients exist for different contexts:
- `supabase` (from `lib/supabase.ts`) — anon key, for client-side use and existing API routes
- `supabaseAdmin` (from `lib/supabase-server.ts`) — service_role key, bypasses RLS; **only import in server-side code** (API routes, auth-utils); never expose to the client or `NEXT_PUBLIC_` variables

### UI Patterns

- Tasks are ordered newest-first (matching the API's `created_at DESC` ordering)
- Optimistic UI for toggle and delete: update state immediately, rollback with `alert()` on failure
- `data-testid` attributes used by Playwright: `task-input`, `add-task-button`, `task-item`, `task-checkbox`, `task-delete`, `stats-total`, `stats-completed`, `stats-pending`

---

## Testing Architecture

### Unit/Integration Tests (`__tests__/`)

API route tests mock Supabase using `vi.mock('@/lib/supabase', ...)` with chained method stubs. Pattern:

```typescript
const mockSomeMethod = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select: mockSomeMethod }))
  }
}))
```

Component tests (`__tests__/components/`) use `@testing-library/react` + `happy-dom` + `@testing-library/jest-dom`. Because `app/page.tsx` is a monolithic component (not split into separate files), component tests define **minimal inline components** that mirror the relevant JSX from the page. Do not import from `app/page.tsx` directly in unit tests. `msw` is also available as a devDependency for fetch mocking when needed.

### E2E Tests (`e2e/`)

Use a custom test fixture in `e2e/fixtures.ts` that auto-cleans the Supabase DB before each test via `e2e/helpers/db-cleanup.ts`. All spec files must import `test` and `expect` from `./fixtures` (not directly from `@playwright/test`).

E2E tests run with `workers: 1` (sequential) to avoid race conditions on the shared Supabase DB.

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
