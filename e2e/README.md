# E2E Tests with Playwright

Comprehensive end-to-end tests for the Task Manager application using Playwright.

## Overview

This test suite covers all critical user flows:
- **Task CRUD Operations**: Create, read, update (toggle completion), delete tasks
- **Statistics**: Total, completed, and pending task counters
- **UI Interactions**: Loading states, hover effects, form validation, empty states

All tests run against an **isolated test database** to prevent interference with development/production data.

## Test Database Setup

### Creating a Test Database

Each developer needs their own Supabase test project:

1. **Create test project** at https://supabase.com
2. **Copy credentials** from project settings
3. **Create `.env.test`** in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
   ```

### Database Schema for Tests

The test database must have the same `tasks` table structure as production:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

### Automatic Cleanup

Each test:
- ✅ Automatically clears the database before running (clean slate)
- ✅ Creates test data during the test
- ✅ Isolates from other tests
- ✅ Never interferes with development database

This is handled by the **test fixtures** in `e2e/fixtures.ts`.

## Test Files

### `tasks.spec.ts`
Core task operations and CRUD functionality:
- Page loading and header verification
- Input field and button visibility
- Creating single and multiple tasks
- Task ordering (newest first)
- Validation (empty title prevention)
- Toggling task completion with visual feedback
- Deleting tasks
- Empty state display

### `stats.spec.ts`
Statistics and counter updates:
- Stats display visibility
- Total count updates on task creation
- Completed vs. pending task tracking
- Stats updates on task deletion
- Stats hiding when no tasks remain

### `ui.spec.ts`
UI interactions and edge cases:
- Loading spinner display
- Button disable state during submission
- Focus management after task creation
- Rapid task creation handling
- Special characters in task titles
- Very long task titles
- Whitespace trimming
- Delete button hover visibility/opacity
- Task order preservation after completion toggle
- Completed task styling (strikethrough, opacity)

## Running Tests

### Install Dependencies
```bash
npm install
```

### Setup Test Database (One-time)
```bash
# Create .env.test with your test database credentials
# See "Test Database Setup" section above
```

### Run All Tests
```bash
npm run test:e2e
```

All tests automatically use the test database from `.env.test` and clean it before each test.

### Run Tests in UI Mode
Opens interactive test viewer with live debugging:
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode
Shows browser window while running:
```bash
npm run test:e2e:headed
```

### Debug Tests
Opens Playwright Inspector for step-by-step debugging:
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npx playwright test e2e/tasks.spec.ts
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Test Report
After tests complete, view HTML report:
```bash
npx playwright show-report
```

## Test Configuration

### `playwright.config.ts`
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: Pixel 5 (Chrome), iPhone 12 (Safari)
- **Web Server**: Auto-starts dev server (`npm run dev`)
- **Retries**: 0 in development, 2 in CI
- **Reporting**: HTML report with traces
- **Environment**: Loads `.env.test` automatically

### `e2e/fixtures.ts`
Custom test fixture that:
- Extends Playwright's default test
- Provides `cleanDatabase` fixture
- Clears test database before each test
- Ensures test isolation and repeatability

## Required Environment Variables

### `.env.test` (DO NOT COMMIT)
```env
# Test database - separate Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
```

**IMPORTANT**:
- Never commit `.env.test` to git (gitignore is configured)
- Set locally only, with test project credentials
- Use a completely separate Supabase project for testing

## Database Cleanup

### How It Works

Before each test, the fixture automatically runs:
```typescript
await cleanupDatabase() // Deletes all tasks from test database
```

This ensures:
- ✅ Each test starts with empty database
- ✅ No data leaks between tests
- ✅ Tests are completely isolated
- ✅ Cleanup is fast (single DELETE query)

### Manual Cleanup

To manually clean the test database:
```typescript
import { cleanupDatabase } from "./helpers/db-cleanup";

