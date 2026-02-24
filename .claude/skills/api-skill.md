# API Routes Skill - Next.js 15

## When creating API routes, ALWAYS:

### Input Validation
Use Zod for type-safe validation:
```typescript
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  completed: z.boolean().optional()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = taskSchema.parse(body)
    // Continue...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
  }
}
```

### Error Handling Pattern
```typescript
try {
  // Logic here
} catch (error) {
  console.error('API Error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### Authentication Check
ALWAYS check auth first in protected routes:
```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Database Queries with User Filtering
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', session.user.id)  // CRITICAL: Filter by user
```
