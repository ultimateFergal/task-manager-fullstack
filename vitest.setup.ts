import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/** Clean up the DOM after each test to prevent state leaking between tests */
afterEach(() => {
  cleanup();
});
