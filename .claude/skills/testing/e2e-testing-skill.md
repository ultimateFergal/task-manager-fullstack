# E2E Testing Skill (Playwright)

## Stack
- **Runner:** Playwright 1.58+
- **Config:** `playwright.config.ts`
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## Commands
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:headed    # Show browser while running
npm run test:e2e:ui        # Interactive Playwright UI
npm run test:e2e:debug     # Debug with Playwright Inspector
npx playwright show-report # View HTML test report
```

## Test Files
```
e2e/
├── tasks.spec.ts   # CRUD operations
├── stats.spec.ts   # Statistics counters
└── ui.spec.ts      # UI interactions, edge cases
```

## Critical Timing Patterns

### Wait for task submission to complete
After clicking "Add task", wait for the input to clear — this confirms both the API call returned and React's state updated:
```typescript
await button.click();
await expect(input).toHaveValue("", { timeout: 15000 });
```

### Multi-task creation loop
Wait for input to clear before each fill to avoid React overwriting Playwright's fill:
```typescript
for (const title of titles) {
  await expect(input).toHaveValue("", { timeout: 15000 });
  await input.fill(title);
  await expect(button).toBeEnabled({ timeout: 10000 });
  await button.click();
}
await expect(input).toHaveValue("", { timeout: 15000 }); // last submission
```

### Mobile: skip hover-dependent tests
```typescript
const isMobile = await page.evaluate(() => window.innerWidth < 768);
test.skip(isMobile, "Hover effects not supported on touch devices");
```

### CSS transition completion
```typescript
await page.waitForTimeout(400); // wait for transition before asserting styles
```

## Key Configuration (`playwright.config.ts`)
```typescript
workers: 1,          // Sequential execution — prevents race conditions on shared Supabase DB
fullyParallel: true, // Tests within a file can still run in parallel
```

## beforeEach Pattern
```typescript
test.beforeEach(async ({ page }) => {
  await cleanupDatabase();
  await page.waitForTimeout(500); // let cleanup propagate
  await page.goto("/");
  await page.waitForLoadState("networkidle");
});
```

## Why workers: 1?
With `workers > 1`, multiple browser projects run tests simultaneously against the shared Supabase DB. A test's `beforeEach` cleanup can delete tasks that another test created mid-execution, causing failures. Sequential execution (workers: 1) eliminates this race condition.
