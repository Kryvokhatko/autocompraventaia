import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class TopSalesPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page, "TopSalesPage");
    this.navbar = new NavbarComponent(page);
    this.heading = page.getByRole("heading", { name: /best.?sellers/i });
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to top sales page", { locale });
    await this.page.goto(`/top-sales?_locale=${locale}`);
  }
}
