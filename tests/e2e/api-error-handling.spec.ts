import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";

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
 * in-scope locales. The expected behavior is either a JSON error response
 * (e.g. 401) or the client skipping the call entirely when no session
 * exists. Open defect D-01, so the test is marked test.fail() until fixed.
 */

const LOCALES: Locale[] = ["en", "es", "de"];

test.describe("API error handling", () => {
  for (const locale of LOCALES) {
    test(`TC-API-001 — /api/favorites/count does not error on unauthenticated load (locale=${locale})`, { tag: ["@p1", "@regression"] }, async ({ homePage, page }) => {
      test.info().annotations.push({ type: "test-case", description: "TC-API-001" });
      test.fail(true, "Open defect D-01: favorites-count JSON-parse error logged for unauthenticated visitors");

      // The defect surfaces as a caught-and-logged console.error, not an
      // uncaught exception — so wait on "console", not "pageerror". The
      // error is logged within a second or two of load while the defect
      // exists; 5s is the observation window once it is fixed.
      const favoritesError = page
        .waitForEvent("console", {
          predicate: (msg) => msg.type() === "error" && /favorites|json/i.test(msg.text()),
          timeout: 5_000,
        })
        .then((msg) => msg.text(), () => null);

      await homePage.goto(locale);

      expect(await favoritesError, "favorites-count error logged on page load").toBeNull();
    });
  }
});
