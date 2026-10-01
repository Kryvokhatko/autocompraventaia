import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class TopSalesPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly heading: Locator;
  // Ranking rows only: the table body first shows a single "Loading..." row
  // while the ranking is fetched, and real rows carry € prices.
  readonly rankingRows: Locator;

  constructor(page: Page) {
    super(page, "TopSalesPage");
    this.navbar = new NavbarComponent(page);
    this.heading = page.getByRole("heading", { name: /best.?sellers/i });
    this.rankingRows = page
      .getByRole("table")
      .getByRole("rowgroup")
      .nth(1)
      .getByRole("row")
      .filter({ hasText: /\d\s€/ });
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to top sales page", { locale });
    await this.open("/top-sales", locale);
  }
}
