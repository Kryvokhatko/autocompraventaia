import { test, expect } from "../../fixtures/pages.fixture";
import { createDisposableAccount } from "../../helpers/test-data";

/**
 * Favorites-page and favorites-count-badge regression tests.
 *
 * Every freshly registered account receives the same pre-seeded favorites
 * list (17 cars, 7 of them marked sold). The nav badge counts only the
 * favorites that are not sold. TC-FAV-001 verifies the seed renders and the
 * badge reflects it. TC-FAV-002 is a regression gate for defect D-13: the
 * nav favorites-count badge does not update after removing a favorite
 * without a page reload, even though the removal itself is persisted.
 *
 * Both tests register their own disposable account inside the test body
 * rather than using the shared paid account: TC-FAV-002 removes a favorite,
 * and the shared account must never be modified. The ~60-second trial of a
 * new account is plenty for either test.
 */

test.describe("Favorites seed data and nav badge", () => {
  test("TC-FAV-001 — Favorites page renders pre-seeded sample data and shows the badge count in the nav", { tag: ["@p1"] }, async ({ registerPage, favoritesPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-FAV-001" });

    const account = createDisposableAccount(test.info().workerIndex);
    await registerPage.goto("en");
    await registerPage.register(account.email, account.password);

    await favoritesPage.goto("en");

    const total = await favoritesPage.favoriteCount();
    const sold = await favoritesPage.soldCount();
    expect(total).toBeGreaterThan(0);
    await favoritesPage.navbar.expectFavoritesCount(total - sold);
  });
});

test.describe("Favorites-count badge updates after removal (regression gate)", () => {
  test("TC-FAV-002 — Favorites-count badge updates immediately after removing a favorite, without a page reload", { tag: ["@p2", "@regression"] }, async ({ registerPage, favoritesPage, pageApi }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-FAV-002" });
    test.fail(true, "Open defect D-13: nav favorites badge does not update until the page is reloaded");

    await test.step("Register a disposable account", async () => {
      const account = createDisposableAccount(test.info().workerIndex);
      await registerPage.goto("en");
      await registerPage.register(account.email, account.password);
    });

    const before = await test.step("Open favorites and read the badge", async () => {
      await favoritesPage.goto("en");
      const unsold = (await favoritesPage.favoriteCount()) - (await favoritesPage.soldCount());
      await favoritesPage.navbar.expectFavoritesCount(unsold);
      return unsold;
    });

    // The first card in the seed list is a sold one, which the badge does
    // not count — remove the first unsold favorite so the badge must change.
    await test.step("Remove the first unsold favorite", () => favoritesPage.removeFirstUnsoldFavorite());

    await test.step("Server reports the new count", async () => {
      await expect
        .poll(async () => (await (await pageApi.favorites.count()).json()).count)
        .toBe(before - 1);
    });

    await test.step("Badge shows the new count without a reload", () =>
      favoritesPage.navbar.expectFavoritesCount(before - 1)
    );
  });
});
