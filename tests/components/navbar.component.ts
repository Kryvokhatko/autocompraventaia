import type { Locator, Page } from "@playwright/test";
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

  constructor(private readonly page: Page) {
    this.container = page.getByRole("navigation");
    this.localeSwitcherButton = this.container.getByRole("button", {
      name: /^(EN|ES|DE)$/,
    });
    this.loginLink = this.container.getByRole("link", { name: /sign in|iniciar sesión|anmelden/i });
    this.registerLink = this.container.getByRole("link", {
      name: /register|regist|jetzt registrieren/i,
    });
  }

  async switchLocaleViaUi(locale: Locale) {
    await this.localeSwitcherButton.click();
    await this.page
      .getByRole("link", { name: LOCALE_LABEL[locale], exact: true })
      .first()
      .click();
  }

  async expectCurrentLocale(locale: Locale) {
    await this.localeSwitcherButton.getByText(LOCALE_LABEL[locale]).waitFor();
  }
}
