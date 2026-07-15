import { test, expect } from "../../fixtures/pages.fixture";
import { createDisposableAccount } from "../../helpers/test-data";

/**
 * Favorites-page and favorites-count-badge regression tests.
 *
 * Every freshly registered account receives an identical, consistent
 * 11-item pre-seeded favorites list. TC-FAV-001 verifies this seed data
 * is rendered and reflected in the nav badge. TC-FAV-002 is a regression
 * gate for defect D-13: the nav favorites-count badge does not update
 * after removing a favorite without a page reload, even though the
 * underlying removal is persisted correctly.
 *
 * Both tests register their own disposable account inside the test body
 * rather than sharing the global trial session, so they stay fully
 * isolated and never collide with other specs that depend on a pristine
 * 11-item seed.
 */

test.describe("Favorites seed data and nav badge", () => {
  test("TC-FAV-001 — Favorites page renders pre-seeded sample data and shows the badge count in the nav", { tag: ["@p1"] }, async ({ registerPage, favoritesPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-FAV-001" });

    const account = createDisposableAccount();

    await registerPage.goto("en");
    await registerPage.register(account.email, account.password);

    // Navigate to the favorites page — the badge is fetched asynchronously
    // and shows the correct count only after a real page navigation.
    await favoritesPage.goto("en");

    expect(await favoritesPage.favoriteCount()).toBe(11);
    await favoritesPage.navbar.expectFavoritesCount(11);
  });
});

/*
Known defect D-13 — leaving as-is: the underlying favorite removal works
correctly (the item is deleted and a reload reflects the correct count),
but the nav favorites-count badge specifically does not update without a
page reload. This test asserts the CORRECT behavior (badge shows 10 after
removal) and currently FAILS until D-13 is fixed. It is not a broken test.
*/
test.describe("Favorites-count badge updates after removal (regression gate)", () => {
  test("TC-FAV-002 — Favorites-count badge updates immediately after removing a favorite, without a page reload", { tag: ["@p2", "@regression"] }, async ({ registerPage, favoritesPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-FAV-002" });

    const account = createDisposableAccount();

    await registerPage.goto("en");
    await registerPage.register(account.email, account.password);

    await favoritesPage.goto("en");
    await favoritesPage.navbar.expectFavoritesCount(11);

    await favoritesPage.removeFirstFavorite();

    // This assertion currently fails per defect D-13 — the badge does not
    // update without a page reload, even though the removal is persisted.
    await favoritesPage.navbar.expectFavoritesCount(10);
  });
});
