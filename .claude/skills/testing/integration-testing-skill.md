# Integration Testing Skill (API Routes)

## Pattern: Mock Supabase, Test Route Handler Directly

Integration tests call the exported route handler functions with a real `Request` object and assert on the `Response`. No HTTP server or fetch required.

## Mock Structure by Supabase Chain

### GET: `.from().select().order()`
```typescript
const mockOrder = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({ order: mockOrder }),
    })),
  },
}));

// In test:
mockOrder.mockResolvedValue({ data: [...], error: null });
```

### POST: `.from().insert().select().single()`
```typescript
const mockSingle = vi.fn();
const mockInsertSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert.mockReturnValue({
        select: mockInsertSelect.mockReturnValue({ single: mockSingle }),
      }),
    })),
  },
}));
```

### PUT: `.from().update().eq().select().single()`
```typescript
const mockSingle = vi.fn();
const mockUpdateSelect = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({
          select: mockUpdateSelect.mockReturnValue({ single: mockSingle }),
        }),
      }),
    })),
  },
}));
```

### DELETE: `.from().delete().eq()`
```typescript
const mockEq = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: mockDelete.mockReturnValue({ eq: mockEq }),
    })),
  },
}));
```

## Request Helper
```typescript
const makeRequest = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/tasks", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
```

## Test Coverage Checklist per Route
- [ ] Happy path: correct status code + response body
- [ ] Correct arguments passed to Supabase (using `toHaveBeenCalledWith`)
- [ ] 400 for each missing/invalid required field
- [ ] 500 when Supabase returns an error
- [ ] `beforeEach(() => vi.clearAllMocks())` to reset between tests

## Notes
- `console.error` output from route handlers during error tests is expected — not a failure
- DELETE returns 204 with empty body: use `response.text()` to assert `""`
- All mock functions must be defined before `vi.mock()` (hoisted by Vitest)
