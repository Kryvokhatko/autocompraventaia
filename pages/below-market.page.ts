import type { Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class BelowMarketPage extends BasePage {
  readonly navbar: NavbarComponent;

  constructor(page: Page) {
    super(page, "BelowMarketPage");
    this.navbar = new NavbarComponent(page);
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to below-market page", { locale });
    await this.page.goto(`/below-market?_locale=${locale}`);
  }

  async pageTitle(): Promise<string> {
    return this.page.title();
  }
}
