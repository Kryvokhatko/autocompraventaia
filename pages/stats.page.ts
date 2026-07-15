import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

// Confirmed live: "Calendar" is itself a selectable tab (selected by
// default on load), in addition to the 7 tabs named in the manual test
// case — 8 real role="tab" elements total.
const TAB_NAMES = [
  "Calendar",
  "Overview",
  "Trends",
  "Seasonality",
  "Mileage",
  "Liquidity",
  "Risks",
  "Forecast",
] as const;

export class StatsPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly heading: Locator;
  readonly calendarView: Locator;

  constructor(page: Page) {
    super(page, "StatsPage");
    this.navbar = new NavbarComponent(page);
    this.heading = page.getByRole("heading", { name: /analytics.*benefit statistics/i });
    // Confirmed live: the default-selected Calendar tab's panel is headed
    // "Sales Calendar" (level 4).
    this.calendarView = page.getByRole("heading", { name: /sales calendar/i });
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to analytics page", { locale });
    // domcontentloaded, not the default "load" — this page has a known,
    // still-open defect (D-11) causing repeated 410/404 resource-load
    // failures, which can prevent the "load" event from firing promptly.
    // Content readiness is confirmed via explicit locator assertions after
    // goto, not by waiting for every resource to settle.
    await this.page.goto(`/stats/profit?_locale=${locale}`, { waitUntil: "domcontentloaded" });
  }

  tab(name: (typeof TAB_NAMES)[number]): Locator {
    return this.page.getByRole("tab", { name });
  }

  async tabCount(): Promise<number> {
    return this.page.getByRole("tab").count();
  }
}
