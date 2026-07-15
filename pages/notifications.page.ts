import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class NotificationsPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly heading: Locator;
  readonly telegramOption: Locator;
  readonly emailOption: Locator;
  readonly historyTable: Locator;

  constructor(page: Page) {
    super(page, "NotificationsPage");
    this.navbar = new NavbarComponent(page);
    this.heading = page.getByRole("heading", { name: /settings/i });
    this.telegramOption = page.getByText(/telegram/i);
    this.emailOption = page.getByText(/email notifications/i);
    this.historyTable = page.getByRole("table");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to notifications page", { locale });
    await this.page.goto(`/notifications?_locale=${locale}`);
  }
}
