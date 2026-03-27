import { test as base, expect } from "@playwright/test";

/**
 * Tests de protección de rutas — se ejecutan SIN sesión autenticada
 * para verificar que el middleware redirige correctamente a /login.
 * Usa el test base de Playwright (sin storageState) para empezar sin sesión.
 */
const test = base.extend({
  storageState: { cookies: [], origins: [] },
});

test.describe("Auth - Protección de rutas", () => {
  test("redirige / a /login cuando no hay sesión", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirige /dashboard a /login cuando no hay sesión", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("devuelve 401 en /api/tasks GET sin sesión", async ({ request }) => {
    const response = await request.get("/api/tasks");
    expect(response.status()).toBe(401);
  });

  test("devuelve 401 en /api/tasks POST sin sesión", async ({ request }) => {
    const response = await request.post("/api/tasks", {
      data: { title: "Tarea sin auth" },
    });
    expect(response.status()).toBe(401);
  });

  test("muestra el formulario de login en /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("/api/auth no está bloqueado por el middleware", async ({ request }) => {
    // El endpoint de providers debe responder (no 401)
    const response = await request.get("/api/auth/providers");
    expect(response.status()).not.toBe(401);
  });
});
