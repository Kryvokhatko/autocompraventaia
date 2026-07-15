import { expect, type Locator, type Page } from "@playwright/test";
import type { Locale } from "../pages/base.page";

const LOCALE_LABEL: Record<Locale, string> = { en: "EN", es: "ES", de: "DE" };

/**
 * Reusable nav-bar component. The nav bar localizes correctly even where
 * page content (login/register forms) does not — so this component also
 * serves as the oracle for distinguishing "nav is fine, form is broken" in
 * the auth-locale test cases.
 *
 * Note: the locale-switcher dropdown's exact structure (menu vs. plain
 * links) was observed but not exhaustively confirmed during initial
 * review — `switchLocaleViaUi` is a best-effort UI interaction path;
 * confirm/adjust its locator against the live DOM on first run. Tests
 * should prefer `goto(locale)` on the Page Object (query-param navigation)
 * for reliability and reserve `switchLocaleViaUi` specifically for
 * locale-switcher routing-correctness checks.
 */
export class NavbarComponent {
  readonly container: Locator;
  readonly localeSwitcherButton: Locator;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly logoutButton: Locator;
  // Text pattern confirmed live: "paid 14 min" counting down. Structure
  // beyond the text itself wasn't further enumerated during the walkthrough.
  readonly trialBadge: Locator;
  // Confirmed live: the favorites link (id="favorites-link", icon-only,
  // named via title="Favorites" not an accessible name — same pattern as
  // logoutButton) contains <span id="favorites-count">11</span>.
  readonly favoritesCountBadge: Locator;

  constructor(private readonly page: Page) {
    this.container = page.getByRole("navigation");
    // Unanchored: the dropdown-toggle's computed accessible name is
    // " DE " (icon + surrounding whitespace from source formatting), so an
    // anchored ^...$ regex never matches. Unanchored is still unambiguous —
    // it's the only role=button element in the nav with a locale label.
    this.localeSwitcherButton = this.container.getByRole("button", {
      name: /EN|ES|DE/,
    });
    this.loginLink = this.container.getByRole("link", { name: /sign in|iniciar sesión|anmelden/i });
    this.registerLink = this.container.getByRole("link", {
      name: /register|regist|jetzt registrieren/i,
    });
    // Icon-only anchor, no visible text label — identified by its onclick
    // handler and title attribute, confirmed live: href="#",
    // onclick="handleLogout(event)", title="Logout" (English regardless of
    // locale).
    this.logoutButton = this.container.locator('[onclick*="handleLogout"]');
    this.trialBadge = this.container.getByText(/paid\s*\d+\s*min/i);
    this.favoritesCountBadge = this.container.locator("#favorites-count");
  }

  async switchLocaleViaUi(locale: Locale) {
    await this.localeSwitcherButton.click();
    await this.page
      .getByRole("link", { name: LOCALE_LABEL[locale], exact: true })
      .first()
      .click();
  }

  async expectCurrentLocale(locale: Locale) {
    // The locale label ("EN"/"ES"/"DE") is a bare text node inside the
    // dropdown-toggle <a role="button">, not wrapped in its own child
    // element — so it must be matched against the button's own text
    // content (toContainText), not searched for as a descendant
    // (getByText only matches descendant elements and would never find it).
    await expect(this.localeSwitcherButton).toContainText(LOCALE_LABEL[locale]);
  }

  async logout() {
    await this.logoutButton.click();
  }

  async expectFavoritesCount(count: number) {
    await expect(this.favoritesCountBadge).toHaveText(String(count));
  }
}
