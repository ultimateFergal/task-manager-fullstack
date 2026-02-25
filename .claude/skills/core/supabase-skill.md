# Supabase Skill

> Always verify the Supabase API with Context7 before implementing: `context7 fetch supabase.com/llms.txt`

## Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

/** Supabase client instance configured with public URL and anon key */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## CRUD Patterns

### SELECT
```typescript
// All rows ordered
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .order('created_at', { ascending: false })

// Filtered by user
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Single row (throws if not found)
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('id', id)
  .single()
```

### INSERT
```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert([{ title: title.trim(), user_id: userId }])
  .select()
  .single()
```

### UPDATE
```typescript
const { data, error } = await supabase
  .from('tasks')
  .update({ completed })
  .eq('id', id)
  .select()
  .single()
```

### DELETE
```typescript
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', id)
```

## Error Handling

ALWAYS destructure and check error:
```typescript
// ✅ Correct
const { data, error } = await supabase.from('tasks').select('*')
if (error) throw error

// ❌ Never ignore error
const { data } = await supabase.from('tasks').select('*')
```

## Row Level Security (RLS)

Enable RLS on every table that stores user data:
```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Read own tasks only
CREATE POLICY "Users read own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own tasks only
CREATE POLICY "Users insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own tasks only
CREATE POLICY "Users update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Delete own tasks only
CREATE POLICY "Users delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

## User-Scoped Queries

ALWAYS filter by `user_id` in authenticated routes — RLS is a second layer, not a substitute:
```typescript
.eq('user_id', session.user.id)  // CRITICAL: never omit
```

## Schema Changes for Auth
```sql
-- Add user_id column
ALTER TABLE tasks ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Index for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

## Testing Checklist
- [ ] RLS enabled on all tables with user data
- [ ] All queries filter by `user_id` in authenticated routes
- [ ] `error` is always destructured and checked
- [ ] `.single()` used when expecting exactly one row
- [ ] Changes verified in Supabase dashboard after each mutation
