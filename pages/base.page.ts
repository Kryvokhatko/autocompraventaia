import type { Page } from "@playwright/test";
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

  /** Navigate directly via the site's own `?_locale=` convention — the
   * mechanism confirmed during the exploratory walkthrough (nav bar and
   * page content both key off this query param). */
  abstract goto(locale: Locale): Promise<void>;

  async bodyText(): Promise<string> {
    return this.page.locator("body").innerText();
  }
}
