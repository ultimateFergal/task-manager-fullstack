import { expect, type Page } from "@playwright/test";

/**
 * Hace login como un usuario existente vía la UI y espera hasta llegar al dashboard.
 *
 * Usa press("Enter") en lugar de button.click() para mayor fiabilidad en WebKit/Mobile Safari,
 * donde button.click() puede no disparar onSubmit de React de forma consistente.
 * Usa expect().toHaveURL() (polling) en lugar de waitForURL() (event-based) para
 * detectar la navegación incluso si el evento CDP no se emite correctamente en WebKit.
 */
export async function loginAsUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("password-input").press("Enter");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

/**
 * Completa el formulario de registro y espera la redirección a /login.
 * Usa las mismas técnicas cross-browser que loginAsUser.
 */
export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/register");
  await page.getByTestId("name-input").fill(name);
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("confirm-password-input").fill(password);
  await page.getByTestId("confirm-password-input").press("Enter");
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
}
