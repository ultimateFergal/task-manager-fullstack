# E2E Tests with Playwright

Comprehensive end-to-end tests for the Task Manager application using Playwright.

## Overview

This test suite covers all critical user flows:
- **Task CRUD Operations**: Create, read, update (toggle completion), delete tasks
- **Statistics**: Total, completed, and pending task counters
- **UI Interactions**: Loading states, hover effects, form validation, empty states

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

### Run All Tests
```bash
npm run test:e2e
```

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

## Requirements

- Node.js 18+
- Dev server running or configured to auto-start
- Supabase instance set up with tasks table
- Environment variables in `.env.local`

## Environment Setup

Before running tests:

1. **Ensure dev server can start:**
   ```bash
   npm run dev
   ```

2. **Verify Supabase connection:**
   - Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Database `tasks` table exists with columns: `id`, `title`, `completed`, `created_at`

3. **Clear test data (optional):**
   - Tests create/modify tasks; consider cleaning them up between test runs
   - Or use a separate test database/project

## Key Testing Patterns

### Waiting for Network
```typescript
await page.waitForLoadState('networkidle')
```

### Finding Elements
```typescript
const input = page.locator('input[placeholder="Que necesitas hacer?"]')
const button = page.locator('button', { hasText: 'Agregar' })
```

### Optimistic UI Testing
Tests verify the UI updates immediately, then checks server sync:
```typescript
// Click immediately shows completion
await checkbox.click()
await expect(checkbox).toBeChecked()

// Then verify with visual feedback
const classes = await taskText.getAttribute('class')
expect(classes).toContain('line-through')
```

### Handling Async Operations
```typescript
// Create task
await button.click()

// Wait for optimistic update
await page.waitForTimeout(200)

// Then verify
await expect(taskLocator).toBeVisible()
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
```

## Common Issues

### Tests timeout
- Increase timeout: `test.setTimeout(60000)`
- Check if dev server is running

### Cannot find element
- Verify selectors match current UI
- Use `page.pause()` to debug
- Check if element is actually visible

### Flaky tests
- Add proper waits: `await page.waitForLoadState('networkidle')`
- Avoid hardcoded `setTimeout()` when possible
- Use `expect` with `toBeVisible()` instead of immediate assertions

### Database state issues
- Each test creates/modifies data
- Consider running with separate test database
- Or clean up after critical tests

## Best Practices

✅ **Do:**
- Use semantic locators (role, aria-label, placeholder)
- Wait for network/load states
- Test user journeys end-to-end
- Use descriptive test names
- Group related tests with `test.describe()`
- Clean up/test empty states

✅ **Don't:**
- Hardcode element IDs if avoidable
- Use fixed timeouts except as last resort
- Test implementation details (CSS classes)
- Create brittle selectors (always scanning DOM)
- Skip error case testing

## Debugging Tips

### Pause Test Execution
```typescript
await page.pause() // Opens inspector
```

### Take Screenshot
```typescript
await page.screenshot({ path: 'screenshot.png' })
```

### Record Video
Set in config: `video: 'on'`

### Browser Dev Tools
Use `--debug` flag to open Playwright Inspector

### View Request/Response
```typescript
page.on('response', response => {
  console.log(response.url(), response.status())
})
```

## Next Steps

- Add tests for error scenarios (server errors, network failures)
- Add tests for authentication (when implemented)
- Add visual regression tests
- Add performance tests
- Integrate with CI/CD pipeline

## Resources

- [Playwright Official Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/locators)
- [Test Examples](https://github.com/microsoft/playwright/tree/main/examples)
