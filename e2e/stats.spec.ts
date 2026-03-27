import { test, expect } from "./fixtures";
import { cleanupDatabase } from "./helpers/db-cleanup";

test.describe("Task Manager - Statistics", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupDatabase();
    await page.waitForTimeout(500);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("should display stats when tasks exist", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill("Task for stats");
    await button.click();

    const statsTotal = page.getByTestId("stats-total");
    await expect(statsTotal).toBeVisible();
    await expect(page.getByTestId("stats-completed")).toBeVisible();
    await expect(page.getByTestId("stats-pending")).toBeVisible();
  });

  test("should update total count when task is added", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");
    const statsTotal = page.getByTestId("stats-total");

    await input.fill("First task to show stats");
    await button.click();
    await expect(input).toHaveValue("", { timeout: 15000 });

    await expect(statsTotal).toBeVisible({ timeout: 5000 });

    const initialText = await statsTotal.textContent();
    const initialCount = Number.parseInt(initialText?.match(/(\d+)/)?.[1] ?? "0");

    await input.fill("New task for count");
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click();
    await expect(input).toHaveValue("", { timeout: 15000 });

    const newText = await statsTotal.textContent();
    const newCount = Number.parseInt(newText?.match(/(\d+)/)?.[1] ?? "0");

    expect(newCount).toBe(initialCount + 1);
  });

  test("should track completed vs pending tasks", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    const uniqueId = Date.now();
    await input.fill(`Task 1 ${uniqueId}`);
    await button.click();
    await expect(input).toHaveValue("", { timeout: 15000 });

    await input.fill(`Task 2 ${uniqueId}`);
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click();
    await expect(input).toHaveValue("", { timeout: 15000 });

    const statsPending = page.getByTestId("stats-pending");
    const statsCompleted = page.getByTestId("stats-completed");

    await expect(statsPending).toBeVisible({ timeout: 5000 });
    await expect(statsCompleted).toBeVisible({ timeout: 5000 });

    expect(await statsPending.textContent()).toContain("2");
    expect(await statsCompleted.textContent()).toContain("0");

    const checkboxes = page.getByTestId("task-checkbox");
    await checkboxes.first().click();
    await page.waitForTimeout(200);

    expect(await statsPending.textContent()).toContain("1");
    expect(await statsCompleted.textContent()).toContain("1");

    await checkboxes.nth(1).click();
    await page.waitForTimeout(200);

    expect(await statsPending.textContent()).toContain("0");
    expect(await statsCompleted.textContent()).toContain("2");
  });

  test("should update stats when task is deleted", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");
    const statsTotal = page.getByTestId("stats-total");

    await input.fill(`Task to delete for stats ${Date.now()}`);
    await button.click();

    await expect(statsTotal).toBeVisible({ timeout: 5000 });
    const totalBefore = Number.parseInt(
      (await statsTotal.textContent())?.match(/(\d+)/)?.[1] ?? "0"
    );

    const taskItem = page.getByTestId("task-item").first();
    await taskItem.hover();
    await taskItem.getByTestId("task-delete").click();
    await page.waitForTimeout(200);

    const isVisible = await statsTotal.isVisible().catch(() => false);
    if (isVisible) {
      const totalAfter = Number.parseInt(
        (await statsTotal.textContent())?.match(/(\d+)/)?.[1] ?? "0"
      );
      expect(totalAfter).toBe(totalBefore - 1);
    } else {
      expect(totalBefore).toBeGreaterThan(0);
    }
  });

  test("should hide stats when no tasks remain", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill(`Temp task ${Date.now()}`);
    await button.click();

    const statsTotal = page.getByTestId("stats-total");
    await expect(statsTotal).toBeVisible();

    const taskItem = page.getByTestId("task-item").first();
    await taskItem.hover();
    await taskItem.getByTestId("task-delete").click();
    await page.waitForTimeout(200);

    await expect(statsTotal).not.toBeVisible();
  });
});
