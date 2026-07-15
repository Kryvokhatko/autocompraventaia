import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";

/**
 * Stats-analytics and below-market regression tests.
 *
 * These tests require an authenticated session (the site grants a 14-minute
 * trial window per account). The shared auth.setup.ts registers one account
 * and persists storageState; this file opts into that session.
 */

test.use({ storageState: "playwright/.auth/trial-session.json" });

test.describe("Stats analytics", () => {
  test("TC-STATS-001 — Analytics page renders for an authenticated user", { tag: ["@p1"] }, async ({ statsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-STATS-001" });

    await statsPage.goto("en");

    await expect(statsPage.heading).toBeVisible();
    await expect(statsPage.calendarView).toBeVisible();

    await expect(statsPage.tabCount()).resolves.toBe(8);
    await expect(statsPage.tab("Overview")).toBeVisible();
  });

  /*
  This is a real defect in the app, not a broken test — the failure matches
  exactly what this test was written to catch.

  Known regression gate for defect D-11: the analytics page triggers
  repeated resource-load failures (410/404) in the browser console. The
  test asserts the correct behavior (zero such errors), which will fail
  until the defect is fixed.
  */
  test("TC-STATS-002 — Analytics page triggers repeated resource-load failures (410/404) in console", { tag: ["@p2", "@regression"] }, async ({ statsPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-STATS-002" });

    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await statsPage.goto("en");
    await page.waitForLoadState("networkidle");

    const resourceErrors = consoleErrors.filter((text) =>
      /410|404|failed to load resource/i.test(text)
    );
    expect(resourceErrors).toHaveLength(0);
  });
});

test.describe("Below-market localization", () => {
  /*
  This is a real defect in the app, not a broken test — the failure matches
  exactly what this test was written to catch.

  Known regression gate for defect D-10: the below-market page does not
  localize for EN or DE locale and remains stuck in Spanish. The test
  asserts the correct behavior (Spanish strings absent), which will fail
  until the defect is fixed.
  */
  for (const locale of (["en", "de"] as Locale[])) {
    test(`TC-MARKET-001 — Below-market page does not localize for ${locale.toUpperCase()} locale`, { tag: ["@p1", "@regression"] }, async ({ belowMarketPage }) => {
      test.info().annotations.push({ type: "test-case", description: "TC-MARKET-001" });

      await belowMarketPage.goto(locale);

      const body = await belowMarketPage.bodyText();

      expect(body).not.toContain("Coches por debajo del precio de mercado");
      expect(body).not.toContain("España 🇪🇸");
      expect(body).not.toContain("Ahorro vs 2ª:");
    });
  }
});
