import { test, expect } from "../fixtures/pages.fixture";
import type { Locale } from "../pages/base.page";

/**
 * Client-side error-handling regression test.
 *
 * The /api/favorites/count endpoint returns a 302 redirect to /login for
 * unauthenticated users. The client's fetch call catches the resulting
 * JSON-parse failure internally and logs it via console.error (it is not an
 * uncaught exception, so a `pageerror` listener would never observe it) —
 * confirmed live: "Error fetching favorites count: SyntaxError: Unexpected
 * token '<', "<!DOCTYPE "... is not valid JSON".
 *
 * This test asserts that error is not logged on page load across all three
 * in-scope locales. The expected behavior is either a 200 JSON response or
 * the client skipping the call entirely when no session exists.
 */

const LOCALES: Locale[] = ["en", "es", "de"];

test.describe("API error handling", () => {
  for (const locale of LOCALES) {
    test(`TC-API-001 — /api/favorites/count does not error on unauthenticated load (locale=${locale})`, async ({ page }) => {
      test.info().annotations.push({ type: "test-case", description: "TC-API-001" });

      const consoleErrors: string[] = [];

      // The defect surfaces as a caught-and-logged console.error, not an
      // uncaught exception — listen on "console", not "pageerror".
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      // Navigate unauthenticated — the home page triggers the favorites-count
      // call. Using direct page.goto because this test does not need a Page
      // Object fixture; it inspects raw console/network behavior.
      await page.goto(`/?_locale=${locale}`);

      // Wait for the favorites endpoint to resolve (or fail).
      await page.waitForLoadState("networkidle");

      // Assert no favorites/JSON-parse error was logged.
      const favoritesErrors = consoleErrors.filter((text) =>
        /favorites/i.test(text) || /json/i.test(text)
      );
      expect(favoritesErrors).toHaveLength(0);
    });
  }
});
