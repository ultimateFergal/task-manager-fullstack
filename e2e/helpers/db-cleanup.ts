import { createClient } from "@supabase/supabase-js";
import { TEST_USER_EMAIL, TEST_REGISTER_EMAIL } from "./test-constants";

/**
 * Cleanup helper para la base de datos de test.
 * Elimina únicamente las tareas del usuario de prueba E2E para no afectar otros usuarios.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "⚠️  Test database credentials not found. Make sure to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.test"
  );
}

const supabase = createClient(supabaseUrl || "", supabaseServiceKey || "");

/** Elimina todas las tareas del usuario de prueba y verifica que la BD quede limpia */
export async function cleanupDatabase() {
  try {
    console.log("🧹 Cleaning up test database...");

    // Obtener el UUID interno del usuario de prueba
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", TEST_USER_EMAIL)
      .single<{ id: string }>();

    if (userError || !user?.id) {
      console.warn("⚠️  Test user not found — skipping cleanup");
      return;
    }

    // Eliminar solo las tareas de ese usuario
    let allDeleted = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!allDeleted && attempts < maxAttempts) {
      attempts++;

      const { error: deleteError, count } = await supabase
        .from("tasks")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error(`❌ Delete attempt ${attempts} failed:`, deleteError);
        throw deleteError;
      }

      console.log(`✅ Delete attempt ${attempts}: deleted ${count ?? 0} tasks`);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const { data: remaining, error: fetchError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      if (fetchError) {
        console.warn(`⚠️  Could not verify cleanup on attempt ${attempts}:`, fetchError.message);
        continue;
      }

      if (remaining && remaining.length > 0) {
        console.warn(`⚠️  Attempt ${attempts}: ${remaining.length} tasks still in database. Retrying...`);
      } else {
        console.log("✅ Verified: Database is empty for test user");
        allDeleted = true;
      }
    }

    if (!allDeleted && attempts >= maxAttempts) {
      throw new Error(`Failed to cleanup database after ${maxAttempts} attempts`);
    }
  } catch (error) {
    console.error("❌ Critical: Failed to cleanup database:", error);
    throw error;
  }
}

/** Elimina el usuario de prueba de registro y sus tareas asociadas, con reintentos */
export async function cleanupRegisterUser() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", TEST_REGISTER_EMAIL)
      .maybeSingle<{ id: string }>();

    if (!user) return; // el usuario no existe, nada que limpiar

    await supabase.from("tasks").delete().eq("user_id", user.id);
    await supabase.from("users").delete().eq("id", user.id);

    // Pequeña pausa para que la BD refleje la eliminación
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
