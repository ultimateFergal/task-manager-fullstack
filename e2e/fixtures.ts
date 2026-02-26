/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { cleanupDatabase } from "./helpers/db-cleanup";

/**
 * Extended test fixture with automatic database cleanup
 * Ensures each test starts with a clean database state
 */

type TestFixtures = {
  cleanDatabase: void;
};

export const test = base.extend<TestFixtures>({
  cleanDatabase: async ({ cleanDatabase }, use) => {
    // Run cleanup before each test
    await cleanupDatabase();

    // Run the test
    await use(cleanDatabase);

    // Optionally cleanup after test as well
    // await cleanupDatabase();
  },
});

export { expect } from '@playwright/test';
