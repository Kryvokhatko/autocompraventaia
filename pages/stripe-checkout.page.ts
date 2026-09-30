import { expect, type Locator, type Page } from "@playwright/test";
import { createLogger, type Logger } from "../helpers/logger";

export type StripeCurrency = "uah" | "eur";

const CURRENCY_NAME: Record<StripeCurrency, RegExp> = {
  uah: /^(UA\s+)?UAH\s/,
  eur: /^(EU\s+)?€\d/,
};

/**
 * Represents the Stripe-hosted Checkout page that PaymentsPage.chooseStripe()
 * redirects the SAME tab to (checkout.stripe.com, not a popup). This is a
 * third-party surface we don't control, so unlike the site's own Page
 * Objects it has no `?_locale=`-style entry point of its own and doesn't
 * extend BasePage — it's only ever reached via that redirect, never
 * navigated to directly.
 *
 * Locators here prefer role/label/text matching, confirmed live against the
 * real checkout DOM. Where no role/accessible-name anchor exists, a
 * confirmed-stable Stripe component class name is used instead (e.g.
 * ReadOnlyFormField-title) rather than the hashed/obfuscated classes
 * Stripe also generates elsewhere on this page, which are deliberately
 * avoided.
 */
export class StripeCheckoutPage {
  private readonly log: Logger;

  // The single line item Stripe renders for the plan being purchased, e.g.
  // "Acceso por 1 día  UAH 161.28" — confirmed live; text stays Spanish
  // regardless of the site locale the visitor came from (same pattern as
  // PaymentsPage.selectedPlanSummary).
  readonly lineItem: Locator;
  readonly emailValue: Locator;
  readonly payButton: Locator;
  readonly backToSiteLink: Locator;

  constructor(private readonly page: Page) {
    this.log = createLogger("StripeCheckoutPage");
    // The label and price sit together in the parent of Stripe's semantic
    // `.LineItem-productName` element; the label's own text wrapper
    // (`.ExpandableText`) does not contain the price.
    this.lineItem = page.locator(".LineItem-productName").locator("..");
    // The pre-filled email is rendered in Stripe's semantic (not hashed)
    // ReadOnlyFormField-title component.
    this.emailValue = page.locator(".ReadOnlyFormField-title");
    this.payButton = page.getByRole("button", { name: "Pay" });
    this.backToSiteLink = page.getByRole("link", { name: "Back to Auto CompraVenta IA" });
  }

  async waitForLoad() {
    this.log.info("Waiting for Stripe Checkout to load");
    // Checkout keeps loading third-party scripts (hCaptcha, HumanSecurity
    // bot detection) long after its content is usable, which can push the
    // "load" event past 15s — so wait for "domcontentloaded" and use the
    // line item as the readiness signal.
    await this.page.waitForURL(/checkout\.stripe\.com/, { waitUntil: "domcontentloaded", timeout: 15000 });
    await this.lineItem.waitFor({ state: "visible", timeout: 20000 });
    // The line item's label renders before its converted amount (the live
    // conversion rate arrives separately), so wait for the currency figure.
    await expect(this.lineItem).toContainText(/€|UAH/, { timeout: 15000 });
  }

  /**
   * Stripe serves two variants of the "Choose currency" switcher, varying
   * between Checkout sessions:
   *   - buttons in the page itself, the active currency's button disabled;
   *   - a radio group inside an iframe, the active currency's radio checked.
   * Either way the accessible name is the currency plus the live-converted
   * amount, sometimes prefixed by the flag image's alt text ("UA UAH 158.09"
   * or "UAH 158.09", "EU €2.99" or "€2.99"), so the amount is ignored and
   * the flag prefix is optional.
   */
  private async currencyControl(currency: StripeCurrency): Promise<{ control: Locator; kind: "button" | "radio" }> {
    const name = CURRENCY_NAME[currency];
    let found: { control: Locator; kind: "button" | "radio" } | undefined;
    await expect(async () => {
      const button = this.page.getByRole("button", { name });
      if (await button.count()) {
        found = { control: button, kind: "button" };
        return;
      }
      for (const frame of this.page.frames()) {
        const radio = frame.getByRole("radio", { name });
        if (await radio.count()) {
          found = { control: radio, kind: "radio" };
          return;
        }
      }
      throw new Error(`No "${currency}" currency option found in Stripe Checkout`);
    }).toPass({ timeout: 15_000 });
    this.log.debug("Currency switcher variant", { kind: found!.kind });
    return found!;
  }

