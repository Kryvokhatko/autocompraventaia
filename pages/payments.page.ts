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
  // Payment-method cards have no role or accessible name; each is a
  // `.payment-method-option`. Implemented methods carry data-method="<id>";
  // unavailable ones (PayPal, Bank Transfer) show a visible "Coming soon"
  // label, which is what identifies them here.
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
    this.disabledPaymentMethodOptions = this.paymentMethodModal
      .locator(".payment-method-option")
      .filter({ hasText: "Coming soon" });
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to payments page", { locale });
    await this.open("/pagos", locale);
  }

  /**
   * Anchored on the level-3 plan heading: plain text matching for "daily"
   * would also hit the Monthly and Yearly cards' "Save vs daily plan" copy.
   * Two levels up (heading -> `.pricing-card-header` -> card) is the card
   * container that holds the price and the "Select Plan" button.
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
