import { test, expect } from "../../fixtures/pages.fixture";
import { AUTH_FILE } from "../../helpers/test-user";

/**
 * API-level tests for GET /api/favorites/count, the endpoint behind the
 * navbar favorites badge. Requests are partitioned by sign-in state and by
 * whether the caller asks for JSON.
 *
 * Signed-out requests are an open defect (D-01): by default the endpoint
 * redirects to the HTML login page, which the page's own fetch() then
 * fails to parse as JSON; asked for JSON it returns 401 with a plain-text
 * body served as text/html.
 */

test.describe("Favorites-count API — signed in", () => {
  // The page check below must use the same account as the API request.
  test.use({ storageState: AUTH_FILE });

  test("TC-API-002 — signed-in request returns the favorites count as JSON, matching the navbar badge", { tag: ["@p1"] }, async ({ signedInApi, offersPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-API-002" });

    const count = await test.step("GET /api/favorites/count returns a JSON count", async () => {
      const response = await signedInApi.favorites.count();
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");
      const body = await response.json();
      expect(body).toEqual({ count: expect.any(Number) });
      expect(body.count).toBeGreaterThanOrEqual(0);
      return body.count as number;
    });

    await test.step("navbar badge shows the same count", async () => {
      await offersPage.goto("en");
      await offersPage.navbar.expectFavoritesCount(count);
    });
  });
});

test.describe("Favorites-count API — signed out", () => {
  test("TC-API-003 — signed-out request is rejected with 401, not redirected to the HTML login page", { tag: ["@p1", "@regression"] }, async ({ signedOutApi }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-API-003" });
    test.fail(true, "Open defect D-01: signed-out API requests are redirected (302) to the HTML login page");

    const response = await signedOutApi.favorites.count();
    expect(response.status()).toBe(401);
  });

  test("TC-API-004 — signed-out JSON request gets a JSON 401 error", { tag: ["@p2", "@regression"] }, async ({ signedOutApi }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-API-004" });
    test.fail(true, "Open defect D-01: the 401 body is plain text served as text/html, not JSON");

    const response = await signedOutApi.favorites.count({ acceptJson: true });
    expect(response.status()).toBe(401);
    expect(response.headers()["content-type"]).toContain("application/json");
  });
});