  async selectCurrency(currency: StripeCurrency) {
    this.log.info("Switching Checkout currency", { currency });
    const { control, kind } = await this.currencyControl(currency);
    if (kind === "radio") {
      // The visible option is a styled label drawn beside the radio input, so
      // a pointer click at the input's position does not select it, and
      // check() fails because Stripe updates the checked state
      // asynchronously. Dispatching the click on the radio itself fires its
      // change handler directly; the line-item wait below confirms it.
      await control.dispatchEvent("click");
    } else {
      await control.click();
    }
    // The switcher's own state changes before the line item's amount is
    // recalculated, so wait on the line item showing the new currency — the
    // content callers actually read.
    const symbol = currency === "eur" ? "€" : "UAH";
    await expect(this.lineItem).toContainText(symbol, { timeout: 10000 });
  }

  /** Reads the active currency from the switcher state (disabled button or
   * checked radio, see currencyControl) rather than parsing the fluctuating
   * converted amount. */
  async activeCurrency(): Promise<StripeCurrency> {
    const { control, kind } = await this.currencyControl("uah");
    const uahActive = kind === "radio" ? await control.isChecked() : await control.isDisabled();
    return uahActive ? "uah" : "eur";
  }

  async lineItemText(): Promise<string> {
    return (await this.lineItem.innerText()).trim();
  }

  async emailText(): Promise<string> {
    return (await this.emailValue.innerText()).trim();
  }

  /**
   * Waits for the Amazon Pay wallet asset request Stripe only issues for
   * some currencies (confirmed live: present after switching to EUR, not
   * present under the UAH default — see TC-PAY-009). Resolves to
   * true/false rather than throwing, since wallet eligibility is
   * legitimately environment-dependent (browser/device/region), not a
   * hard pass/fail signal on its own.
   */
  async waitForAmazonPayOffer(timeoutMs = 5000): Promise<boolean> {
    try {
      await this.page.waitForRequest((req) => req.url().includes("AmazonPayButton.html"), { timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * This Checkout Session renders the card fields as plain page-level
   * inputs, not inside an iframe: `#cardForm-fieldset` contains
   * `#cardNumber` (aria-label "Card number"), `#cardExpiry` ("Expiration")
   * and `#cardCvc` ("Credit or debit card CVC/CVV"). That is specific to
   * this Checkout configuration and would change if the integration moved
   * to embedded Elements.
   *
   * Cardholder name, Address line 1, City and Postal code are also
   * required; without them "Pay" stops at client-side validation and the
   * card number is never evaluated. They get fixed, clearly fake filler
   * values; `opts.name` overrides the cardholder name.
   */
  async fillCardTestData(opts: { number: string; expiry: string; cvc: string; name?: string }) {
    await this.page.getByLabel("Card number").fill(opts.number);
    await this.page.getByLabel("Expiration").fill(opts.expiry);
    // A plain getByLabel(/CVC/i) is ambiguous — an adjacent SVG help icon
    // carries the identical aria-label ("Credit or debit card CVC/CVV")
    // for its own accessibility purposes. Scope to the textbox role to
    // get just the input.
    await this.page.getByRole("textbox", { name: /CVC/i }).fill(opts.cvc);
    await this.page.getByPlaceholder(/full name on card/i).fill(opts.name ?? "QA Automation");
    await this.page.getByLabel("Address line 1").fill("1 Test Street");
    await this.page.getByLabel("City").fill("Kyiv");
    await this.page.getByLabel("Postal code").fill("01001");
  }

  async submitPayment() {
    this.log.info("Submitting payment");
    await this.payButton.click();
  }

  async goBackToSite() {
    await this.backToSiteLink.click();
  }
}
