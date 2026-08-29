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
  readonly paymentMethodModal: Locator;
  readonly paymentMethodModalCloseButton: Locator;
  // Confirmed live: the modal shows the selected plan's name in Spanish
  // ("Diario"/"Mensual"/"Anual") regardless of the site's active locale —
  // the modal's own copy isn't localized, unlike the rest of the page.
  readonly selectedPlanSummary: Locator;
  // Confirmed live via DOM inspection: each payment-method card carries
  // data-method="<id>" when implemented; unimplemented methods (PayPal,
  // Bank Transfer) instead carry a payment-method-disabled class and no
  // data-method attribute at all.
  readonly stripeMethodOption: Locator;
  readonly disabledPaymentMethodOptions: Locator;

  constructor(page: Page) {
    super(page, "PaymentsPage");
    this.navbar = new NavbarComponent(page);
    this.activeSubscriptionBanner = page.getByText(/active subscription|suscripción activa|aktives abonnement/i);
    this.paymentMethodModal = page.getByRole("dialog");
    this.paymentMethodModalCloseButton = this.paymentMethodModal.getByRole("button", { name: "Close" });
    this.selectedPlanSummary = this.paymentMethodModal.getByText(/Selected Plan/i).locator("..");
    this.stripeMethodOption = this.paymentMethodModal.locator('[data-method="stripe"]');
    this.disabledPaymentMethodOptions = this.paymentMethodModal.locator(".payment-method-disabled");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to payments page", { locale });
    await this.page.goto(`/pagos?_locale=${locale}`);
  }

  /**
   * FIX (this session, confirmed via a real failing run — not a
   * pre-existing convention to preserve as-is): the previous
   * `getByText(PLAN_HEADING[plan]).locator("..")` was a strict-mode
   * violation for "daily" specifically — the Monthly and Yearly cards each
   * contain their own comparison copy ("Save vs daily plan: 79%"/"91%"),
   * so the plain-text regex matched 3 elements instead of 1. Scoping to a
   * level-3 heading role avoids that false match, and going up two levels
   * (heading -> `.pricing-card-header` -> the card itself, confirmed live)
   * reaches the actual card container that also holds the price and the
   * "Select Plan" button — the single `..` used before only reached the
   * header wrapper, which is why `selectPlanButton()` timed out.
   */
  planCard(plan: PlanName): Locator {
    return this.page.getByRole("heading", { level: 3, name: PLAN_HEADING[plan] }).locator("..").locator("..");
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

  selectPlanButton(plan: PlanName): Locator {
    return this.planCard(plan).getByRole("button", { name: "Select Plan" });
  }

  async openPaymentMethodModal(plan: PlanName) {
    this.log.info("Opening payment-method modal", { plan });
    await this.selectPlanButton(plan).click();
    await this.paymentMethodModal.waitFor({ state: "visible" });
  }

  async closePaymentMethodModal() {
    this.log.info("Closing payment-method modal without selecting a method");
    await this.paymentMethodModalCloseButton.click();
    await this.paymentMethodModal.waitFor({ state: "hidden" });
  }

  /** Clicking Stripe navigates the current page (same tab, not a popup) to
   * Stripe's hosted Checkout — callers should follow up with
   * StripeCheckoutPage.waitForLoad() rather than expecting to stay on
   * /pagos. */
  async chooseStripe() {
    this.log.info("Selecting Stripe as the payment method");
    await this.stripeMethodOption.click();
  }
}
