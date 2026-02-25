# Task Manager Fullstack - Development Guide

## Project Overview
A fullstack task management application built as a learning project to master the complete development lifecycle from frontend to deployment.

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Version Control:** Git + GitHub

**Live URL:** https://task-manager-fullstack-eight.vercel.app/

---

## Project Structure

```
task-manager-fullstack/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       └── route.ts          # CRUD API endpoints
│   ├── page.tsx                  # Main UI (task list + form)
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Tailwind imports
├── lib/
│   └── supabase.ts              # Supabase client config
├── .env.local                    # Environment variables (local only)
└── CLAUDE.md                     # This file
```

---

## Database Schema

**Table:** `tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated unique ID |
| `title` | text | NOT NULL | Task description |
| `completed` | boolean | DEFAULT false | Completion status |
| `created_at` | timestamp | DEFAULT now() | Creation timestamp |

**Supabase Project:**
- URL: `https://zyuthilumfrtedrceeqx.supabase.co`
- Environment variables are in `.env.local` (never commit this file)

---

## Code Style & Conventions

### TypeScript
- ✅ **Always use TypeScript** - No plain JavaScript files
- ✅ **Strict mode enabled** - No `any` types unless absolutely necessary
- ✅ **Export types** - Define and export types for reusability
- ✅ **Use interfaces for objects**, type aliases for unions/primitives

**Example:**
```typescript
// Good ✅
interface Task {
  id: string
  title: string
  completed: boolean
  created_at: string
}

// Avoid ❌
const task: any = { ... }
```

### Code Documentation
- ✅ **Add single-line JSDoc comments** above EVERY function and component
- ✅ **Explain WHAT it does**, not how (the code shows how)
- ✅ **Be concise** - one line is enough
- ✅ **Update comments** when refactoring

**Pattern for functions:**
```typescript
/** Fetches all tasks for the current user from Supabase */
async function getTasks(userId: string) {
  // implementation
}

/** Toggles task completion status with optimistic UI update */
const handleToggle = async (id: string) => {
  // implementation
}
```

**Pattern for components:**
```typescript
/** Main task list component with create, toggle, and delete actions */
export default function TaskList() {
  // implementation
}

/** Individual task item with checkbox and delete button */
const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => {
  // implementation
}
```

**Pattern for API routes:**
```typescript
/** GET /api/tasks - Returns all tasks for authenticated user */
export async function GET(request: Request) {
  // implementation
}

/** POST /api/tasks - Creates a new task for authenticated user */
export async function POST(request: Request) {
  // implementation
}
```

**DON'T document:**
- Obvious utility functions (getters/setters)
- One-liner arrow functions used inline
- Auto-generated code

### React Components
- ✅ **Functional components only** - No class components
- ✅ **Arrow functions** - `const Component = () => { ... }`
- ✅ **Use "use client" directive** when component needs interactivity (state, events)
- ✅ **Use "use server" directive** for server actions (if added)
- ✅ **Destructure props** in function parameters

**Example:**
```typescript
'use client'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
}

const TaskItem = ({ task, onToggle }: TaskItemProps) => {
  return (
    <div className="...">
      {/* component content */}
    </div>
  )
}
```

### Styling
- ✅ **Tailwind CSS only** - No custom CSS files (except globals.css for Tailwind imports)
- ✅ **Mobile-first approach** - Start with mobile, add responsive classes
- ✅ **Use semantic color classes** - `bg-blue-500`, `text-gray-700`, etc.
- ✅ **Consistent spacing** - Use Tailwind's spacing scale (p-4, m-2, gap-3)

**Common patterns:**
```tsx
// Container
<div className="max-w-2xl mx-auto p-4">

// Card
<div className="bg-white rounded-lg shadow-md p-6">

// Button primary
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">

// Input
<input className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
```

### API Routes
- ✅ **RESTful conventions** - GET, POST, PUT/PATCH, DELETE
- ✅ **Always return JSON** with proper HTTP status codes
- ✅ **Handle errors gracefully** - Try-catch blocks with meaningful error messages
- ✅ **Validate input** before processing

**Response format:**
```typescript
// Success
return NextResponse.json({ data: tasks }, { status: 200 })

// Error
return NextResponse.json(
  { error: 'Task not found' }, 
  { status: 404 }
)
```

