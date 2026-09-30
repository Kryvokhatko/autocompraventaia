import { test, expect } from "../../fixtures/pages.fixture";
import { AUTH_FILE } from "../../helpers/test-user";

/**
 * Payments-page locale-formatting regression tests.
 *
 * Read-only checks, so they run as the shared paid account signed in by
 * tests/setup/auth.setup.ts — its active subscription is what makes the
 * "Active Subscription" banner and expiry date appear.
 *
 * Open defects covered (each test is marked test.fail() until fixed, so the
 * suite stays green while the defect exists and flags the test as an
 * unexpected pass the day it is fixed):
 *   D-07 — DE date uses slash format instead of DD.MM.YYYY
 *   D-08 — ES prices use period decimal instead of comma
 *   D-09 — EN/DE price-unit suffixes stay Spanish ("/día /mes /año")
 */

test.use({ storageState: AUTH_FILE });

test.describe("Payments date formatting", () => {
  test("TC-PAY-001 — subscription-expiry date uses DD.MM.YYYY under DE locale", { tag: ["@p1", "@regression"] }, async ({ paymentsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-001" });
    test.fail(true, "Open defect D-07: DE expiry date renders as DD/MM/YYYY");

    await paymentsPage.goto("de");

    const text = await paymentsPage.pageText();

    // Assert a date matching DD.MM.YYYY appears in the active-subscription banner.
    expect(text).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});

test.describe("Payments decimal-separator formatting", () => {
  test("TC-PAY-002 — prices use comma decimal separator under ES locale", { tag: ["@p2", "@regression"] }, async ({ paymentsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-002" });
    test.fail(true, "Open defect D-08: ES prices use a period decimal separator");

    await paymentsPage.goto("es");

    const text = await paymentsPage.pageText();

    // Every € price on the page should use comma as the decimal separator.
    const euroAmounts = [...text.matchAll(/€\s*([\d.,]+)/g)].map((m) => m[1]);
    expect(euroAmounts.length).toBeGreaterThan(0);
    for (const amount of euroAmounts) {
      expect(amount).toContain(",");
    }
  });
});

test.describe("Payments unit-suffix localization", () => {
  test("TC-PAY-003 — price-unit suffixes match locale under EN and DE", { tag: ["@p2", "@regression"] }, async ({ paymentsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-003" });
    test.fail(true, "Open defect D-09: EN/DE price suffixes stay Spanish (/día /mes /año)");

    // --- EN locale ---
    await paymentsPage.goto("en");
    const enText = await paymentsPage.pageText();

    // Plan names localize correctly ("Daily", "Monthly", "Yearly").
    // The defect is that the price suffix stays Spanish.
    expect(enText).not.toContain("/día");
    expect(enText).not.toContain("/mes");
    expect(enText).not.toContain("/año");

    // English suffixes should appear.
    expect(enText).toMatch(/\/day/);
    expect(enText).toMatch(/\/month/);
    expect(enText).toMatch(/\/year/);

    // --- DE locale ---
    await paymentsPage.goto("de");
    const deText = await paymentsPage.pageText();

    // Plan names localize correctly ("Täglich", "Monatlich", "Jährlich").
    // Suffixes should match.
    expect(deText).not.toContain("/día");
    expect(deText).not.toContain("/mes");
    expect(deText).not.toContain("/año");

    // German suffixes should appear.
    expect(deText).toMatch(/\/Tag/);
    expect(deText).toMatch(/\/Monat/);
    expect(deText).toMatch(/\/Jahr/);
  });
});

test.describe("Payments subscription plans", () => {
  test("TC-PAY-004 — plan pricing (daily/monthly/yearly) is correct and active-subscription banner is visible", { tag: ["@critical", "@p0"] }, async ({ paymentsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-004" });

    await paymentsPage.goto("en");

    const daily = await paymentsPage.priceText("daily");
    const monthly = await paymentsPage.priceText("monthly");
    const yearly = await paymentsPage.priceText("yearly");

    expect(daily).toContain("2.99");
    expect(monthly).toContain("11.99");
    expect(yearly).toContain("99.99");

    await expect(paymentsPage.activeSubscriptionBanner).toBeVisible();
  });
});
