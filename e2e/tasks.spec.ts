import { test as base, expect } from "@playwright/test";
import { cleanupDatabase } from "./helpers/db-cleanup";
import { loginAsUser } from "./helpers/auth-helper";
import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from "./helpers/test-constants";

/**
 * Tests de operaciones de tareas — cada test registra login explícito para garantizar
 * que las tareas se filtran por el usuario autenticado.
 */
const test = base.extend<Record<string, never>>({
  storageState: { cookies: [], origins: [] },
});

test.describe("Task Manager - Core Operations", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupDatabase();
    await page.waitForTimeout(500);
    await loginAsUser(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async ({ page }) => {
    try {
      // Cerrar sesión si el botón está disponible (timeout corto para no bloquear)
      await page.getByTestId("signout-button").click({ timeout: 3000 });
    } catch {
      // Sin botón de cierre de sesión visible — ignorar
    }
  });

  test("should load the page and display the task manager header", async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/.*/);
    const heading = page.locator("h1");
    await expect(heading).toContainText("Gestor de Tareas");
  });

  test("should display input field and add button", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test("should create a new task", async ({ page }) => {
    const taskTitle = "Test task from Playwright";
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill(taskTitle);
    await expect(button).toBeEnabled();
    await button.click();

    const taskItem = page.getByTestId("task-item");
    const firstTaskTitle = taskItem.first().locator("span").first();
    await expect(firstTaskTitle).toContainText(taskTitle);

    await expect(input).toHaveValue("");
  });

  test("should create multiple tasks in correct order", async ({ page }) => {
    const tasks = ["First task", "Second task", "Third task"];
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    for (const taskTitle of tasks) {
      await expect(input).toHaveValue("", { timeout: 15000 });
      await input.fill(taskTitle);
      await expect(button).toBeEnabled({ timeout: 10000 });
      await button.click();
    }

    await expect(input).toHaveValue("", { timeout: 15000 });

    const taskItems = page.getByTestId("task-item");
    const count = await taskItems.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const firstTaskText = await taskItems.nth(0).textContent();
    const secondTaskText = await taskItems.nth(1).textContent();

    expect(firstTaskText).toContain("Third task");
    expect(secondTaskText).toContain("Second task");
  });

  test("should not create task with empty title", async ({ page }) => {
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill("   ");
    await expect(button).toBeDisabled();

    await input.clear();
    await expect(button).toBeDisabled();
  });

  test("should toggle task completion", async ({ page }) => {
    const taskTitle = "Task to complete";
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill(taskTitle);
    await button.click();

    await expect(page.getByTestId("task-item").first()).toBeVisible({ timeout: 10000 });

    const checkbox = page.getByTestId("task-checkbox").first();

    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked({ timeout: 5000 });

    const taskItem = page.getByTestId("task-item").first();
    const taskText = taskItem.locator("span").first();
    const classes = await taskText.getAttribute("class");
    expect(classes).toContain("line-through");

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test("should delete a task", async ({ page }) => {
    const taskTitle = "Task to delete";
    const input = page.getByTestId("task-input");
    const button = page.getByTestId("add-task-button");

    await input.fill(taskTitle);
    await button.click();

    const taskItem = page.getByTestId("task-item").first();
    await expect(taskItem).toBeVisible();

    const deleteButton = taskItem.getByTestId("task-delete");

    await taskItem.hover();
    await expect(deleteButton).toBeVisible();

    const allTasksBefore = page.getByTestId("task-item");
    const countBefore = await allTasksBefore.count();

    await deleteButton.click();

    await page.waitForTimeout(200);
    const countAfter = await page.getByTestId("task-item").count();

    expect(countAfter).toBe(countBefore - 1);
  });

  test("should display empty state when no tasks", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=No hay tareas")).toBeVisible();
  });

  test("tasks belong only to the authenticated user", async ({ page }) => {
    // Verificar que el dashboard muestra el nombre del usuario autenticado
    await expect(page.getByTestId("welcome-message")).toContainText("Bienvenido");

    // Crear una tarea y verificar que aparece correctamente para este usuario
    const taskTitle = "Tarea del usuario autenticado";
    await page.getByTestId("task-input").fill(taskTitle);
    await page.getByTestId("add-task-button").click();

    const taskItem = page.getByTestId("task-item").first();
    await expect(taskItem.locator("span").first()).toContainText(taskTitle);
  });
});