**Status codes to use:**
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

---

## Development Workflow

### When Adding a New Feature

Follow this sequence:

1. **Plan the API first**
   - What endpoint? (GET, POST, PUT, DELETE)
   - What data structure?
   - What validations needed?

2. **Implement the API route**
   - Add to `/app/api/tasks/route.ts` or create new route
   - Test with sample data or Postman/Thunder Client
   - Verify Supabase updates correctly

3. **Build the UI component**
   - Create or modify React component
   - Add proper TypeScript types
   - Use Tailwind for styling

4. **Connect API to UI**
   - Use `fetch()` for API calls
   - Handle loading states
   - Handle error states
   - Update UI optimistically when possible

5. **Test end-to-end**
   - Test happy path
   - Test error scenarios
   - Check browser console for errors
   - Verify database in Supabase dashboard

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/task-completion

# Make changes and commit frequently
git add .
git commit -m "Add checkbox for task completion"

# Push to GitHub
git push origin feature/task-completion

# Merge to main when done
git checkout main
git merge feature/task-completion
git push origin main
```

### Deployment
- **Auto-deploy:** Pushing to `main` triggers Vercel deployment automatically
- **Environment variables:** Set in Vercel dashboard (Settings → Environment Variables)
- **Preview deployments:** Every PR gets a preview URL

---

## Current API Routes

### GET /api/tasks
**Purpose:** Fetch all tasks  
**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Task title",
    "completed": false,
    "created_at": "2026-02-17T01:00:00Z"
  }
]
```

### POST /api/tasks
**Purpose:** Create a new task  
**Request body:**
```json
{
  "title": "New task"
}
```
**Response:** Created task object (status 201)

### PUT /api/tasks (TODO)
**Purpose:** Update a task (toggle completion, edit title)  
**Request body:**
```json
{
  "id": "uuid",
  "completed": true
}
```

### DELETE /api/tasks (TODO)
**Purpose:** Delete a task  
**Request body:**
```json
{
  "id": "uuid"
}
```

---

## Common Patterns

### Fetching Data
```typescript
const [tasks, setTasks] = useState<Task[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/tasks')
    .then(res => res.json())
    .then(data => setTasks(data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false))
}, [])
```

### Creating a Task
```typescript
const handleCreate = async (title: string) => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
  
  if (response.ok) {
    const newTask = await response.json()
    setTasks([...tasks, newTask])
  }
}
```

### Optimistic UI Updates
```typescript
const handleToggle = async (id: string) => {
  // Update UI immediately
  setTasks(tasks.map(task => 
    task.id === id ? { ...task, completed: !task.completed } : task
  ))
  
  // Then sync with server
  const response = await fetch('/api/tasks', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, completed: true })
  })
  
  // Rollback if failed
  if (!response.ok) {
    setTasks(tasks) // Restore original state
  }
}
```

---

## Testing

### E2E Testing with Playwright

Comprehensive end-to-end tests cover all critical user flows:

**Run all tests:**
```bash
npm run test:e2e
```

**Test files:**
- `e2e/tasks.spec.ts` - CRUD operations (create, read, toggle, delete)
- `e2e/stats.spec.ts` - Counter and statistics updates
- `e2e/ui.spec.ts` - UI interactions, edge cases, loading states

**Available commands:**
- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Interactive test UI with browser
- `npm run test:e2e:headed` - Show browser while running
- `npm run test:e2e:debug` - Debug with Playwright Inspector
- `npx playwright show-report` - View HTML test report

**What's tested:**
- Creating, reading, updating (toggle), deleting tasks
- Task statistics (total, completed, pending)
- UI interactions (loading, hover, focus, form validation)
- Edge cases (special characters, long titles, rapid submission)
- Optimistic UI updates with server sync
- Empty state display
- Task ordering and styling

**Configuration:**
- See `playwright.config.ts` for browser/mobile testing setup
- Tested on: Chromium, Firefox, WebKit, Pixel 5, iPhone 12
- Auto-starts dev server before tests run

### Testing Checklist

Before considering a feature complete:

