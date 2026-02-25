# Security Skill

## Environment Variables

```bash
# ✅ Safe — public values only (visible in browser)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ✅ Server-only — never exposed to browser
AUTH_SECRET=super-secret-value
DATABASE_URL=postgres://...

# ❌ NEVER — secrets with NEXT_PUBLIC_ prefix
NEXT_PUBLIC_AUTH_SECRET=exposed!  # Visible to anyone
```

## Input Sanitization

ALWAYS validate and sanitize before touching the database:
```typescript
// Trim and check presence
const title = body.title?.trim()
if (!title) {
  return NextResponse.json({ error: 'Title is required' }, { status: 400 })
}

// Enforce max length
if (title.length > 500) {
  return NextResponse.json({ error: 'Title too long' }, { status: 400 })
}
```

### Use Zod for structured validation
```typescript
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500).trim(),
  completed: z.boolean().optional(),
})

const result = taskSchema.safeParse(body)
if (!result.success) {
  return NextResponse.json({ error: result.error.errors }, { status: 400 })
}
const { title, completed } = result.data
```

## Authentication Checks

ALWAYS verify session before touching protected data:
```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// Safe to access DB from here
```

NEVER trust client-provided user IDs:
```typescript
// ❌ Never — attacker can send any userId
const { userId } = await request.json()

// ✅ Always — verified by the server
const session = await auth()
const userId = session.user.id
```

## XSS Prevention

Next.js JSX escapes values automatically — never bypass it:
```tsx
// ✅ Safe — React escapes user content
<span>{task.title}</span>

// ❌ Never with user content
<span dangerouslySetInnerHTML={{ __html: task.title }} />
```

## Data Access Scoping

ALWAYS scope queries to the authenticated user. Do not rely on RLS alone:
```typescript
// ✅ Defense in depth: app-level filter + RLS
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', session.user.id)  // CRITICAL

// ❌ Missing user filter — leaks all users' data if RLS misconfigured
const { data, error } = await supabase.from('tasks').select('*')
```

## Supabase RLS

Enable RLS as a second defense layer on all tables with user data:
```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own tasks only"
  ON tasks
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Rules Summary
- NEVER put secrets in `NEXT_PUBLIC_` variables
- NEVER trust client-provided user IDs — always use session
- ALWAYS validate and trim user input before DB operations
- ALWAYS check auth before every protected API route
- ALWAYS scope DB queries by `session.user.id`
- NEVER use `dangerouslySetInnerHTML` with user-provided content
- Enable RLS on all tables storing user data

## Testing Checklist
- [ ] No secrets in `NEXT_PUBLIC_` env vars
- [ ] All user input validated and trimmed
- [ ] Auth checked before every protected operation
- [ ] All queries filtered by authenticated user ID
- [ ] RLS enabled and policies verified in Supabase dashboard
- [ ] No `dangerouslySetInnerHTML` with user content
- [ ] `npm run build` passes with no warnings
