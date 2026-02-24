# Authentication Skill - NextAuth.js v5

## When implementing authentication, ALWAYS:

### Setup
- Use NextAuth.js v5 (NOT v4 - check with Context7 first)
- Configure in `app/api/auth/[...nextauth]/route.ts`
- Use middleware.ts for route protection
- Store sessions in Supabase (not in-memory for production)

### Security Rules
- NEVER expose auth secrets to client
- NEVER trust client-side session data
- ALWAYS validate session server-side in API routes
- ALWAYS use HTTPS in production

### Code Patterns

**Protecting API Routes:**
```typescript
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Continue with authenticated logic
}
```

**Protecting Pages with Middleware:**
```typescript
export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

**Session in Client Components:**
```typescript
'use client'
import { useSession } from 'next-auth/react'

export default function Component() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Not authenticated</div>

  return <div>Hello {session.user.name}</div>
}
```

### Database Schema Updates
When adding auth, update tasks table:
- Add `user_id uuid REFERENCES auth.users(id)`
- Add index on user_id for performance
- Add RLS (Row Level Security) policies

### Testing Checklist
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can access protected routes
- [ ] Users only see their own data
- [ ] Session persists across page reloads
- [ ] Logout clears session completely
