import { expect, type Page } from "@playwright/test";
import { createLogger, type Logger } from "../helpers/logger";

/**
 * Every Page Object extends this so navigation and logging are consistent.
 */

export type Locale = "en" | "es" | "de";

export abstract class BasePage {
  protected readonly log: Logger;

  constructor(readonly page: Page, scope: string) {
    this.log = createLogger(scope);
  }

  /** Navigate directly via the site's own `?_locale=` convention. */
  abstract goto(locale: Locale): Promise<void>;

  /**
   * Opens `path` under the given locale and asserts the browser actually
   * stayed on it. Signed-in pages redirect to /pagos once the account's trial
   * has ended and to /login without a session; without this check, an
   * assertion that only looks for text being absent would pass on the
   * redirect target instead of the page under test.
   */
  protected async open(path: string, locale: Locale, options?: Parameters<Page["goto"]>[1]) {
    await this.page.goto(`${path}?_locale=${locale}`, options);
    // Matches the exact path on any host, followed by a query, hash or the end.
    const samePath = new RegExp(`^[^?#]*://[^/]+${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[?#]|$)`);
    await expect(
      this.page,
      `Expected to stay on ${path} — a redirect here usually means the trial expired or the session is missing`
    ).toHaveURL(samePath);
  }

  async bodyText(): Promise<string> {
    return this.page.locator("body").innerText();
  }
}
