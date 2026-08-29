import { expect, type Locator, type Page } from "@playwright/test";
import { createLogger, type Logger } from "../helpers/logger";

export type StripeCurrency = "uah" | "eur";

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

  readonly currencyToggle: Record<StripeCurrency, Locator>;
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
    // Confirmed live: the accessible name includes the live-converted
    // amount ("UA UAH 161.28" / "EU €2.99"), so match on the fixed prefix
    // rather than the full (fluctuating) name.
    this.currencyToggle = {
      uah: page.getByRole("button", { name: "UA UAH" }),
      eur: page.getByRole("button", { name: "EU €" }),
    };
    // FIX (this session, confirmed via a real failing run): the original
    // getByText(...).locator("..") only reached the label's own wrapper
    // (`.ExpandableText`), never the price — real DOM inspection showed
    // the label and price are combined four levels up from the text node,
    // inside a plain flex-utility div. Anchoring on Stripe's semantic
    // `.LineItem-productName` class and going up just one level from there
    // is more robust than counting generic-div depth from a text match.
    this.lineItem = page.locator(".LineItem-productName").locator("..");
    // FIX (this session, confirmed via a real failing run): the original
    // xpath-following-sibling guess timed out — real DOM inspection showed
    // Stripe names this field's value with its own semantic (not hashed)
    // component class, ReadOnlyFormField-title, which is simpler and more
    // direct than walking sibling structure from the label.
    this.emailValue = page.locator(".ReadOnlyFormField-title");
    this.payButton = page.getByRole("button", { name: "Pay" });
    this.backToSiteLink = page.getByRole("link", { name: "Back to Auto CompraVenta IA" });
  }

  async waitForLoad() {
    this.log.info("Waiting for Stripe Checkout to load");
    // FIX (this session, confirmed via a real failing run): default
    // waitForURL waits for the "load" event, but this page keeps loading
    // several third-party scripts (hCaptcha, HumanSecurity bot-detection)
    // well after DOM content settles, occasionally pushing "load" past
    // 15s. Wait for "domcontentloaded" instead and rely on the lineItem
    // assertion below for actual content readiness — that's the real
    // signal this page is usable, not the browser's "load" event.
    await this.page.waitForURL(/checkout\.stripe\.com/, { waitUntil: "domcontentloaded", timeout: 15000 });
    await this.lineItem.waitFor({ state: "visible", timeout: 20000 });
    // FIX (this session, confirmed via a real failing run): the line
    // item's label renders before its converted amount does (a brief gap,
    // presumably while the live conversion rate is fetched) — waiting for
    // the container to merely exist let TC-PAY-009 read the amount too
    // early and get only the label text. Wait for the currency figure
    // specifically before considering the page settled.
    await expect(this.lineItem).toContainText(/€|UAH/, { timeout: 15000 });
  }

  async selectCurrency(currency: StripeCurrency) {
    this.log.info("Switching Checkout currency", { currency });
    await this.currencyToggle[currency].click();
    // FIX (this session, confirmed via two real failing runs): both prior
    // attempts inferred completion from the toggle buttons' disabled
    // state, which proved unreliable (their disabled/enabled transitions
    // don't line up cleanly with when the line item's text actually
    // updates). Waiting directly on the content this method's callers
    // actually care about — the line item showing the new currency
    // symbol — is the one signal that can't be stale by construction.
    const symbol = currency === "eur" ? "€" : "UAH";
    await expect(this.lineItem).toContainText(symbol, { timeout: 10000 });
  }

  /** The currency toggle button matching the currently-active currency is
   * rendered `disabled` (you can't "switch" to the currency already
   * selected) — confirmed live. Used to assert the default without relying
   * on parsing the fluctuating converted amount. */
  async activeCurrency(): Promise<StripeCurrency> {
    return (await this.currencyToggle.uah.isDisabled()) ? "uah" : "eur";
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
   * FIX (this session, confirmed via a real failing run against TC-PAY-015
   * — safe to exercise unconditionally since it uses a Stripe test card
   * number, which Stripe rejects outright on this live-mode session): the
   * original iframe-based locator guessed wrong. Real DOM inspection (via
   * a read-only `eval`, never submitted) showed this Checkout Session
   * renders the card fields as plain top-level inputs, not inside an
   * iframe — `#cardForm-fieldset` contains `#cardNumber` (aria-label
   * "Card number"), `#cardExpiry` ("Expiration"), and `#cardCvc`
   * ("Credit or debit card CVC/CVV"). Card fields being page-level rather
   * than iframed is specific to this Checkout Session configuration and
   * could change if the integration moves to embedded Elements — reconfirm
   * if this starts failing.
   *
   * FIX (this session, confirmed via a real failing run): filling only the
   * card fields let "Pay" trip client-side required-field validation
   * instead of ever reaching Stripe — Cardholder name, Address line 1,
   * City, and Postal code are all required on this Checkout Session and
   * were left empty. Fill them with fixed, clearly-fake filler values
   * (this is billing-form plumbing incidental to what each test case is
   * actually verifying, not data any current test case varies) so the
   * card number is what actually gets evaluated. `opts.name` still lets a
   * caller override the cardholder name specifically.
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
