import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_NAME } from "./helpers/test-constants";

/**
 * Configuración global E2E:
 * 1. Crea (o actualiza) el usuario de prueba en Supabase (mismo proyecto que el servidor)
 * 2. Realiza login vía UI y guarda el estado de sesión en e2e/.auth/user.json
 *
 * Las variables de entorno ya están cargadas por playwright.config.ts
 * (.env.local tiene prioridad sobre .env.test para que coincidan con el servidor en ejecución)
 */
export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Verifica .env.local o .env.test"
    );
  }

  // Crear cliente admin de Supabase
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Upsert del usuario de prueba con contraseña hasheada conocida
  const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 12);
  const { error } = await supabase
    .from("users")
    .upsert(
      { email: TEST_USER_EMAIL, name: TEST_USER_NAME, password: hashedPassword },
      { onConflict: "email" }
    );

  if (error) {
    throw new Error(`No se pudo crear el usuario de prueba: ${error.message}`);
  }

  // Crear directorio para el estado de sesión si no existe
  const authDir = path.resolve(process.cwd(), "e2e/.auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Iniciar sesión vía UI y guardar el estado de autenticación
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("http://localhost:3000/login");
  await page.fill("#email", TEST_USER_EMAIL);
  await page.fill("#password", TEST_USER_PASSWORD);

  // Capturar la navegación y el click en paralelo para no perder la respuesta
  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.context().storageState({ path: "e2e/.auth/user.json" });
  await browser.close();
}
