# Testing Conventions

## Test Pyramid

```
         /\
        /E2E\         e2e/  — Playwright (real browser + real DB)
       /------\
      / Integr \      __tests__/api/  — Vitest + mocked Supabase
     /----------\
    /    Unit    \    __tests__/components/  — Vitest + RTL + happy-dom
   /--------------\
```

## Naming Conventions

### Files
- `__tests__/components/<ComponentName>.test.tsx`
- `__tests__/api/tasks-<method>.test.ts`
- `e2e/<feature>.spec.ts`

### Test descriptions
- `describe` → Component or route name: `"TaskItem"`, `"GET /api/tasks"`
- `it` → Plain English what it does: `"renders the task title"`, `"returns status 201"`

## What to Test

### Unit (components)
- Renders expected elements with given props
- Calls callbacks with correct arguments on user interaction
- Conditional rendering (disabled states, class changes, visibility)
- Controlled input behavior

### Integration (API routes)
- Correct HTTP status codes
- Correct response body shape
- Input validation (400s for each invalid case)
- Supabase called with correct arguments
- Error handling (500 on DB error)

### E2E
- Complete user flows from browser interaction to DB persistence
- Empty state display
- Real-time UI updates after mutations
- Statistics counter accuracy
- Edge cases: special characters, long titles, rapid submission

## Checklist Before Marking a Test Suite Done
- [ ] All tests pass (`npm run test:unit`)
- [ ] No test depends on another test's side effects (`vi.clearAllMocks()` in `beforeEach`)
- [ ] E2E uses `cleanupDatabase()` in `beforeEach`
- [ ] Coverage ≥ 80% on all metrics (`npm run test:unit:coverage`)
- [ ] No `test.only` or `describe.only` left in code
