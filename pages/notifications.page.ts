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
    // Each channel is a level-6 heading; plain text matching also hits the
    // push-status line ("Connect Telegram or enable verified email…").
    this.telegramOption = page.getByRole("heading", { name: "Telegram", exact: true });
    this.emailOption = page.getByRole("heading", { name: "Email Notifications", exact: true });
    this.historyTable = page.getByRole("table");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to notifications page", { locale });
    await this.open("/notifications", locale);
  }
}
