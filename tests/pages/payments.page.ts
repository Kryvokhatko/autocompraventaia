import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export type PlanName = "daily" | "monthly" | "yearly";

const PLAN_HEADING: Record<PlanName, RegExp> = {
  daily: /daily|diario|täglich/i,
  monthly: /monthly|mensual|monatlich/i,
  yearly: /yearly|annual|jährlich/i,
};

export class PaymentsPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly activeSubscriptionBanner: Locator;

  constructor(page: Page) {
    super(page, "PaymentsPage");
    this.navbar = new NavbarComponent(page);
    this.activeSubscriptionBanner = page.getByText(/active subscription|suscripción activa|aktives abonnement/i);
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to payments page", { locale });
    await this.page.goto(`/pagos?_locale=${locale}`);
  }

  planCard(plan: PlanName): Locator {
    return this.page.getByText(PLAN_HEADING[plan]).locator("..");
  }

  async priceText(plan: PlanName): Promise<string> {
    return (await this.planCard(plan).innerText()).trim();
  }

  /** Full page text — used for regex assertions on formatting (date, decimal
   * separator, unit suffix) that are easier to check against raw text than
   * against a single brittle locator, given the DOM structure wasn't fully
   * enumerated during initial review. */
  async pageText(): Promise<string> {
    return this.bodyText();
  }
}
