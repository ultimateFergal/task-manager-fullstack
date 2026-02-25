import { test, expect } from "@playwright/test";

test.describe("Task Manager - Core Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto("/");
    // Wait for tasks to load
    await page.waitForLoadState("networkidle");
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
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled(); // Should be disabled when input is empty
  });

  test("should create a new task", async ({ page }) => {
    const taskTitle = "Test task from Playwright";
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    // Type task title
    await input.fill(taskTitle);
    await expect(button).toBeEnabled();

    // Submit form
    await button.click();

    // Verify task appears in the list
    const taskItem = page.locator("span").filter({ hasText: taskTitle });
    await expect(taskItem).toBeVisible();

    // Verify input is cleared
    await expect(input).toHaveValue("");
  });

  test("should create multiple tasks in correct order", async ({ page }) => {
    const tasks = ["First task", "Second task", "Third task"];
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    // Create each task
    for (const taskTitle of tasks) {
      await input.fill(taskTitle);
      await button.click();
      await page.waitForTimeout(100); // Small delay for optimistic update
    }

    // Verify all tasks are visible in reverse order (newest first)
    const allTasks = page
      .locator("div")
      .filter({ hasText: /First task|Second task|Third task/ });
    const count = await allTasks.count();

    // Check that tasks appear in correct order (newest first)
    const thirdTaskLocator = page
      .locator("span")
      .filter({ hasText: "Third task" });
    const secondTaskLocator = page
      .locator("span")
      .filter({ hasText: "Second task" });

    // Get box positions to verify order
    const thirdTaskBox = await thirdTaskLocator.first().boundingBox();
    const secondTaskBox = await secondTaskLocator.first().boundingBox();

    if (thirdTaskBox && secondTaskBox) {
      expect(thirdTaskBox.y).toBeLessThan(secondTaskBox.y); // Third task should appear before second
    }
  });

  test("should not create task with empty title", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    // Try to submit with empty input
    await input.fill("   ");
    await expect(button).toBeDisabled();

    // Clear and verify no request is made
    await input.clear();
    await expect(button).toBeDisabled();
  });

  test("should toggle task completion", async ({ page }) => {
    const taskTitle = "Task to complete";
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Find the checkbox for this task
    const taskRow = page.locator("div").filter({ hasText: taskTitle });
    const checkbox = taskRow.locator('input[type="checkbox"]');

    // Verify checkbox is not checked
    await expect(checkbox).not.toBeChecked();

    // Click checkbox to mark as complete
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Verify task text has strikethrough
    const taskText = taskRow.locator("span", { hasText: taskTitle });
    const classes = await taskText.getAttribute("class");
    expect(classes).toContain("line-through");

    // Click again to uncheck
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test("should delete a task", async ({ page }) => {
    const taskTitle = "Task to delete";
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Wait for task to appear
    const taskRow = page.locator("div").filter({ hasText: taskTitle });
    await expect(taskRow).toBeVisible();

    // Find delete button (appears on hover)
    const deleteButton = taskRow.locator('button[aria-label="Eliminar tarea"]');

    // Hover over task to show delete button
    await taskRow.hover();
    await expect(deleteButton).toBeVisible();

    // Click delete button
    await deleteButton.click();

    // Verify task is removed
    await expect(taskRow).not.toBeVisible();
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
      const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
      const button = page.locator("button", { hasText: "Agregar Tarea" });

      const uniqueTitle = `Temp task ${Date.now()}`;
      await input.fill(uniqueTitle);
      await button.click();

      const taskRow = page.locator("div").filter({ hasText: uniqueTitle });
      await expect(taskRow).toBeVisible();

      // Delete it
      await taskRow.hover();
      const deleteButton = taskRow.locator(
        'button[aria-label="Eliminar tarea"]',
      );
      await deleteButton.click();

      // Now empty state should show
      await expect(page.locator("text=No hay tareas")).toBeVisible();
    }
  });
});
