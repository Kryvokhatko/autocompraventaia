import { test, expect } from "../../fixtures/pages.fixture";

/**
 * Auth-form localization regression tests.
 *
 * The login and register forms must render in the active locale — heading,
 * field labels, submit button, the Google sign-in link and the link to the
 * other form. Guards defect D-02 (forms stuck in English regardless of
 * ?_locale=), which is fixed on the live site; expected copy below is the
 * site's current wording.
 */

test.describe("Login form localization", () => {
  test("TC-AUTH-001 — login form renders in Spanish under ES locale", { tag: ["@critical", "@p0", "@regression", "@demo"] }, async ({ loginPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-001" });

    await loginPage.goto("es");

    // Confirm the locale took effect before checking the form.
    await loginPage.navbar.expectCurrentLocale("es");

    // Fields are matched by their associated <label>, not by placeholder
    // (placeholders are generic hints like "name@example.com").
    await expect(loginPage.heading).toHaveText("Iniciar sesión");
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(loginPage.submitButton).toHaveText(/iniciar sesión/i);

    await expect(page.getByRole("link", { name: /google/i })).toContainText(/continuar con google/i);
    await expect(page.getByRole("link", { name: /crear una cuenta/i })).toBeVisible();
  });
});

test.describe("Register form localization", () => {
  test("TC-AUTH-002 — register form renders in German under DE locale", { tag: ["@critical", "@p0", "@regression"] }, async ({ registerPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-002" });

    await registerPage.goto("de");

    await registerPage.navbar.expectCurrentLocale("de");

    await expect(registerPage.heading).toHaveText("Konto erstellen");
    await expect(page.getByLabel(/e-mail-adresse/i)).toBeVisible();
    await expect(page.getByLabel(/passwort/i)).toBeVisible();
    await expect(registerPage.submitButton).toHaveText(/konto erstellen/i);

    await expect(page.getByRole("link", { name: /google/i })).toContainText(/weiter mit google/i);
    await expect(page.getByRole("link", { name: /bereits ein konto\?.*anmelden/i })).toBeVisible();
  });
});
