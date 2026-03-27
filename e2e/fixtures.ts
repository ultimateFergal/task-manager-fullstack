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
  // eslint-disable-next-line no-empty-pattern
  cleanDatabase: async ({}, use) => {
    await cleanupDatabase();
    await use();
  },
});

export { expect } from '@playwright/test';
