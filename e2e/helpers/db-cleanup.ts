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

/** Deletes all tasks from the test database and verifies completion */
export async function cleanupDatabase() {
  try {
    console.log(
      "🧹 Cleaning up test database...",
      supabaseUrl ? "✓ URL found" : "✗ URL missing"
    );

    // Delete all tasks - try multiple times if needed
    let allDeleted = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!allDeleted && attempts < maxAttempts) {
      attempts++;

      const { error: deleteError, count } = await supabase
        .from("tasks")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Always true - no UUID matches this

      if (deleteError) {
        console.error(`❌ Delete attempt ${attempts} failed:`, deleteError);
        throw deleteError;
      }

      console.log(`✅ Delete attempt ${attempts}: deleted ${count} tasks`);

      // Wait before verifying
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify deletion by fetching remaining tasks
      const { data: remainingTasks, error: fetchError } = await supabase
        .from("tasks")
        .select("id", { count: "exact" });

      if (fetchError) {
        console.warn(`⚠️  Could not verify cleanup on attempt ${attempts}:`, fetchError.message);
        continue;
      }

      if (remainingTasks && remainingTasks.length > 0) {
        console.warn(
          `⚠️  Attempt ${attempts}: ${remainingTasks.length} tasks still in database. Retrying...`
        );
      } else {
        console.log("✅ Verified: Database is empty");
        allDeleted = true;
      }
    }

    if (!allDeleted && attempts >= maxAttempts) {
      throw new Error(`Failed to cleanup database after ${maxAttempts} attempts`);
    }
  } catch (error) {
    console.error("❌ Critical: Failed to cleanup database:", error);
    throw error; // Throw so test fails if cleanup fails
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
