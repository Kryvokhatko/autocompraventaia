import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class HomePage extends BasePage {
  readonly navbar: NavbarComponent;
  // The above-the-fold hero: a `<section class="hero-section">` directly
  // after the nav, with no landmark role or accessible name of its own.
  readonly hero: Locator;

  constructor(page: Page) {
    super(page, "HomePage");
    this.navbar = new NavbarComponent(page);
    this.hero = page.locator(".hero-section");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to home page", { locale });
    await this.open("/", locale);
  }
}