await cleanupDatabase();
```

## Key Testing Patterns

### Using Test Fixtures

All test files should use the custom test fixture:

```typescript
// ✅ Correct
import { test, expect } from "./fixtures";

test.beforeEach(async ({ page, cleanDatabase }) => {
  await cleanDatabase;
  await page.goto("/");
});
```

### Getting Elements by Test ID

Tests use semantic test IDs instead of text selectors:

```typescript
// ✅ Correct - Resilient to UI text changes
const input = page.getByTestId("task-input");
const button = page.getByTestId("add-task-button");
const taskItem = page.getByTestId("task-item");

// ❌ Avoid - Breaks if text changes
const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
```

### Waiting for Network and Rendering

```typescript
// Wait for all network requests to complete
await page.waitForLoadState("networkidle");

// Wait for specific element
await expect(element).toBeVisible();

// Wait for optimistic UI update
await page.waitForTimeout(200);
```

### Optimistic UI Testing

Tests verify the UI updates immediately, then checks server sync:
```typescript
// Click immediately shows completion
await checkbox.click();
await expect(checkbox).toBeChecked();

// Then verify with visual feedback
const classes = await taskText.getAttribute("class");
expect(classes).toContain("line-through");
```

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to `main`
- Pull requests
- Daily schedule

Configure in `.github/workflows/e2e-tests.yml`:
```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
```

**Note**: Set test database secrets in GitHub Settings → Secrets

## Common Issues

### Tests timeout
- Increase timeout: `test.setTimeout(60000)`
- Check if dev server is running
- Verify test database credentials in `.env.test`

### Cannot find element
- Verify test IDs exist in `app/page.tsx`
- Use `page.pause()` to debug
- Check if element is actually visible

### Database cleanup errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check test database is running and accessible
- Ensure `tasks` table exists with correct schema

### Flaky tests
- Add proper waits: `await page.waitForLoadState("networkidle")`
- Avoid hardcoded `setTimeout()` when possible
- Use `expect` with `toBeVisible()` instead of immediate assertions

### Connection errors
- Check `.env.test` file exists and has correct credentials
- Verify test database project is not paused in Supabase
- Test connection: `npx tsx -e "import('e2e/helpers/db-cleanup.ts')"`

## Best Practices

✅ **Do:**
- Use semantic test IDs (`data-testid="task-input"`)
- Use `getByTestId()` in tests
- Wait for network/load states
- Test user journeys end-to-end
- Use descriptive test names
- Group related tests with `test.describe()`
- Use the `cleanDatabase` fixture automatically
- Test both happy path and error cases

❌ **Don't:**
- Use text selectors if you have test IDs
- Hardcode element IDs if you can use test IDs
- Use fixed timeouts except as last resort
- Test implementation details (CSS classes)
- Create brittle selectors that scan entire DOM
- Commit `.env.test` to git
- Commit test database credentials anywhere

## Debugging Tips

### Pause Test Execution
```typescript
await page.pause() // Opens inspector
```

### Take Screenshot
```typescript
await page.screenshot({ path: "screenshot.png" });
```

### Record Video
Set in config: `video: 'on'`

### Browser Dev Tools
Use `--debug` flag to open Playwright Inspector

### View Request/Response
```typescript
page.on("response", (response) => {
  console.log(response.url(), response.status());
});
```

### Check Cleanup Logs
The `db-cleanup.ts` logs success/error messages during test runs.

## Next Steps

- [ ] Add tests for error scenarios (server errors, network failures)
- [ ] Add tests for authentication (when implemented)
- [ ] Add visual regression tests
- [ ] Add performance tests
- [ ] Integrate with CI/CD pipeline
- [ ] Create test data factories for seeding

## Resources

- [Playwright Official Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwrigh Fixtures](https://playwright.dev/docs/test-fixtures)
- [Selectors Guide](https://playwright.dev/docs/locators)
- [Test Examples](https://github.com/microsoft/playwright/tree/main/examples)
- [Supabase Docs](https://supabase.com/docs)
