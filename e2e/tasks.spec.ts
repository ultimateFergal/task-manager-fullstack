import { test, expect } from "@playwright/test";
import { cleanupDatabase } from "./helpers/db-cleanup";

test.describe("Task Manager - Core Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Cleanup database
    await cleanupDatabase();

    // Wait for cleanup to propagate
    await page.waitForTimeout(500);

    // Navigate to the home page before each test
    await page.goto("/");

    // Wait for tasks to load
    await page.waitForLoadState("networkidle");

    // Verify database is actually empty
    const emptyMessage = page.locator("text=No hay tareas");
    const tasksContainer = page.locator('[data-testid="task-item"]').first();

    const isEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasItems = await tasksContainer.isVisible().catch(() => false);

    if (!isEmpty && !hasItems) {
      console.warn("⚠️  Database may not be ready - neither empty state nor tasks visible");
    }
  });

  test("should load the page and display the task manager header", async ({
    page,
  }) => {
    // Verify page title and heading
    await expect(page).toHaveTitle(/.*/);
    const heading = page.locator("h1");
    await expect(heading).toContainText("Gestor de Tareas");
  });

  test("should display input field and add button", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled(); // Should be disabled when input is empty
  });

  test("should create a new task", async ({ page }) => {
    const taskTitle = "Test task from Playwright";
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Type task title
    await input.fill(taskTitle);
    await expect(button).toBeEnabled();

    // Submit form
    await button.click();

    // Verify task appears in the list
    const taskItem = page.getByTestId("task-item");
    const firstTaskTitle = taskItem.first().locator("span").nth(1);
    await expect(firstTaskTitle).toContainText(taskTitle);

    // Verify input is cleared
    await expect(input).toHaveValue("");
  });

  test("should create multiple tasks in correct order", async ({ page }) => {
    const tasks = ["First task", "Second task", "Third task"];
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Create each task
    for (const taskTitle of tasks) {
      await input.fill(taskTitle);
      await button.click();
      await page.waitForTimeout(100); // Small delay for optimistic update
    }

    // Verify all tasks are visible
    const taskItems = page.getByTestId("task-item");
    const count = await taskItems.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Get task titles
    const firstTaskText = await taskItems.nth(0).textContent();
    const secondTaskText = await taskItems.nth(1).textContent();

    // Verify order (newest first)
    expect(firstTaskText).toContain("Third task");
    expect(secondTaskText).toContain("Second task");
  });

  test("should not create task with empty title", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Try to submit with empty input
    await input.fill("   ");
    await expect(button).toBeDisabled();

    // Clear and verify no request is made
    await input.clear();
    await expect(button).toBeDisabled();
  });

  test("should toggle task completion", async ({ page }) => {
    const taskTitle = "Task to complete";
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Find the checkbox for this task
    const checkbox = page.getByTestId("task-checkbox").first();

    // Verify checkbox is not checked
    await expect(checkbox).not.toBeChecked();

    // Click checkbox to mark as complete
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Verify task text has strikethrough
    const taskItem = page.getByTestId("task-item").first();
    const taskText = taskItem.locator("span").nth(1);
    const classes = await taskText.getAttribute("class");
    expect(classes).toContain("line-through");

    // Click again to uncheck
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test("should delete a task", async ({ page }) => {
    const taskTitle = "Task to delete";
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Wait for task to appear
    const taskItem = page.getByTestId("task-item").first();
    await expect(taskItem).toBeVisible();

    // Find delete button
    const deleteButton = taskItem.getByTestId("task-delete");

    // Hover over task to show delete button
    await taskItem.hover();
    await expect(deleteButton).toBeVisible();

    // Get initial task count
    const allTasksBefore = page.getByTestId("task-item");
    const countBefore = await allTasksBefore.count();

    // Click delete button
    await deleteButton.click();

    // Verify task is removed
    await page.waitForTimeout(200);
    const allTasksAfter = page.getByTestId("task-item");
    const countAfter = await allTasksAfter.count();

    expect(countAfter).toBe(countBefore - 1);
  });

  test("should display empty state when no tasks", async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Check if empty state message is visible
    const emptyMessage = page.locator("text=No hay tareas");
    const isVisible = await emptyMessage.isVisible().catch(() => false);

    if (isVisible) {
      await expect(emptyMessage).toBeVisible();
    } else {
      // If there are existing tasks, create and delete one
      const input = page.getByTestId("task-input");
      const button = page.getByTestId("add-task-button");

      const uniqueTitle = `Temp task ${Date.now()}`;
      await input.fill(uniqueTitle);
      await button.click();

      const taskItem = page.getByTestId("task-item").first();
      await expect(taskItem).toBeVisible();

      // Delete it
      await taskItem.hover();
      const deleteButton = taskItem.getByTestId("task-delete");
      await deleteButton.click();

      // Now empty state should show
      await expect(page.locator("text=No hay tareas")).toBeVisible();
    }
  });
});
