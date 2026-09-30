import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class FavoritesPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly removeButtons: Locator;
  // Each favorite card carries a `.vendido` ("sold") marker once its
  // listing has sold; sold cards stay on the page but are faded out and
  // are not counted in the navbar favorites badge.
  readonly soldMarkers: Locator;

  constructor(page: Page) {
    super(page, "FavoritesPage");
    this.navbar = new NavbarComponent(page);
    this.removeButtons = page.locator(".remove-favorite-btn");
    this.soldMarkers = page.getByRole("main").locator(".vendido");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to favorites page", { locale });
    await this.open("/favorites", locale);
  }

  async favoriteCount(): Promise<number> {
    return this.removeButtons.count();
  }

  async soldCount(): Promise<number> {
    return this.soldMarkers.count();
  }

  /** Removes the first favorite that is not marked sold and accepts the
   * confirm dialog ("Delete this car from favorites?"). Each card wrapper
   * carries a data-net-profit attribute. */
  async removeFirstUnsoldFavorite() {
    const firstUnsoldCard = this.page
      .getByRole("main")
      .locator("[data-net-profit]")
      .filter({ hasNot: this.page.locator(".vendido") })
      .first();
    this.page.once("dialog", (dialog) => dialog.accept());
    await firstUnsoldCard.locator(".remove-favorite-btn").click();
  }
}
