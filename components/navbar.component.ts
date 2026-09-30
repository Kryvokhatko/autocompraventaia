import { expect, type Locator, type Page } from "@playwright/test";
import type { Locale } from "../pages/base.page";

const LOCALE_CODE: Record<Locale, string> = { en: "EN", es: "ES", de: "DE" };
const LOCALE_MENU_NAME: Record<Locale, string> = { en: "English", es: "Español", de: "Deutsch" };
// Bootstrap's `navbar-expand-xxl` collapses the nav below this width.
const XXL_BREAKPOINT_PX = 1400;

/**
 * Reusable nav-bar component.
 *
 * The nav bar is a Bootstrap `navbar-expand-xxl`: below 1400px viewport
 * width, the nav links, language switcher, trial/subscription timer,
 * favorites link and logout icon all sit inside a collapsed `#navbarNav`
 * and are hidden until the "Menu" toggler is clicked. Anything that needs
 * those elements visible calls `openMenu()` first; at 1400px and wider the
 * toggler is hidden and `openMenu()` does nothing.
 *
 * Tests should prefer `goto(locale)` on the Page Object (query-param
 * navigation) and reserve `switchLocaleViaUi` for checks of the switcher
 * itself.
 */
export class NavbarComponent {
  readonly container: Locator;
  // Label is localized: "Menu" / "Menú" / "Menü".
  readonly menuToggle: Locator;
  readonly localeSwitcherButton: Locator;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly logoutButton: Locator;
  // Links to /pagos. Text is "paid " followed by "N days", "H:MM", "N min"
  // or "M:SS" depending on the time left — a new account's ~60-second
  // trial shows "paid 0:59", the paid test account shows "paid 364 days".
  readonly trialBadge: Locator;
  // <span id="favorites-count"> inside the favorites link; counts only
  // favorites that are not marked sold.
  readonly favoritesCountBadge: Locator;

  constructor(private readonly page: Page) {
    this.container = page.getByRole("navigation");
    this.menuToggle = this.container.getByRole("button", { name: /^(menu|menú|menü)$/i });
    // Unanchored: the dropdown-toggle's accessible name is the globe icon
    // glyph plus whitespace plus the code (" EN"), so an anchored ^...$
    // regex never matches. Still unambiguous — it's the only role=button
    // element in the nav with a locale code.
    this.localeSwitcherButton = this.container.getByRole("button", {
      name: /EN|ES|DE/,
    });
    this.loginLink = this.container.getByRole("link", { name: /sign in|iniciar sesión|anmelden/i });
    this.registerLink = this.container.getByRole("link", {
      name: /create an account|crear una cuenta|konto erstellen/i,
    });
    // Icon-only anchor with no accessible name: href="#",
    // onclick="handleLogout(event)", title="Logout".
    this.logoutButton = this.container.locator('[onclick*="handleLogout"]');
    this.trialBadge = this.container.getByRole("link", { name: /^paid\s+\d/i });
    this.favoritesCountBadge = this.container.locator("#favorites-count");
  }

  async openMenu() {
    // Decided from the viewport rather than the toggler's visibility, which
    // reads as hidden for a moment while a freshly navigated page renders.
    if ((this.page.viewportSize()?.width ?? 0) >= XXL_BREAKPOINT_PX) return;
    // A click that lands before Bootstrap's collapse script has initialised
    // does nothing, so retry until the menu has actually expanded.
    await expect(async () => {
      if ((await this.menuToggle.getAttribute("aria-expanded")) !== "true") {
        await this.menuToggle.click();
      }
      await expect(this.page.locator("#navbarNav")).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 10_000 });
  }

  async switchLocaleViaUi(locale: Locale) {
    await this.openMenu();
    await this.localeSwitcherButton.click();
    await this.page.getByRole("link", { name: LOCALE_MENU_NAME[locale], exact: true }).click();
  }

  async expectCurrentLocale(locale: Locale) {
    await this.openMenu();
    // The locale code is a bare text node inside the dropdown-toggle
    // <a role="button">, not wrapped in its own child element — so it must
    // be matched against the button's own text content (toContainText),
    // not searched for as a descendant (getByText only matches elements).
    await expect(this.localeSwitcherButton).toContainText(LOCALE_CODE[locale]);
  }

  /** Access expiry (trial or paid subscription) as epoch milliseconds, read
   * from the timer's data-expires attribute — works while the menu is
   * collapsed. */
  async trialExpiresAt(): Promise<number> {
    const expires = await this.container.locator("#trial-timer").getAttribute("data-expires");
    if (!expires) {
      throw new Error("Navbar timer (#trial-timer) has no data-expires attribute — is the user signed in?");
    }
    return Date.parse(expires);
  }

  /** The site's handleLogout() clears cookies/storage client-side (after up
   * to 1.5s of push-subscription cleanup), then navigates to /logout. Wait
   * for that navigation to finish so the caller's next goto() doesn't race
   * it. */
  async logout() {
    await this.openMenu();
    const nextPageLoaded = this.page.waitForEvent("load");
    await this.logoutButton.click();
    await nextPageLoaded;
  }

  async expectFavoritesCount(count: number) {
    // toHaveText does not require visibility, so this works with the menu collapsed.
    await expect(this.favoritesCountBadge).toHaveText(String(count));
  }
}
