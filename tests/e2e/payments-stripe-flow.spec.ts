import { test, expect } from "../../fixtures/pages.fixture";
import { AUTH_FILE, getTestUser } from "../../helpers/test-user";

/**
 * Payments payment-method selection + Stripe Checkout flow tests
 * (TC-PAY-005 through TC-PAY-015).
 *
 * These run as the shared paid account signed in by
 * tests/setup/auth.setup.ts. Opening Checkout creates a Stripe Checkout
 * Session but never charges anything: no test here submits a real card.
 *
 * Stripe-key caution: this environment runs on LIVE Stripe keys. TC-PAY-005
 * through TC-PAY-011 and TC-PAY-014 never submit a card at all, and
 * TC-PAY-015 submits one of Stripe's own published test card numbers, which
 * Stripe rejects outright on a live-mode session by design — so all of
 * those are safe to run unconditionally. Only TC-PAY-012 and TC-PAY-013
 * (which need a real test/decline outcome, not just a live-mode rejection)
 * are skip-gated behind STRIPE_TEST_MODE=true until test-mode credentials
 * exist.
 */

test.use({ storageState: AUTH_FILE });

test.describe("Payments payment-method selection and Stripe Checkout", () => {
  test("TC-PAY-005 — payment-method modal echoes the selected plan's name and price", { tag: ["@critical", "@p0", "@regression"] }, async ({ paymentsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-005" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");

    await expect(paymentsPage.selectedPlanSummary).toBeVisible();
    // The modal shows the plan name in Spanish regardless of the site
    // locale, and the EUR price shown on-site (not the local-currency amount
    // Stripe Checkout later converts to).
    const summary = await paymentsPage.selectedPlanSummary.innerText();
    expect(summary).toContain("Diario");
    expect(summary).toContain("2.99");
  });

  test("TC-PAY-006 — payment-method modal only allows selecting implemented methods", { tag: ["@critical", "@p0", "@regression"] }, async ({ paymentsPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-006" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");

    await expect(paymentsPage.stripeMethodOption).toBeVisible();

    // Only Stripe is implemented today; PayPal and Bank Transfer render as
    // disabled "Coming soon" cards.
    await expect(paymentsPage.disabledPaymentMethodOptions).toHaveCount(2);
    const combined = (await paymentsPage.disabledPaymentMethodOptions.allInnerTexts()).join(" ");
    expect(combined).toContain("PayPal");
    expect(combined).toContain("Bank Transfer");
    expect(combined).toContain("Coming soon");
  });

  test("TC-PAY-007 — selecting Stripe creates a checkout session and redirects", { tag: ["@critical", "@p0", "@regression"] }, async ({ paymentsPage, stripeCheckoutPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-007" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    // Do not proceed past this redirect: this Stripe Checkout instance runs
    // on LIVE keys, so no card submission is performed in this test.
    expect(page.url()).toMatch(/checkout\.stripe\.com/);
    expect(await stripeCheckoutPage.lineItemText()).toContain("Acceso por 1 día");
  });

  test("TC-PAY-008 — Stripe Checkout defaults to the visitor's local currency rather than the EUR price shown on-site", { tag: ["@p1"] }, async ({ paymentsPage, stripeCheckoutPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-008" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    // Documents current behavior, NOT an asserted-correct expectation — see
    // R-PAY-02 in TestArtifacts/test_cases_2026-07-15.md. Checkout converts
    // the price to the visitor's local currency by location (UAH from
    // Ukraine, USD from a US-hosted CI runner) and offers EUR as the
    // alternative. Pending stakeholder input on whether it should default to
    // the EUR price shown on-site. A visitor inside the eurozone would see
    // EUR and fail this check.
    expect(await stripeCheckoutPage.activeCurrency()).toBe("local");
  });

  test("TC-PAY-009 — switching currency recalculates the amount and updates wallet availability", { tag: ["@p1", "@regression"] }, async ({ paymentsPage, stripeCheckoutPage }, testInfo) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-009" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    // Starts in the visitor's local currency (see TC-PAY-008).
    const localLine = await stripeCheckoutPage.lineItemText();
    expect(localLine).not.toContain("€");

    await stripeCheckoutPage.switchToEuro();

    const eurLine = await stripeCheckoutPage.lineItemText();
    expect(eurLine).toContain("€");
    expect(eurLine).not.toBe(localLine);

    // Wallet half — soft/surfaced result, not a hard gate: wallet
    // eligibility is legitimately environment-dependent (browser/device/
    // region), so don't fail the test over it.
    const amazonPayOffered = await stripeCheckoutPage.waitForAmazonPayOffer();
    await testInfo.attach("Amazon Pay offer after EUR switch", {
      body: `Amazon Pay wallet offer detected: ${amazonPayOffered}`,
      contentType: "text/plain",
    });
  });

  test("TC-PAY-010 — Stripe Checkout's pre-filled email matches the authenticated user's account email", { tag: ["@critical", "@p0", "@regression"] }, async ({ paymentsPage, stripeCheckoutPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-010" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    // The signed-in account is the shared test user, so its email is known
    // from the environment and can be compared directly.
    const { email } = getTestUser();
    expect(await stripeCheckoutPage.emailText()).toBe(email);
  });

  test("TC-PAY-011 — closing the payment-method modal cancels cleanly without creating a checkout session", { tag: ["@critical", "@p0", "@regression"] }, async ({ paymentsPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-011" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");

    // Watch for the checkout-session request BEFORE closing, so we can prove
    // none fired (closing must not create a Stripe checkout session).
    const createLinkRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/payments/create-link")) {
        createLinkRequests.push(request.url());
      }
    });

    await paymentsPage.closePaymentMethodModal();
    await expect(paymentsPage.paymentMethodModal).toBeHidden();

    // Brief wait so any in-flight create-link request would have surfaced
    // before we assert the list stayed empty.
    await page.waitForTimeout(1000);

    expect(createLinkRequests).toEqual([]);
  });

  test("TC-PAY-012 — successful payment via a Stripe test card activates/extends the subscription", { tag: ["@critical", "@p0"] }, async ({ paymentsPage, stripeCheckoutPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-012" });

    test.skip(process.env.STRIPE_TEST_MODE !== "true",
      "Requires Stripe test-mode keys (pk_test_/cs_test_) — this environment runs on LIVE Stripe " +
      "keys; see TC-PAY-012 in TestArtifacts/test_cases_2026-07-15.md. Set STRIPE_TEST_MODE=true " +
      "once a test-mode environment is available."
    );

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    // fillCardTestData is NOT independently verified against the live DOM —
    // see the caveat on StripeCheckoutPage.fillCardTestData.
    await stripeCheckoutPage.fillCardTestData({
      number: "4242424242424242",
      expiry: "12/34",
      cvc: "123",
      name: "QA Automation",
    });
    await stripeCheckoutPage.submitPayment();

    await paymentsPage.goto("en");
    await expect(paymentsPage.activeSubscriptionBanner).toBeVisible({ timeout: 15000 });
  });

  test("TC-PAY-013 — a declined card leaves the subscription state unchanged", { tag: ["@critical", "@p0"] }, async ({ paymentsPage, stripeCheckoutPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-013" });

    test.skip(process.env.STRIPE_TEST_MODE !== "true",
      "Requires Stripe test-mode keys (pk_test_/cs_test_) — this environment runs on LIVE Stripe " +
      "keys; see TC-PAY-013 in TestArtifacts/test_cases_2026-07-15.md. Set STRIPE_TEST_MODE=true " +
      "once a test-mode environment is available."
    );

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    await stripeCheckoutPage.fillCardTestData({
      number: "4000000000000002",
      expiry: "12/34",
      cvc: "123",
      name: "QA Automation",
    });
    await stripeCheckoutPage.submitPayment();

    // Stripe's generic decline test card surfaces a decline/error message.
    // "invalid" is included too: this card number is only guaranteed to
    // simulate a decline once STRIPE_TEST_MODE points at a genuine
    // test-mode account — run against anything still live-mode, Stripe
    // rejects the number outright as an invalid/test card instead.
    await expect(page.getByText(/declined|failed|error|invalid/i).first()).toBeVisible();

    // No navigation to a success/confirmation state — we remain on Stripe.
    expect(page.url()).toMatch(/checkout\.stripe\.com/);
  });

  test("TC-PAY-014 — abandoning Stripe Checkout mid-session leaves no dangling state", { tag: ["@critical", "@p0", "@regression"] }, async ({ paymentsPage, stripeCheckoutPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-014" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    await stripeCheckoutPage.goBackToSite();
    await page.waitForURL(/autocompraventaia\.es/, { timeout: 15000 });

    // Verifying no dangling charge/session exists on Stripe's side is out of
    // scope for browser-driven automation (would need Stripe dashboard/API
    // access) — this test only covers the site-side navigation half.
    expect(page.url()).toContain("/pagos");
    expect(page.url()).not.toMatch(/stripe\.com/);
  });

  test("TC-PAY-015 — production Stripe Checkout rejects a well-known Stripe test card", { tag: ["@critical", "@p0", "@regression"] }, async ({ paymentsPage, stripeCheckoutPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-PAY-015" });

    await paymentsPage.goto("en");
    await paymentsPage.openPaymentMethodModal("daily");
    await paymentsPage.chooseStripe();
    await stripeCheckoutPage.waitForLoad();

    // Safe to run against the live account by design: Stripe rejects its own
    // test card numbers (4242 4242 4242 4242) outside test mode, so this
    // never risks a real charge — a cheap guard against ever accidentally
    // deploying test-mode keys to production. See R-PAY-03 in
    // TestArtifacts/test_cases_2026-07-15.md.
    await stripeCheckoutPage.fillCardTestData({
      number: "4242424242424242",
      expiry: "12/34",
      cvc: "123",
    });
    await stripeCheckoutPage.submitPayment();

    // Scope: submitting this card does not produce a visible declined/invalid
    // message — the Pay button returns to its idle state with no on-page
    // error. Stripe's bot detection (invisible hCaptcha, HumanSecurity)
    // appears to drop automated submissions silently, so a specific error
    // message can't be asserted from outside Stripe. The assertion is the
    // invariant R-PAY-03 needs: a live-mode test-card submission never
    // reaches a successful/confirmed state. There is no event marking
    // "Stripe has finished processing", hence the fixed 5s settle before
    // checking. Revisit if Stripe dashboard/API access becomes available.
    await page.waitForTimeout(5000);
    await expect(page).not.toHaveURL(/checkout\.stripe\.com\/.*success/i);
    await expect(page.getByRole("heading", { name: /success|confirmed|thank you/i })).not.toBeVisible();
    await expect(await stripeCheckoutPage.payButton()).toBeVisible();
  });
});
