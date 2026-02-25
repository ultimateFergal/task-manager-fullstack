# TypeScript Skill - Strict Mode

## Core Rules
- Strict mode is ON — no `any` types
- Use `interface` for object shapes, `type` for unions and primitives
- Export all types used across more than one file
- Prefer `unknown` over `any` when type is truly dynamic

## Data Model Interfaces

```typescript
// lib/supabase.ts — exported for reuse
export interface Task {
  id: string
  title: string
  completed: boolean
  created_at: string
}

// Input types for mutations
export interface CreateTaskInput {
  title: string
}

export interface UpdateTaskInput {
  id: string
  completed: boolean
}
```

## Component Props

```typescript
interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

/** Individual task item with checkbox and delete button */
const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => { }

// Children pattern
interface WrapperProps {
  children: React.ReactNode
  className?: string
}
```

## API Response Types

```typescript
type ApiSuccess<T> = { data: T }
type ApiError = { error: string }
type ApiResponse<T> = ApiSuccess<T> | ApiError

// Type guard
function isApiError(res: ApiResponse<unknown>): res is ApiError {
  return 'error' in res
}
```

## React-Specific Types

```typescript
// Event handlers
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { }
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { }
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { }

// State
const [tasks, setTasks] = useState<Task[]>([])
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(true)  // inferred as boolean
```

## Async Functions

```typescript
// Always annotate return types for exported/API functions
async function getTasks(): Promise<Task[]> { }
async function createTask(input: CreateTaskInput): Promise<Task> { }

// Void for event handlers
const handleDelete = async (id: string): Promise<void> => { }
```

## Union Types and Literals

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error'
type Priority = 'low' | 'medium' | 'high'

interface Task {
  // ...
  status: Status
  priority?: Priority
}
```

## Avoid

```typescript
// ❌ Never
const data: any = await response.json()
function process(input: any) { }
const tasks = [] // untyped array

// ✅ Instead
const data: unknown = await response.json()
function process(input: Task) { }
const tasks: Task[] = []
```