- [ ] Feature works in development (`npm run dev`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console errors or warnings
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Database updates correctly (check Supabase dashboard)
- [ ] UI updates reflect database state
- [ ] Error states are handled gracefully
- [ ] Loading states provide feedback to user
- [ ] Feature works in production (Vercel)
- [ ] Mobile responsive (test on small screen)
- [ ] Git commit with clear message

---

## Troubleshooting

### Common Issues

**Issue:** "supabaseUrl is required"
- **Cause:** Environment variables not loaded
- **Fix:** Check `.env.local` exists and has correct format
- **Fix:** Restart dev server after changing `.env.local`
- **Fix:** In Vercel, verify Environment Variables are set with `NEXT_PUBLIC_` prefix

**Issue:** CORS errors in browser
- **Cause:** API route configuration issue
- **Fix:** Next.js API routes handle CORS automatically, check route export

**Issue:** TypeScript errors
- **Cause:** Missing types or wrong type usage
- **Fix:** Run `npm run build` to see all errors
- **Fix:** Add proper types to function parameters and return values

**Issue:** Data not updating in UI
- **Cause:** State not updating correctly
- **Fix:** Use functional setState: `setTasks(prev => [...prev, newTask])`
- **Fix:** Check React DevTools to verify state changes

---

## Next Steps / Roadmap

### Immediate (This Week)
- [ ] Add checkbox to toggle task completion (UPDATE)
- [ ] Add delete button for tasks (DELETE)
- [ ] Add loading spinner when fetching tasks
- [ ] Add error message display

### Short-term (Next 2 Weeks)
- [ ] Add task categories/tags
- [ ] Add due dates
- [ ] Add task priority levels
- [ ] Add filtering (all/completed/active)
- [ ] Add search functionality

### Medium-term (Month 1)
- [ ] Add authentication (NextAuth.js)
- [ ] User-specific tasks
- [ ] Task sharing between users
- [ ] Real-time updates (Supabase realtime)

### Long-term (Month 2-3)
- [ ] Convert to PWA (Progressive Web App)
- [ ] Add drag-and-drop reordering
- [ ] Add analytics dashboard
- [ ] Premium features with Stripe

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vercel Deployment Docs](https://vercel.com/docs)

---

## Skills Reference

This project uses specialized skills in `.claude/skills/` organized by category. See [`.claude/README.md`](.claude/README.md) for the full list and usage guide.

| Category | Skills |
|----------|--------|
| `core/` | `nextjs-skill`, `tailwind-skill`, `typescript-skill`, `supabase-skill` |
| `features/` | `auth-skill`, `api-skill` |
| `practices/` | `documentation-skill`, `error-handling-skill`, `security-skill` |

---

## Notes for AI Assistants (Claude Code)

When I ask you to implement a feature:

1. **Read this file first** to understand the project structure and patterns
2. **Follow the conventions** defined above (TypeScript, styling, API format)
3. **Use the workflow** defined in "When Adding a New Feature"
4. **Test before finishing** - don't just write code, verify it works
5. **Ask clarifying questions** if the requirement is ambiguous
6. **Explain your changes** briefly after implementing

**Preferred response pattern:**
1. Briefly explain what you're about to do
2. Show the code changes (with file paths)
3. Explain any important decisions or trade-offs
4. List what to test to verify it works

**Example:**
> I'll add the toggle completion feature:
>
> 1. Update API route to handle PUT requests
> 2. Add checkbox to TaskItem component
> 3. Implement optimistic UI update
>
> **Files changed:**
> - `/app/api/tasks/route.ts` - Added PUT handler
> - `/app/page.tsx` - Added handleToggle function and checkbox UI
>
> **Test by:**
> - Click checkbox → should toggle immediately
> - Refresh page → state should persist
> - Check Supabase → completed value should update

---

## External Documentation (llms.txt)

When implementing features, ALWAYS use Context7 MCP to fetch the latest documentation:

**Core Stack:**
- Next.js 15: `context7 fetch nextjs.org/llms.txt`
- Supabase: `context7 fetch supabase.com/llms.txt`
- Tailwind CSS: `context7 fetch tailwindcss.com/llms.txt`

**Auth (next phase):**
- NextAuth.js v5: `context7 fetch authjs.dev/llms.txt`

**Payments (future):**
- Stripe: `context7 fetch stripe.com/llms.txt`

**CRITICAL:** Before implementing ANY new feature:
1. Use Context7 to fetch current docs
2. Read the relevant sections
3. Implement following the official patterns
4. This prevents using outdated APIs or deprecated patterns