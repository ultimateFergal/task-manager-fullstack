import { createClient } from "@supabase/supabase-js";

/**
 * Cleanup helper for test database
 * Deletes all tasks before each test to ensure clean state
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "⚠️  Test database credentials not found. Make sure to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.test"
  );
}

const supabase = createClient(supabaseUrl || "", supabaseServiceKey || "");

/** Deletes all tasks from the test database */
export async function cleanupDatabase() {
  try {
    const { error } = await supabase.from("tasks").delete().neq("id", "");

    if (error) {
      console.error("❌ Error cleaning up database:", error);
      throw error;
    }

    console.log("✅ Database cleaned up successfully");
  } catch (error) {
    console.error("Failed to cleanup database:", error);
    // Don't throw - allow tests to continue even if cleanup fails
  }
}

/** Seeds test database with sample data (optional) */
export async function seedTestData() {
  try {
    const sampleTasks = [
      { title: "Sample task 1", completed: false },
      { title: "Sample task 2", completed: false },
      { title: "Completed sample task", completed: true },
    ];

    const { error } = await supabase.from("tasks").insert(sampleTasks);

    if (error) {
      console.error("❌ Error seeding database:", error);
      throw error;
    }

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
