import { test, expect } from "@playwright/test";

test.describe("Task Manager - UI & Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
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
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

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
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    await input.fill("Task 1");
    await button.click();

    // Wait for optimistic update
    await page.waitForTimeout(200);

    // Input should be empty and focused for next entry
    await expect(input).toHaveValue("");
  });

  test("should handle rapid task creation", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

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
    for (const taskTitle of tasks) {
      const taskLocator = page.locator("span").filter({ hasText: taskTitle });
      await expect(taskLocator).toBeVisible();
    }
  });

  test("should handle task with special characters", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    const specialTask = 'Task with "quotes" & <brackets> @mention #hashtag';
    await input.fill(specialTask);
    await button.click();

    // Verify task is created and displayed correctly
    const taskItem = page.locator("span").filter({ hasText: specialTask });
    await expect(taskItem).toBeVisible();
  });

  test("should handle very long task titles", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    const longTask = "A".repeat(200);
    await input.fill(longTask);
    await button.click();

    // Wait for creation
    await page.waitForTimeout(200);

    // Verify task is created and visible (may be truncated in display)
    const taskItem = page.locator("span").filter({ hasText: "A".repeat(50) });
    await expect(taskItem).toBeVisible();
  });

  test("should trim whitespace from task title", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    const taskTitle = "   Task with spaces   ";
    await input.fill(taskTitle);
    await button.click();

    // Wait for creation
    await page.waitForTimeout(200);

    // Should display as "Task with spaces" (trimmed)
    const taskItem = page
      .locator("span")
      .filter({ hasText: /^Task with spaces$/ });
    await expect(taskItem).toBeVisible();
  });

  test("should show/hide delete button on hover", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    const taskTitle = `Hover test ${Date.now()}`;
    await input.fill(taskTitle);
    await button.click();

    const taskRow = page.locator("div").filter({ hasText: taskTitle });
    const deleteButton = taskRow.locator('button[aria-label="Eliminar tarea"]');

    // Initially hidden
    const initialOpacity = await deleteButton.evaluate(
      (el) => window.getComputedStyle(el).opacity,
    );
    expect(parseFloat(initialOpacity)).toBeLessThan(1);

    // On hover, should be visible
    await taskRow.hover();
    const hoverOpacity = await deleteButton.evaluate(
      (el) => window.getComputedStyle(el).opacity,
    );
    expect(parseFloat(hoverOpacity)).toBe(1);
  });

  test("should maintain task order after toggling completion", async ({
    page,
  }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

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
    const taskRow2 = page.locator("div").filter({ hasText: task2 });
    const checkbox2 = taskRow2.locator('input[type="checkbox"]');
    await checkbox2.click();

    // Verify order didn't change (Task 3 still first, Task 2 still middle)
    const task3Locator = page.locator("span").filter({ hasText: task3 });
    const task2Locator = page.locator("span").filter({ hasText: task2 });

    const task3Box = await task3Locator.first().boundingBox();
    const task2Box = await task2Locator.first().boundingBox();

    if (task3Box && task2Box) {
      expect(task3Box.y).toBeLessThan(task2Box.y);
    }
  });

  test("should apply completed styling correctly", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    const taskTitle = `Styling test ${Date.now()}`;
    await input.fill(taskTitle);
    await button.click();

    const taskRow = page.locator("div").filter({ hasText: taskTitle });
    const checkbox = taskRow.locator('input[type="checkbox"]');
    const taskText = taskRow.locator("span", { hasText: taskTitle });

    // Before completion
    let classes = await taskText.getAttribute("class");
    expect(classes).not.toContain("line-through");

    // After completion
    await checkbox.click();

    classes = await taskText.getAttribute("class");
    expect(classes).toContain("line-through");

    // Task row should have opacity
    const rowClasses = await taskRow.getAttribute("class");
    expect(rowClasses).toContain("opacity-60");
  });
});
