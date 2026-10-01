import { test, expect } from "../../fixtures/pages.fixture";
import { AUTH_FILE } from "../../helpers/test-user";

/**
 * Dashboard content-rendering smoke tests.
 *
 * Read-only checks, so they run as the shared paid account signed in by
 * tests/setup/auth.setup.ts.
 */

test.use({ storageState: AUTH_FILE });

test.describe("Offers Dashboard renders for an authenticated user", () => {
  test("TC-OFFERS-001 — Offers Dashboard renders for an authenticated user", { tag: ["@p1"] }, async ({ offersPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-OFFERS-001" });

    await offersPage.goto("en");

    // Waits past the table's initial "Loading..." row for real listings.
    await expect(offersPage.listingRows.first()).toBeVisible();
    expect(await offersPage.rowCount()).toBeGreaterThan(0);

    const listing = await offersPage.firstListing();
    expect(listing.make).not.toBe("");
    // Prices read like "13.990 €", with a non-breaking space before the symbol.
    expect(listing.priceDe).toMatch(/^\d{1,3}(\.\d{3})*\s€$/);
    expect(listing.priceEs).toMatch(/^\d{1,3}(\.\d{3})*\s€$/);
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
    // Waits past the table's initial "Loading..." row for ranked entries.
    await expect(topSalesPage.rankingRows.first()).toBeVisible();
    await expect(topSalesPage.rankingRows.first()).toContainText(/^\s*\d+\s/);
  });
});

test.describe("Notifications settings page renders for an authenticated user", () => {
  test("TC-NOTIF-001 — Notifications settings page renders for an authenticated user", { tag: ["@p2"] }, async ({ notificationsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-NOTIF-001" });

    await notificationsPage.goto("en");

    await expect(notificationsPage.heading).toBeVisible();
    await expect(notificationsPage.telegramOption).toBeVisible();
    await expect(notificationsPage.emailOption).toBeVisible();
    await expect(notificationsPage.historyColumnHeaders).toHaveText(["Date", "Photo", "Car", "Message"]);
    // Either one row per notification or the single empty-state row.
    await expect(notificationsPage.historyRows.first()).toBeVisible();
  });
});
