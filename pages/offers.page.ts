import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class OffersPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly listingTable: Locator;
  readonly listingRows: Locator;

  constructor(page: Page) {
    super(page, "OffersPage");
    this.navbar = new NavbarComponent(page);
    this.listingTable = page.getByRole("table");
    this.listingRows = this.listingTable.locator("tbody tr");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to offers dashboard", { locale });
    await this.page.goto(`/offers?_locale=${locale}`);
  }

  async rowCount(): Promise<number> {
    return this.listingRows.count();
  }
}
