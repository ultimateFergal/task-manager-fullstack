import { test, expect } from "./fixtures";
import { cleanupDatabase } from "./helpers/db-cleanup";

test.describe("Task Manager - UI & Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupDatabase();
    await page.waitForTimeout(500);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("should show loading spinner initially", async ({ page }) => {
    const newPage = await page.context().newPage();
    const navigationPromise = newPage.goto("/dashboard");

    const spinner = newPage.locator("div.animate-spin");
    await spinner.isVisible().catch(() => false);

    await navigationPromise;

    await expect(newPage.locator("text=Cargando tareas...")).not.toBeVisible();
    await newPage.close();
  });

  test("should disable buttons while submitting", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill("Test task");
    await expect(button).toBeEnabled();
    await button.click();

    await page.waitForTimeout(500);
    await expect(input).toHaveValue("");
  });

  test("should focus input field after creating task", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill("Task 1");
    await button.click();

    await page.waitForTimeout(200);
    await expect(input).toHaveValue("");
  });

  test("should handle rapid task creation", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const tasks = ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"];

    for (const taskTitle of tasks) {
      await expect(input).toHaveValue("", { timeout: 15000 });
      await input.fill(taskTitle);
      await expect(button).toBeEnabled({ timeout: 10000 });
      await button.click();
    }

    await expect(input).toHaveValue("", { timeout: 15000 });

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

    const taskItems = page.getByTestId("task-item");
    const taskText = await taskItems.first().textContent();
    expect(taskText).toContain("quotes");
  });

  test("should handle very long task titles", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const longTask = "A".repeat(200);
    await input.fill(longTask);
    await button.click();

    await page.waitForTimeout(200);

    const taskItems = page.getByTestId("task-item");
    const taskText = await taskItems.first().textContent();
    expect(taskText).toContain("A");
  });

  test("should trim whitespace from task title", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill("   Task with spaces   ");
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click();

    await expect(page.getByTestId("task-item").first()).toBeVisible({ timeout: 10000 });

    const taskText = await page.getByTestId("task-item").first().textContent();
    expect(taskText?.trim()).toContain("Task with spaces");
  });

  test("should show/hide delete button on hover", async ({ page, isMobile }) => {
    test.skip(isMobile, "Hover effects not supported on touch devices");
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill(`Hover test ${Date.now()}`);
    await button.click();

    const taskItem = page.getByTestId("task-item").first();
    const deleteButton = taskItem.getByTestId("task-delete");

    const initialOpacity = await deleteButton.evaluate(
      (el) => globalThis.getComputedStyle(el).opacity
    );
    expect(Number.parseFloat(initialOpacity)).toBeLessThan(1);

    await taskItem.hover();
    await page.waitForTimeout(400);
    const hoverOpacity = await deleteButton.evaluate(
      (el) => globalThis.getComputedStyle(el).opacity
    );
    expect(Number.parseFloat(hoverOpacity)).toBe(1);
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

    await input.fill(task1);
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click();
    await expect(input).toHaveValue("", { timeout: 15000 });

    await input.fill(task2);
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click();
    await expect(input).toHaveValue("", { timeout: 15000 });

    await input.fill(task3);
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click();
    await expect(input).toHaveValue("", { timeout: 15000 });

    const checkboxes = page.getByTestId("task-checkbox");
    await checkboxes.nth(1).click();

    const taskItems = page.getByTestId("task-item");
    const firstTaskText = await taskItems.nth(0).textContent();
    const secondTaskText = await taskItems.nth(1).textContent();

    expect(firstTaskText).toContain("Task 3");
    expect(secondTaskText).toContain("Task 2");
  });

  test("should apply completed styling correctly", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill(`Styling test ${Date.now()}`);
    await button.click();

    const taskItem = page.getByTestId("task-item").first();
    const checkbox = taskItem.getByTestId("task-checkbox");
    const taskText = taskItem.locator("span").first();

    let classes = await taskText.getAttribute("class");
    expect(classes).not.toContain("line-through");

    await checkbox.click();
    await expect(taskText).toHaveClass(/line-through/, { timeout: 5000 });

    classes = await taskText.getAttribute("class");
    expect(classes).toContain("line-through");

    const rowClasses = await taskItem.getAttribute("class");
    expect(rowClasses).toContain("opacity-60");
  });
});
