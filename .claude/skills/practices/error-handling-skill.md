# Error Handling Skill

## API Routes

### Standard try/catch pattern
```typescript
export async function GET() {
  try {
    const { data, error } = await supabase.from('tasks').select('*')
    if (error) throw error
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('GET /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Status codes — use the right one
```typescript
// 400 — invalid client input
if (!title || title.trim() === '') {
  return NextResponse.json({ error: 'Title is required' }, { status: 400 })
}

// 401 — unauthenticated
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// 404 — resource not found
if (!data) {
  return NextResponse.json({ error: 'Task not found' }, { status: 404 })
}

// 500 — unexpected server error (catch block)
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
```

## Client Components

### Optimistic UI with rollback
```typescript
const handleToggle = async (task: Task) => {
  const previousTasks = tasks                               // 1. Save snapshot

  setTasks(prev => prev.map(t =>                           // 2. Update optimistically
    t.id === task.id ? { ...t, completed: !t.completed } : t
  ))

  try {
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, completed: !task.completed }),
    })
    if (!res.ok) throw new Error('Update failed')
  } catch {
    setTasks(previousTasks)                                 // 3. Rollback on failure
    setError('Failed to update task. Please try again.')
  }
}
```

### Error state in UI — never use alert()
```typescript
const [error, setError] = useState<string | null>(null)

// Show dismissible error banner
{error && (
  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-700">{error}</p>
    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
  </div>
)}
```

### Loading state pattern
```typescript
const [loading, setLoading] = useState(true)
const [submitting, setSubmitting] = useState(false)

// Show spinner while loading
{loading ? (
  <div className="text-center py-12">
    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
  </div>
) : (
  <TaskList tasks={tasks} />
)}
```

## Rules
- NEVER use `alert()` for errors — use error state + UI component
- ALWAYS log errors server-side with context: `console.error('[route]:', error)`
- ALWAYS show user-friendly messages, never raw error details or stack traces
- NEVER send DB error details to the client
- ALWAYS implement rollback for optimistic UI updates
- Use `finally` to reset loading states regardless of success or failure

## Testing Checklist
- [ ] All API routes wrapped in try/catch
- [ ] Optimistic updates have rollback on failure
- [ ] Error messages displayed in UI (not alert)
- [ ] Server errors logged with route context
- [ ] Loading states reset in finally blocks
- [ ] No raw error details exposed to client
