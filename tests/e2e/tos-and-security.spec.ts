import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";

/**
 * Terms of Service reachability and protected-route security-gating tests.
 *
 * TC-TOS-001 — Known, confirmed, still-open defect D-12: both direct-URL
 * and footer-link paths to /terms-of-service currently redirect to /login
 * instead of rendering the page. The test asserts the CORRECT/expected
 * behavior (page renders without requiring login), which currently FAILS
 * until the defect is fixed. This is a regression gate.
 *
 * TC-SEC-001 — Confirmation of correctly-working security gating: every
 * protected route (/offers, /map, /top-sales, /below-market, /favorites,
 * /pagos) redirects an unauthenticated visitor to /login across all three
 * in-scope locales. This is passing, non-defect behavior.
 */

const LOCALES: Locale[] = ["en", "es", "de"];

test.describe("Terms of Service and Security", () => {
  // -----------------------------------------------------------------------
  // TC-TOS-001 — Known regression gate for defect D-12.
  // The app currently redirects /terms-of-service to /login for
  // unauthenticated users. Once D-12 is fixed the page should render
  // directly without requiring authentication.
  // -----------------------------------------------------------------------
  for (const locale of LOCALES) {
    test(`TC-TOS-001 — Terms of Service is reachable without authentication (locale=${locale})`, { tag: ["@critical", "@p0", "@regression"] }, async ({ page }) => {
      test.info().annotations.push({ type: "test-case", description: "TC-TOS-001" });

      await page.goto(`/terms-of-service?_locale=${locale}`);
      await page.waitForLoadState("networkidle");

      // Expected: the page loads directly — no redirect to /login.
      await expect(page).not.toHaveURL(/\/login/);
    });
  }

  // -----------------------------------------------------------------------
  // TC-SEC-001 — Confirmation that all protected routes correctly redirect
  // unauthenticated visitors to /login. This is passing, non-defect behavior;
  // the security gating is working as designed.
  // -----------------------------------------------------------------------
  const PROTECTED_ROUTES = ["/offers", "/map", "/top-sales", "/below-market", "/favorites", "/pagos"] as const;

  for (const route of PROTECTED_ROUTES) {
    for (const locale of LOCALES) {
      test(`TC-SEC-001 — ${route} redirects unauthenticated visitor to login (locale=${locale})`, { tag: ["@critical", "@p0"] }, async ({ page }) => {
        test.info().annotations.push({ type: "test-case", description: "TC-SEC-001" });

        await page.goto(`${route}?_locale=${locale}`);
        await page.waitForLoadState("networkidle");

        // Expected: every unauthenticated navigation redirects to /login.
        await expect(page).toHaveURL(/\/login/);
      });
    }
  }
});
