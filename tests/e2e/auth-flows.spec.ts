import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";
import { createDisposableAccount } from "../../helpers/test-data";

// ---------------------------------------------------------------------------
// Auth-flow tests — registration, login, logout, error handling, and OAuth
// entry-point coverage.
// ---------------------------------------------------------------------------

const LOCALES: Locale[] = ["en", "es", "de"];

test.describe("Registration", () => {
  test("TC-AUTH-003 — new user can register with email/password and reach the dashboard with an active trial", { tag: ["@critical", "@p0"] }, async ({ registerPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-003" });

    const account = createDisposableAccount();
    await registerPage.goto("en");
    await registerPage.register(account.email, account.password);

    // Redirected to dashboard.
    await expect(page).toHaveURL(/\/offers/);

    // Trial badge appears with "paid N min" countdown pattern.
    await expect(registerPage.navbar.trialBadge).toBeVisible();
    await expect(registerPage.navbar.trialBadge).toHaveText(/paid\s+\d+\s*min/i);
  });
});

test.describe("Login", () => {
  test("TC-AUTH-004 — registered user can log in with valid email/password credentials", { tag: ["@critical", "@p0"] }, async ({ registerPage, loginPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-004" });

    // Register a fresh account, then log out.
    const account = createDisposableAccount();
    await registerPage.goto("en");
    await registerPage.register(account.email, account.password);
    await registerPage.navbar.logout();

    // Log back in with the same credentials.
    await loginPage.goto("en");
    await loginPage.login(account.email, account.password);

    // Authenticated and redirected into the dashboard.
    await expect(page).toHaveURL(/\/offers/);
  });
});

test.describe("Login error handling", () => {
  test("TC-AUTH-005 — invalid credentials show inline error", { tag: ["@p1"] }, async ({ loginPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-005" });

    await loginPage.goto("en");

    // Syntactically valid but non-existent email + wrong password.
    await loginPage.login("no-such-user@mailinator.com", "wrong-password-1!");

    // Inline error message appears (known F-09: errorMessage locator via
    // role=alert is not reliably populated — use text locator instead).
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test("TC-AUTH-005 — empty fields blocked by HTML5 validation", { tag: ["@p1"] }, async ({ loginPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-005" });

    await loginPage.goto("en");

    // Submit with both fields empty — rely on browser-native email type
    // validation to block.
    await loginPage.submitButton.click();

    const validationMessage = await loginPage.emailInput.evaluate(
      (el) => (el as HTMLInputElement).validationMessage,
    );
    expect(validationMessage).not.toBe("");
  });

  test("TC-AUTH-005 — malformed email blocked by browser HTML5 validation", { tag: ["@p1"] }, async ({ loginPage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-005" });

    await loginPage.goto("en");

    // Malformed email (no "@") should be blocked by the browser-native
    // type="email" validation before the form submits.
    await loginPage.emailInput.fill("not-a-valid-email");
    await loginPage.passwordInput.fill("SomePassword1!");
    await loginPage.submitButton.click();

    const validationMessage = await loginPage.emailInput.evaluate(
      (el) => (el as HTMLInputElement).validationMessage,
    );
    expect(validationMessage).not.toBe("");
  });
});

test.describe("Logout", () => {
  test("TC-AUTH-006 — logged-in user can log out and loses access to authenticated pages", { tag: ["@p1"] }, async ({ registerPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-006" });

    // Register to get an authenticated session.
    const account = createDisposableAccount();
    await registerPage.goto("en");
    await registerPage.register(account.email, account.password);

    // Log out.
    await registerPage.navbar.logout();

    // Attempt to reach a protected page — should redirect to login.
    await page.goto("/offers");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("OAuth entry points", () => {
  test("TC-AUTH-007 — 'Continue with Google' entry points exist on both register and login", { tag: ["@p2"] }, async ({ registerPage, loginPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-007" });

    for (const locale of LOCALES) {
      // Register page.
      await registerPage.goto(locale);
      const registerGoogleLink = page.getByRole("link", { name: /google/i });
      await expect(registerGoogleLink).toBeVisible();
      await expect(registerGoogleLink).toHaveAttribute("href", /\/connect\/google/);

      // Login page.
      await loginPage.goto(locale);
      const loginGoogleLink = page.getByRole("link", { name: /google/i });
      await expect(loginGoogleLink).toBeVisible();
      await expect(loginGoogleLink).toHaveAttribute("href", /\/connect\/google/);
    }
  });
});
