import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class OffersPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly listingTable: Locator;
  // Listing rows only: the table body first shows a single "Loading..." row
  // while listings are fetched, and real rows carry € prices ("13.990 €",
  // with a non-breaking space before the symbol).
  readonly listingRows: Locator;

  constructor(page: Page) {
    super(page, "OffersPage");
    this.navbar = new NavbarComponent(page);
    this.listingTable = page.getByRole("table");
    this.listingRows = this.listingTable
      .getByRole("rowgroup")
      .nth(1)
      .getByRole("row")
      .filter({ hasText: /\d\s€/ });
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to offers dashboard", { locale });
    await this.open("/offers", locale);
  }

  async rowCount(): Promise<number> {
    return this.listingRows.count();
  }

  /** Make and the lowest German and Spanish prices of the first listing.
   * Columns: Actions, Make, Model, Year from, DE, ES, … */
  async firstListing(): Promise<{ make: string; priceDe: string; priceEs: string }> {
    const cells = this.listingRows.first().getByRole("cell");
    return {
      make: (await cells.nth(1).innerText()).trim(),
      priceDe: (await cells.nth(4).innerText()).trim(),
      priceEs: (await cells.nth(5).innerText()).trim(),
    };
  }
}
