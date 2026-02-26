import { test, expect } from "@playwright/test";
import { cleanupDatabase } from "./helpers/db-cleanup";

test.describe("Task Manager - Statistics", () => {
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

    // Verify database is actually empty by checking if empty state shows
    const emptyMessage = page.locator("text=No hay tareas");
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    if (!isEmpty) {
      console.warn(
        "⚠️  Database cleanup may have failed - page shows tasks instead of empty state"
      );
    }
  });

  test("should display stats when tasks exist", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Create a task so stats are visible
    await input.fill("Task for stats");
    await button.click();

    // Wait for stats to appear
    const statsTotal = page.getByTestId("stats-total");
    await expect(statsTotal).toBeVisible();

    // Verify all stat labels are present
    const statsCompleted = page.getByTestId("stats-completed");
    const statsPending = page.getByTestId("stats-pending");

    await expect(statsCompleted).toBeVisible();
    await expect(statsPending).toBeVisible();
  });

  test("should update total count when task is added", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    // Get initial total
    const statsTotal = page.getByTestId("stats-total");
    let initialText = await statsTotal.textContent();
    const initialMatch = initialText?.match(/(\d+)/);
    const initialCount = initialMatch ? Number.parseInt(initialMatch[1]) : 0;

    // Add a task
    await input.fill("New task for count");
    await button.click();

    // Wait a moment for UI update
    await page.waitForTimeout(200);

    // Get new total
    const newText = await statsTotal.textContent();
    const newMatch = newText?.match(/(\d+)/);
    const newCount = newMatch ? Number.parseInt(newMatch[1]) : 0;

    expect(newCount).toBe(initialCount + 1);
  });

  test("should track completed vs pending tasks", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const uniqueId = Date.now();
    const task1 = `Task 1 ${uniqueId}`;
    const task2 = `Task 2 ${uniqueId}`;

    // Create first task
    await input.fill(task1);
    await button.click();

    // Create second task
    await input.fill(task2);
    await button.click();

    // Verify initial state: 2 pending, 0 completed
    const statsPending = page.getByTestId("stats-pending");
    const statsCompleted = page.getByTestId("stats-completed");

    let pendingText = await statsPending.textContent();
    expect(pendingText).toContain("2");

    let completedText = await statsCompleted.textContent();
    expect(completedText).toContain("0");

    // Mark first task as completed
    const checkboxes = page.getByTestId("task-checkbox");
    await checkboxes.first().click();

    // Wait for UI update
    await page.waitForTimeout(200);

    // Verify: 1 pending, 1 completed
    pendingText = await statsPending.textContent();
    expect(pendingText).toContain("1");

    completedText = await statsCompleted.textContent();
    expect(completedText).toContain("1");

    // Mark second task as completed
    await checkboxes.nth(1).click();

    await page.waitForTimeout(200);

    // Verify: 0 pending, 2 completed
    pendingText = await statsPending.textContent();
    expect(pendingText).toContain("0");

    completedText = await statsCompleted.textContent();
    expect(completedText).toContain("2");
  });

  test("should update stats when task is deleted", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const taskTitle = `Task to delete for stats ${Date.now()}`;

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Get total before delete
    const statsTotal = page.getByTestId("stats-total");
    const totalBefore = await statsTotal.textContent();
    const totalBeforeNum = totalBefore?.match(/(\d+)/)?.[1];

    // Delete the task
    const taskItem = page.getByTestId("task-item").first();
    await taskItem.hover();
    const deleteButton = taskItem.getByTestId("task-delete");
    await deleteButton.click();

    await page.waitForTimeout(200);

    // Get total after delete
    const totalAfter = await statsTotal.textContent();
    const totalAfterNum = totalAfter?.match(/(\d+)/)?.[1];

    const before = totalBeforeNum ? Number.parseInt(totalBeforeNum) : 0;
    const after = totalAfterNum ? Number.parseInt(totalAfterNum) : 0;

    expect(after).toBe(before - 1);
  });

  test("should hide stats when no tasks remain", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const taskTitle = `Temp task ${Date.now()}`;

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Verify stats are visible
    const statsTotal = page.getByTestId("stats-total");
    await expect(statsTotal).toBeVisible();

    // Delete the task
    const taskItem = page.getByTestId("task-item").first();
    await taskItem.hover();
    const deleteButton = taskItem.getByTestId("task-delete");
    await deleteButton.click();

    await page.waitForTimeout(200);

    // Stats should be hidden
    const isVisible = await statsTotal.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});
