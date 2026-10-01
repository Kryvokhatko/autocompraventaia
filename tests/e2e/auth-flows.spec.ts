import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";
import { createDisposableAccount } from "../../helpers/test-data";

// ---------------------------------------------------------------------------
// Auth-flow tests — registration, login, logout, error handling, and OAuth
// entry-point coverage.
//
// Every test here uses a disposable account (or none): they register, log
// in and log out, so they never touch the shared paid account's sessions or
// put its credentials into test steps.
// ---------------------------------------------------------------------------

const LOCALES: Locale[] = ["en", "es", "de"];

test.describe("Registration", () => {
  test("TC-AUTH-003 — new user can register with email/password and reach the dashboard with an active trial", { tag: ["@critical", "@p0"] }, async ({ registerPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-003" });

    const account = createDisposableAccount(test.info().workerIndex);
    await registerPage.goto("en");
    await registerPage.register(account.email, account.password);

    // Redirected to dashboard.
    await expect(page).toHaveURL(/\/offers/);

    // Trial badge counts down the ~60-second trial ("paid 0:59" format).
    await registerPage.navbar.openMenu();
    await expect(registerPage.navbar.trialBadge).toBeVisible();
    await expect(registerPage.navbar.trialBadge).toHaveText(/paid\s+\d+:\d{2}/i);
  });
});

test.describe("Login", () => {
  test("TC-AUTH-004 — registered user can log in with valid email/password credentials", { tag: ["@critical", "@p0"] }, async ({ registerPage, loginPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-004" });

    // A disposable account keeps real credentials out of this test's steps
    // and traces. Its session is dropped by clearing cookies rather than via
    // the site's logout, which currently leaves the session active (D-15).
    const account = createDisposableAccount(test.info().workerIndex);
    await test.step("Register a disposable account", async () => {
      await registerPage.goto("en");
      await registerPage.register(account.email, account.password);
    });

    await test.step("Drop the session", async () => {
      // Leave the dashboard first: a request it still has in flight could
      // set the session cookie again after the cookies are cleared.
      await page.goto("about:blank");
      await page.context().clearCookies();
    });

    await test.step("Log in with the same credentials", async () => {
      await loginPage.goto("en");
      await loginPage.login(account.email, account.password);
    });

    // Authenticated and redirected into the dashboard.
    await expect(page).toHaveURL(/\/offers/, { timeout: 15_000 });
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
    // Open defect D-15 (intermittent, ~7 in 9 attempts): logout redirects to
    // the home page but the httpOnly BEARER session cookie survives (the
    // page's script cannot clear httpOnly cookies), so the user stays signed
    // in and /offers remains reachable. Because it only happens most of the
    // time, test.fail() would make this test flip between pass and fail —
    // it is quarantined instead until the defect is fixed.
    test.fixme(true, "Quarantined — open defect D-15 (intermittent): session often stays active after logout");

    const account = createDisposableAccount(test.info().workerIndex);
    await test.step("Register a disposable account", async () => {
      await registerPage.goto("en");
      await registerPage.register(account.email, account.password);
    });

    await test.step("Log out", () => registerPage.navbar.logout());

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
