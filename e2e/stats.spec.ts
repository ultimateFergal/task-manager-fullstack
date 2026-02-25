import { test, expect } from "@playwright/test";

test.describe("Task Manager - Statistics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display stats when tasks exist", async ({ page }) => {
    const input = page.locator('input[placeholder="Que necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    // Create a task so stats are visible
    await input.fill("Task for stats");
    await button.click();

    // Wait for stats to appear
    const totalLabel = page.locator("text=Total:");
    await expect(totalLabel).toBeVisible();

    // Verify all stat labels are present
    await expect(page.locator("text=Completadas:")).toBeVisible();
    await expect(page.locator("text=Pendientes:")).toBeVisible();
  });

  test("should update total count when task is added", async ({ page }) => {
    const input = page.locator('input[placeholder="¿Qué necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    // Get initial total
    const totalStatsContainer = page.locator('span:has-text("Total:")');
    let initialText = await totalStatsContainer.textContent();
    const initialMatch = initialText?.match(/(\d+)/);
    const initialCount = initialMatch ? parseInt(initialMatch[1]) : 0;

    // Add a task
    await input.fill("New task for count");
    await button.click();

    // Wait a moment for UI update
    await page.waitForTimeout(200);

    // Get new total
    const newText = await totalStatsContainer.textContent();
    const newMatch = newText?.match(/(\d+)/);
    const newCount = newMatch ? parseInt(newMatch[1]) : 0;

    expect(newCount).toBe(initialCount + 1);
  });

  test("should track completed vs pending tasks", async ({ page }) => {
    const input = page.locator('input[placeholder="Que necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

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
    let pendingText = await page.locator("text=Pendientes:").textContent();
    expect(pendingText).toContain("2");

    let completedText = await page.locator("text=Completadas:").textContent();
    expect(completedText).toContain("0");

    // Mark first task as completed
    const taskRow1 = page.locator("div").filter({ hasText: task1 });
    const checkbox1 = taskRow1.locator('input[type="checkbox"]');
    await checkbox1.click();

    // Wait for UI update
    await page.waitForTimeout(200);

    // Verify: 1 pending, 1 completed
    pendingText = await page.locator("text=Pendientes:").textContent();
    expect(pendingText).toContain("1");

    completedText = await page.locator("text=Completadas:").textContent();
    expect(completedText).toContain("1");

    // Mark second task as completed
    const taskRow2 = page.locator("div").filter({ hasText: task2 });
    const checkbox2 = taskRow2.locator('input[type="checkbox"]');
    await checkbox2.click();

    await page.waitForTimeout(200);

    // Verify: 0 pending, 2 completed
    pendingText = await page.locator("text=Pendientes:").textContent();
    expect(pendingText).toContain("0");

    completedText = await page.locator("text=Completadas:").textContent();
    expect(completedText).toContain("2");
  });

  test("should update stats when task is deleted", async ({ page }) => {
    const input = page.locator('input[placeholder="Que necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    const taskTitle = `Task to delete for stats ${Date.now()}`;

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Get total before delete
    const totalBefore = await page.locator("text=Total:").textContent();
    const totalBeforeNum = totalBefore?.match(/(\d+)/)?.[1];

    // Delete the task
    const taskRow = page.locator("div").filter({ hasText: taskTitle });
    await taskRow.hover();
    const deleteButton = taskRow.locator('button[aria-label="Eliminar tarea"]');
    await deleteButton.click();

    await page.waitForTimeout(200);

    // Get total after delete
    const totalAfter = await page.locator("text=Total:").textContent();
    const totalAfterNum = totalAfter?.match(/(\d+)/)?.[1];

    const before = totalBeforeNum ? parseInt(totalBeforeNum) : 0;
    const after = totalAfterNum ? parseInt(totalAfterNum) : 0;

    expect(after).toBe(before - 1);
  });

  test("should hide stats when no tasks remain", async ({ page }) => {
    const input = page.locator('input[placeholder="Que necesitas hacer?"]');
    const button = page.locator("button", { hasText: "Agregar Tarea" });

    const taskTitle = `Temp task ${Date.now()}`;

    // Create a task
    await input.fill(taskTitle);
    await button.click();

    // Verify stats are visible
    await expect(page.locator("text=Total:")).toBeVisible();

    // Delete the task
    const taskRow = page.locator("div").filter({ hasText: taskTitle });
    await taskRow.hover();
    const deleteButton = taskRow.locator('button[aria-label="Eliminar tarea"]');
    await deleteButton.click();

    await page.waitForTimeout(200);

    // Stats should be hidden
    const statsContainer = page.locator('span:has-text("Total:")');
    const isVisible = await statsContainer.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});
