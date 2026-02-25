import { test as base, expect } from "@playwright/test";
import { cleanupDatabase } from "./helpers/db-cleanup";

/**
 * Extended test fixture with automatic database cleanup
 * Ensures each test starts with a clean database state
 */

type TestFixtures = {
  cleanDatabase: void;
};

export const test = base.extend<TestFixtures>({
  cleanDatabase: async ({}, use) => {
    // Run cleanup before each test
    await cleanupDatabase();

    // Run the test
    await use();

    // Optionally cleanup after test as well
    // await cleanupDatabase();
  },
});

export { expect };
