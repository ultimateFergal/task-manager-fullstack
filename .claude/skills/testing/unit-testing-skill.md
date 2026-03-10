# Unit Testing Skill

## Stack
- **Runner:** Vitest 4.x
- **UI Testing:** @testing-library/react + @testing-library/user-event
- **Matchers:** @testing-library/jest-dom
- **Environment:** happy-dom
- **Config:** `vitest.config.ts` / `vitest.setup.ts`

## Commands
```bash
npm run test:unit          # Run once
npm run test:unit:watch    # Watch mode
npm run test:unit:ui       # Interactive UI
npm run test:unit:coverage # With coverage report
```

## File Structure
```
__tests__/
├── components/
│   ├── TaskItem.test.tsx
│   └── TaskForm.test.tsx
└── api/
    ├── tasks-get.test.ts
    ├── tasks-post.test.ts
    ├── tasks-put.test.ts
    └── tasks-delete.test.ts
```

## Component Test Pattern

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText("expected text")).toBeInTheDocument();
  });

  it("calls callback on interaction", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<ComponentName onClick={handler} />);
    await user.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalled();
  });
});
```

## Key Conventions
- Use `userEvent.setup()` (not `fireEvent`) for realistic interaction simulation
- Mirror inline components from `page.tsx` in test files rather than importing directly
- Test behavior (what renders, what gets called), not implementation details
- Use `screen.getBy*` queries in priority: ByRole → ByLabelText → ByText → ByTestId
- Coverage thresholds: 80% lines, functions, branches, statements
