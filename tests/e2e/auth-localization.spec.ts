import { test, expect } from "../../fixtures/pages.fixture";

/**
 * Auth-form localization regression tests.
 *
 * The login and register forms are currently hardcoded to English regardless
 * of the ?_locale= query parameter, even though the surrounding nav bar
 * localizes correctly. These tests assert the CORRECT localized text so
 * they act as regression gates once the defect is fixed.
 */
/*
Not a test bug — leaving as-is: both tests now fail one line later, on the form heading ("Please sign in" instead of "Iniciar sesión", "Register" instead of "Registrieren"). That's the actual, already-documented app defect the spec file's own header describes: "the login and register forms are currently hardcoded to English regardless of the locale... these tests act as regression gates once the defect is fixed." That's a real product bug for the app team, not something to patch in the test.
*/

test.describe("Login form localization", () => {
  test("TC-AUTH-001 — login form renders in Spanish under ES locale", { tag: ["@critical", "@p0", "@regression"] }, async ({ loginPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-001" });

    await loginPage.goto("es");

    // Nav bar correctly localizes — confirm the locale took effect.
    await loginPage.navbar.expectCurrentLocale("es");

    // Form elements should render in Spanish. Fields are matched by their
    // associated <label>, not by placeholder (placeholders are generic
    // hints like "name@example.com", not localized copy).
    await expect(loginPage.heading).toHaveText("Iniciar sesión");
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(loginPage.submitButton).toHaveText(/iniciar sesión/i);

    // OAuth provider link.
    const googleLink = page.getByRole("link", { name: /google/i });
    await expect(googleLink).toContainText(/iniciar sesión con google/i);

    // Register-page switch link (currently reads "Register Now" in English
    // on every locale) should no longer show the English text once localized.
    const switchLink = page.getByRole("link", { name: /register now/i });
    await expect(switchLink).toHaveCount(0);
  });
});

test.describe("Register form localization", () => {
  test("TC-AUTH-002 — register form renders in German under DE locale", { tag: ["@critical", "@p0", "@regression"] }, async ({ registerPage, page }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-AUTH-002" });

    await registerPage.goto("de");

    // Nav bar correctly localizes — confirm the locale took effect.
    await registerPage.navbar.expectCurrentLocale("de");

    // Form elements should render in German. Fields are matched by their
    // associated <label>, not by placeholder (placeholders are generic
    // hints like "name@example.com", not localized copy).
    await expect(registerPage.heading).toHaveText("Registrieren");
    await expect(page.getByLabel(/e-mail-adresse/i)).toBeVisible();
    await expect(page.getByLabel(/passwort/i)).toBeVisible();
    await expect(registerPage.submitButton).toHaveText(/registrieren/i);

    // OAuth provider link.
    const googleLink = page.getByRole("link", { name: /google/i });
    await expect(googleLink).toContainText(/mit google/i);

    // Already-have-account link (the register page shows a link to go to login).
    const switchLink = page.getByRole("link", { name: /bereits.*konto|anmelden/i });
    await expect(switchLink).toBeVisible();
  });
});
