import { test, expect } from "../../fixtures/pages.fixture";

/**
 * Dashboard content-rendering smoke tests.
 *
 * These tests require an authenticated session (the site grants a 14-minute
 * trial window per account). The shared auth.setup.ts registers one account
 * and persists storageState; this file opts into that session.
 */

test.use({ storageState: "playwright/.auth/trial-session.json" });

test.describe("Offers Dashboard renders for an authenticated user", () => {
  test("TC-OFFERS-001 — Offers Dashboard renders for an authenticated user", { tag: ["@p1"] }, async ({ offersPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-OFFERS-001" });

    await offersPage.goto("en");

    await expect(offersPage.listingTable).toBeVisible();
    await expect(offersPage.rowCount()).resolves.toBeGreaterThan(0);
  });
});

test.describe("Interactive Map renders offers for an authenticated user", () => {
  test("TC-MAP-001 — Interactive Map renders offers for an authenticated user", { tag: ["@p2"] }, async ({ mapPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-MAP-001" });

    await mapPage.goto("en");

    await expect(mapPage.mapContainer).toBeVisible();
    await expect(mapPage.markerCount()).resolves.toBeGreaterThan(0);
  });
});

test.describe("Top Sales ranking page renders for an authenticated user", () => {
  test("TC-TOPSALES-001 — Top Sales ranking page renders for an authenticated user", { tag: ["@p2"] }, async ({ topSalesPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-TOPSALES-001" });

    await topSalesPage.goto("en");

    await expect(topSalesPage.heading).toBeVisible();
  });
});

test.describe("Notifications settings page renders for an authenticated user", () => {
  test("TC-NOTIF-001 — Notifications settings page renders for an authenticated user", { tag: ["@p2"] }, async ({ notificationsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-NOTIF-001" });

    await notificationsPage.goto("en");

    await expect(notificationsPage.heading).toBeVisible();
    await expect(notificationsPage.telegramOption).toBeVisible();
    await expect(notificationsPage.emailOption).toBeVisible();
    await expect(notificationsPage.historyTable).toBeVisible();
  });
});
