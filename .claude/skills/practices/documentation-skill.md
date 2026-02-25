# Documentation Skill

## Code Comments Standard

### Rule: One-line JSDoc for all functions and components

Every function and component MUST have a single-line JSDoc comment that explains its purpose.

### Format
```typescript
/** Brief description of what this does */
function name() { }
```

### Examples

**Functions:**
```typescript
/** Validates user input and returns sanitized data */
function validateInput(data: unknown) { }

/** Calculates total price including tax and discounts */
const calculateTotal = (items: CartItem[]) => { }
```

**Components:**
```typescript
/** Login form with email/password and OAuth options */
export default function LoginForm() { }

/** Reusable button with loading state and variants */
const Button = ({ variant, loading, children }: ButtonProps) => { }
```

**API Routes:**
```typescript
/** GET /api/users/:id - Fetches user profile by ID */
export async function GET(request: Request) { }

/** POST /api/users - Creates new user account */
export async function POST(request: Request) { }

/** PUT /api/users/:id - Updates user profile */
export async function PUT(request: Request) { }

/** DELETE /api/users/:id - Deletes user account */
export async function DELETE(request: Request) { }
```

**React Hooks:**
```typescript
/** Custom hook to manage form state with validation */
function useForm<T>(initialValues: T) { }

/** Hook to fetch and cache user data */
function useUser(userId: string) { }
```

**Database queries:**
```typescript
/** Fetches all tasks for user with completion status filter */
async function getUserTasks(userId: string, completed?: boolean) { }
```

### What NOT to document
- Self-explanatory one-liners: `const sum = (a, b) => a + b`
- Auto-generated boilerplate code
- Obvious getters/setters: `getName()`, `setName()`
- Variable declarations (unless complex logic)

### When refactoring
ALWAYS update the comment if the function's purpose changes.

### Quality checks
- Comment explains the PURPOSE, not the implementation
- Comment is ONE line (use multiple sentences if needed, but one line)
- Comment is in present tense: "Fetches tasks" not "Will fetch tasks"
- Comment doesn't repeat the function name
