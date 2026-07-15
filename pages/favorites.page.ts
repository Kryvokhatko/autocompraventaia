import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class FavoritesPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly removeButtons: Locator;

  constructor(page: Page) {
    super(page, "FavoritesPage");
    this.navbar = new NavbarComponent(page);
    this.removeButtons = page.locator(".remove-favorite-btn");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to favorites page", { locale });
    await this.page.goto(`/favorites?_locale=${locale}`);
  }

  async favoriteCount(): Promise<number> {
    return this.removeButtons.count();
  }

  /** Removes the first favorite and accepts the confirm dialog
   * ("Delete this car from favorites?"), confirmed during the walkthrough. */
  async removeFirstFavorite() {
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.removeButtons.first().click();
  }
}
