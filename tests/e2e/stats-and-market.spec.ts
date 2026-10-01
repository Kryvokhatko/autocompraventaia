import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";
import { AUTH_FILE } from "../../helpers/test-user";

/**
 * Stats-analytics and below-market regression tests.
 *
 * Read-only checks, so they run as the shared paid account signed in by
 * tests/setup/auth.setup.ts.
 */

test.use({ storageState: AUTH_FILE });

test.describe("Stats analytics", () => {
  test("TC-STATS-001 — Analytics page renders for an authenticated user", { tag: ["@p1"] }, async ({ statsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-STATS-001" });

    await statsPage.goto("en");

    await expect(statsPage.heading).toBeVisible();
    await expect(statsPage.calendarView).toBeVisible();

    await expect(statsPage.tabCount()).resolves.toBe(8);
    await expect(statsPage.tab("Overview")).toBeVisible();
  });

  // Regression gate for open defect D-11: the analytics page logs repeated
  // resource-load failures (410/404) in the browser console. The test asserts
  // the correct behavior (zero such errors) and is marked as an expected
  // failure until the defect is fixed.
  test("TC-STATS-002 — Analytics page triggers repeated resource-load failures (410/404) in console", { tag: ["@p2", "@regression"] }, async ({ statsPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-STATS-002" });
    test.fail(true, "Open defect D-11: analytics page logs 410/404 resource-load failures");

    // Each console "Failed to load resource" error is the browser reporting
    // one 404/410 response (calendar car images of removed listings), so
    // count the responses themselves — the console message can arrive a tick
    // after the response and be missed.
    const failedResources: string[] = [];
    page.on("response", (response) => {
      if ([404, 410].includes(response.status())) failedResources.push(`${response.status()} ${response.url()}`);
    });

    await statsPage.goto("en");
    await expect(statsPage.calendarView).toBeVisible();
    // The calendar opens on the current month, which early in a month has
    // few or no sales and therefore no images; the previous month always has
    // a full month of sales, so the check does not depend on today's date.
    await test.step("Show the previous month's sales", () => statsPage.previousMonthButton.click());

    // The images are requested several seconds after the calendar renders,
    // and the page keeps background requests open so "networkidle" never
    // settles. Wait up to 10s for the first 404/410 response instead — it
    // arrives within a few seconds while the defect exists, and 10s is the
    // observation window once it is fixed.
    await page
      .waitForResponse((response) => [404, 410].includes(response.status()), { timeout: 10_000 })
      .catch(() => {});

    expect(failedResources).toHaveLength(0);
  });
});

test.describe("Below-market localization", () => {
  // Regression gate for open defect D-10: the below-market page stays in
  // Spanish under EN and DE. The test asserts the correct behavior (Spanish
  // strings absent) and is marked as an expected failure until fixed.
  for (const locale of (["en", "de"] as Locale[])) {
    test(`TC-MARKET-001 — Below-market page does not localize for ${locale.toUpperCase()} locale`, { tag: ["@p1", "@regression"] }, async ({ belowMarketPage }) => {
      test.info().annotations.push({ type: "test-case", description: "TC-MARKET-001" });
      test.fail(true, "Open defect D-10: below-market page stays in Spanish under EN/DE");

      await belowMarketPage.goto(locale);

      const body = await belowMarketPage.bodyText();

      expect(body).not.toContain("Coches por debajo del precio de mercado");
      expect(body).not.toContain("España 🇪🇸");
      expect(body).not.toContain("Ahorro vs 2ª:");
    });
  }
});
