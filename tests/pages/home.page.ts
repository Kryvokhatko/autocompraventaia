import type { Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class HomePage extends BasePage {
  readonly navbar: NavbarComponent;

  constructor(page: Page) {
    super(page, "HomePage");
    this.navbar = new NavbarComponent(page);
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to home page", { locale });
    await this.page.goto(`/?_locale=${locale}`);
  }
}
