import { test, expect } from "./fixtures";
import { TEST_USER_NAME } from "./helpers/test-constants";

/**
 * Tests de autenticación en el dashboard — verifican la información de sesión
 * visible al usuario y el flujo de cierre de sesión.
 * Se ejecutan CON sesión autenticada (storageState por defecto).
 */
test.describe("Dashboard - Auth", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("muestra el mensaje de bienvenida con el nombre del usuario", async ({ page }) => {
    const welcome = page.getByTestId("welcome-message");
    await expect(welcome).toBeVisible();
    await expect(welcome).toContainText("Bienvenido");
    await expect(welcome).toContainText(TEST_USER_NAME);
  });

  test("muestra el botón de cerrar sesión", async ({ page }) => {
    await expect(page.getByTestId("signout-button")).toBeVisible();
  });

  test("cerrar sesión redirige a /login", async ({ page }) => {
    await page.getByTestId("signout-button").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("tras cerrar sesión, /dashboard redirige a /login", async ({ page }) => {
    await page.getByTestId("signout-button").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    // La sesión fue eliminada — el dashboard debe protegerse
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
