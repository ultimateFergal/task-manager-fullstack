import { test as base, expect } from "@playwright/test";
import { cleanupRegisterUser } from "./helpers/db-cleanup";
import {
  TEST_USER_EMAIL,
  TEST_REGISTER_EMAIL,
  TEST_REGISTER_PASSWORD,
  TEST_REGISTER_NAME,
} from "./helpers/test-constants";

/**
 * Tests del flujo de registro — se ejecutan SIN sesión autenticada.
 * beforeEach limpia el usuario de registro para que los tests sean repetibles.
 */
const test = base.extend<Record<string, never>>({
  storageState: { cookies: [], origins: [] },
});

test.describe("Register - Flujo de registro", () => {
  test.beforeEach(async () => {
    await cleanupRegisterUser();
  });

  test("muestra el formulario con todos los campos requeridos", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByTestId("name-input")).toBeVisible();
    await expect(page.getByTestId("email-input")).toBeVisible();
    await expect(page.getByTestId("password-input")).toBeVisible();
    await expect(page.getByTestId("confirm-password-input")).toBeVisible();
    await expect(page.getByTestId("register-button")).toBeVisible();
  });

  test("muestra error cuando la contraseña tiene menos de 8 caracteres", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("name-input").fill("Test User");
    await page.getByTestId("email-input").fill("test@example.com");
    await page.getByTestId("password-input").fill("1234567");
    await page.getByTestId("confirm-password-input").fill("1234567");
    await page.getByTestId("register-button").click();
    await expect(page.getByTestId("error-message")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("error-message")).toContainText("8 caracteres");
    await expect(page).toHaveURL(/\/register/);
  });

  test("muestra error cuando las contraseñas no coinciden", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("name-input").fill("Test User");
    await page.getByTestId("email-input").fill("test@example.com");
    await page.getByTestId("password-input").fill("password123");
    await page.getByTestId("confirm-password-input").fill("different456");
    await page.getByTestId("register-button").click();
    await expect(page.getByTestId("error-message")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("error-message")).toContainText("no coinciden");
    await expect(page).toHaveURL(/\/register/);
  });

  test("muestra error cuando el email ya está registrado", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("name-input").fill("Test User");
    await page.getByTestId("email-input").fill(TEST_USER_EMAIL); // usuario existente
    await page.getByTestId("password-input").fill("password123");
    await page.getByTestId("confirm-password-input").fill("password123");
    await page.getByTestId("register-button").click();
    await expect(page.getByTestId("error-message")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("error-message")).toContainText("registrado");
    await expect(page).toHaveURL(/\/register/);
  });

  test("registro exitoso redirige a /login con mensaje de éxito", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("name-input").fill(TEST_REGISTER_NAME);
    await page.getByTestId("email-input").fill(TEST_REGISTER_EMAIL);
    await page.getByTestId("password-input").fill(TEST_REGISTER_PASSWORD);
    await page.getByTestId("confirm-password-input").fill(TEST_REGISTER_PASSWORD);
    await page.getByTestId("register-button").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByTestId("success-message")).toBeVisible();
    await expect(page.getByTestId("success-message")).toContainText("exitosamente");
  });

  test("tiene enlace de vuelta a /login", async ({ page }) => {
    await page.goto("/register");
    const link = page.getByRole("link", { name: /inicia sesión/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
