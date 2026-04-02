import { test as base, expect } from "@playwright/test";
import {
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  TEST_REGISTER_EMAIL,
  TEST_REGISTER_PASSWORD,
  TEST_REGISTER_NAME,
} from "./helpers/test-constants";
import { cleanupRegisterUser } from "./helpers/db-cleanup";
import { registerUser, loginAsUser } from "./helpers/auth-helper";

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

  test("/api/register no está bloqueado por el middleware", async ({ request }) => {
    // Debe responder con 400 (validación), no 401 (middleware bloqueó)
    const response = await request.post("/api/register", {
      data: { name: "", email: "", password: "" },
    });
    expect(response.status()).toBe(400);
  });

  test("/register es accesible sin sesión", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId("register-button")).toBeVisible();
  });
});

test.describe("Auth - Flujo de login", () => {
  test("credenciales válidas redirigen al dashboard con bienvenida", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email-input").fill(TEST_USER_EMAIL);
    await page.getByTestId("password-input").fill(TEST_USER_PASSWORD);
    await page.getByTestId("signin-button").click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByTestId("welcome-message")).toContainText("Bienvenido");
  });

  test("credenciales inválidas muestran mensaje de error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email-input").fill(TEST_USER_EMAIL);
    await page.getByTestId("password-input").fill("contraseña-incorrecta");
    await page.getByTestId("signin-button").click();
    await expect(page.getByTestId("error-message")).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("la página de login tiene enlace a /register", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: /regístrate/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe("Auth - Flujo de registro completo", () => {
  test.beforeEach(async () => {
    await cleanupRegisterUser();
  });

  test("registro exitoso redirige a /login con mensaje de éxito", async ({ page }) => {
    await registerUser(page, TEST_REGISTER_NAME, TEST_REGISTER_EMAIL, TEST_REGISTER_PASSWORD);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("success-message")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("success-message")).toContainText("exitosamente");
  });

  test("usuario registrado puede hacer login inmediatamente", async ({ page }) => {
    await registerUser(page, TEST_REGISTER_NAME, TEST_REGISTER_EMAIL, TEST_REGISTER_PASSWORD);
    await loginAsUser(page, TEST_REGISTER_EMAIL, TEST_REGISTER_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("welcome-message")).toContainText("Bienvenido");
  });
});

/**
 * Tests de cierre de sesión — se ejecutan CON sesión autenticada (storageState por defecto).
 * Usa el fixture base de Playwright para no sobreescribir el storageState.
 */
const authenticatedTest = base;

authenticatedTest.describe("Auth - Cierre de sesión", () => {
  authenticatedTest.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  authenticatedTest("cerrar sesión redirige a /login", async ({ page }) => {
    await page.getByTestId("signout-button").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  authenticatedTest("tras cerrar sesión, /dashboard redirige a /login", async ({ page }) => {
    await page.getByTestId("signout-button").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
