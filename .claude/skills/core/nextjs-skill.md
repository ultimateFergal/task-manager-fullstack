# Next.js 15 Skill - App Router

> Always verify patterns with Context7 before implementing: `context7 fetch nextjs.org/llms.txt`

## Server vs Client Components

### Decision rule
- **Default to Server Components** — no `'use client'` unless needed
- Add `'use client'` only when using: `useState`, `useEffect`, event handlers, browser APIs

```typescript
// Server Component (default) — fetches data, no interactivity
export default async function TaskList() {
  const tasks = await getTasks()
  return <ul>{tasks.map(t => <li key={t.id}>{t.title}</li>)}</ul>
}

// Client Component — needs state or events
'use client'
export default function AddTaskForm() {
  const [title, setTitle] = useState('')
  // ...
}
```

## API Routes

### File structure
```
app/api/tasks/route.ts          → /api/tasks
app/api/tasks/[id]/route.ts     → /api/tasks/:id
```

### Route handler pattern
```typescript
import { NextResponse } from 'next/server'

/** GET /api/tasks - Returns all tasks */
export async function GET() {
  return NextResponse.json(data, { status: 200 })
}

/** POST /api/tasks - Creates a new task */
export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json(data, { status: 201 })
}
```

### Dynamic routes
```typescript
// app/api/tasks/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
}
```

## Data Fetching

### In Server Components (preferred for initial data)
```typescript
export default async function Page() {
  const res = await fetch('https://...', {
    cache: 'no-store',        // Always fresh
    next: { revalidate: 60 } // ISR: revalidate every 60s
  })
  const data = await res.json()
  return <div>{data.title}</div>
}
```

### In Client Components
```typescript
'use client'
useEffect(() => {
  fetch('/api/tasks')
    .then(r => r.json())
    .then(setTasks)
    .finally(() => setLoading(false))
}, [])
```

## Metadata
```typescript
// Static
export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'Manage your tasks efficiently',
}

// Dynamic
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: `Task ${params.id}` }
}
```

## Middleware (route protection)
```typescript
// middleware.ts (root of project)
export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/dashboard/:path*', '/api/tasks/:path*']
}
```

## Environment Variables
- `NEXT_PUBLIC_*` — exposed to browser (public values only, never secrets)
- No prefix — server-only (API keys, secrets, DB URLs)

## Testing Checklist
- [ ] Server Components render without `'use client'`
- [ ] Client Components have `'use client'` directive at top
- [ ] API routes return correct HTTP status codes
- [ ] No secrets in `NEXT_PUBLIC_` variables
- [ ] Build passes without errors: `npm run build`
- [ ] No hydration mismatches in browser console
