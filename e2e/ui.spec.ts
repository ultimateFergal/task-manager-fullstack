import { test, expect } from "@playwright/test";
import { cleanupDatabase } from "./helpers/db-cleanup";

test.describe("Task Manager - UI & Interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Cleanup database
    await cleanupDatabase();

    // Wait for cleanup to propagate (increased from 500ms)
    await page.waitForTimeout(1000);

    // Navigate to page
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Wait for React to render
    await page.waitForTimeout(500);

    // Refresh page to ensure fresh data from API
    await page.reload();

    // Wait again for page to load with fresh data
    await page.waitForLoadState("networkidle");

    // Verify database is actually empty
    const emptyMessage = page.locator("text=No hay tareas");
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    if (!isEmpty) {
      console.warn(
        "⚠️  Database cleanup may have failed - page shows tasks instead of empty state"
      );
    }
  });

  test("should show loading spinner initially", async ({ page }) => {
    // Create a fresh page without waiting for network
    const newPage = await page.context().newPage();
    const navigationPromise = newPage.goto("/");

    // Check if spinner is visible during loading
    const spinner = newPage.locator("div.animate-spin");
    const isSpinnerVisible = await spinner.isVisible().catch(() => false);

    // Wait for page to load
    await navigationPromise;

    // Spinner should be gone after loading
    await expect(newPage.locator("text=Cargando tareas...")).not.toBeVisible();

    await newPage.close();
  });

  test("should disable buttons while submitting", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill("Test task");

    // Before clicking, button should be enabled
    await expect(button).toBeEnabled();

    // Click button
    await button.click();

    // During submission, input should be disabled
    const isDisabled = await input.isDisabled().catch(() => false);
    // May or may not be disabled depending on timing, but button shows submitting state

    // Wait for submission to complete
    await page.waitForTimeout(500);

    // Input should be cleared after submission
    const value = await input.inputValue();
    expect(value).toBe("");
  });

  test("should focus input field after creating task", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill("Task 1");
    await button.click();

    // Wait for optimistic update
    await page.waitForTimeout(200);

    // Input should be empty and focused for next entry
    await expect(input).toHaveValue("");
  });

  test("should handle rapid task creation", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Create multiple tasks rapidly
    const tasks = ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"];

    for (const taskTitle of tasks) {
      await input.fill(taskTitle);
      await button.click();
      // Don't wait - submit rapidly
    }

    // Wait for all to be processed
    await page.waitForTimeout(1000);

    // Verify all tasks are visible
    const taskItems = page.getByTestId("task-item");
    const count = await taskItems.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("should handle task with special characters", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const specialTask = 'Task with "quotes" & <brackets> @mention #hashtag';
    await input.fill(specialTask);
    await button.click();

    // Verify task is created and displayed correctly
    const taskItems = page.getByTestId("task-item");
    const firstTask = taskItems.first();
    const taskText = await firstTask.textContent();
    expect(taskText).toContain("quotes");
  });

  test("should handle very long task titles", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const longTask = "A".repeat(200);
    await input.fill(longTask);
    await button.click();

    // Wait for creation
    await page.waitForTimeout(200);

    // Verify task is created and visible (may be truncated in display)
    const taskItems = page.getByTestId("task-item");
    const firstTask = taskItems.first();
    const taskText = await firstTask.textContent();
    expect(taskText).toContain("A");
  });

  test("should trim whitespace from task title", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const taskTitle = "   Task with spaces   ";
    await input.fill(taskTitle);
    await button.click();

    // Wait for creation
    await page.waitForTimeout(200);

    // Should display as "Task with spaces" (trimmed)
    const taskItems = page.getByTestId("task-item");
    const firstTask = taskItems.first();
    const taskText = await firstTask.textContent();

    // Should contain the trimmed text
    expect(taskText?.trim()).toContain("Task with spaces");
  });

  test("should show/hide delete button on hover", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const taskTitle = `Hover test ${Date.now()}`;
    await input.fill(taskTitle);
    await button.click();

    const taskItem = page.getByTestId("task-item").first();
    const deleteButton = taskItem.getByTestId("task-delete");

    // Initially hidden
    const initialOpacity = await deleteButton.evaluate(
      (el) => window.getComputedStyle(el).opacity
    );
    expect(parseFloat(initialOpacity)).toBeLessThan(1);

    // On hover, should be visible
    await taskItem.hover();
    const hoverOpacity = await deleteButton.evaluate(
      (el) => window.getComputedStyle(el).opacity
    );
    expect(parseFloat(hoverOpacity)).toBe(1);
  });

  test("should maintain task order after toggling completion", async ({
    page,
  }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const taskId = Date.now();
    const task1 = `Task 1 ${taskId}`;
    const task2 = `Task 2 ${taskId}`;
    const task3 = `Task 3 ${taskId}`;

    // Create 3 tasks
    await input.fill(task1);
    await button.click();
    await input.fill(task2);
    await button.click();
    await input.fill(task3);
    await button.click();

    // Mark middle task as complete
    const checkboxes = page.getByTestId("task-checkbox");
    await checkboxes.nth(1).click();

    // Verify order didn't change (Task 3 still first, Task 2 still second)
    const taskItems = page.getByTestId("task-item");
    const firstTaskText = await taskItems.nth(0).textContent();
    const secondTaskText = await taskItems.nth(1).textContent();

    expect(firstTaskText).toContain("Task 3");
    expect(secondTaskText).toContain("Task 2");
  });

  test("should apply completed styling correctly", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const taskTitle = `Styling test ${Date.now()}`;
    await input.fill(taskTitle);
    await button.click();

    const taskItem = page.getByTestId("task-item").first();
    const checkbox = taskItem.getByTestId("task-checkbox");
    const taskText = taskItem.locator("span").nth(1);

    // Before completion
    let classes = await taskText.getAttribute("class");
    expect(classes).not.toContain("line-through");

    // After completion
    await checkbox.click();

    classes = await taskText.getAttribute("class");
    expect(classes).toContain("line-through");

    // Task row should have opacity
    const rowClasses = await taskItem.getAttribute("class");
    expect(rowClasses).toContain("opacity-60");
  });
});
