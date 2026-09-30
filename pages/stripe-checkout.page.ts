import { expect, type Frame, type Locator, type Page } from "@playwright/test";
import { createLogger, type Logger } from "../helpers/logger";

/**
 * Checkout prices the plan in the visitor's local currency, chosen from the
 * visitor's location (UAH from Ukraine, USD from a US-hosted CI runner), and
 * offers the merchant's own currency, EUR, as the alternative. Only EUR is
 * the same everywhere, so it is the one option addressed by name.
 */
export type CheckoutCurrency = "eur" | "local";

// "EU €2.99" or "€2.99" — the flag image's alt-text prefix appears in some
// Checkout sessions and not others; the amount is ignored.
const EURO_OPTION_NAME = /^(EU\s+)?€\d/;

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
  // "Acceso por 1 día  UAH 161.28" or "Acceso por 1 día  $3.53" depending
  // on the visitor's location; the label stays Spanish
  // regardless of the site locale the visitor came from (same pattern as
  // PaymentsPage.selectedPlanSummary).
  readonly lineItem: Locator;
  readonly backToSiteLink: Locator;

  constructor(private readonly page: Page) {
    this.log = createLogger("StripeCheckoutPage");
    // The label and price sit together in the parent of Stripe's semantic
    // `.LineItem-productName` element; the label's own text wrapper
    // (`.ExpandableText`) does not contain the price.
    this.lineItem = page.locator(".LineItem-productName").locator("..");
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
    // conversion rate arrives separately), so wait for the amount itself —
    // in whatever currency this visitor's location gets.
    await expect(this.lineItem).toContainText(/\d[.,]\d{2}/, { timeout: 15000 });
  }

  /**
   * The EUR option of the "Choose currency" switcher. Stripe serves two
   * variants of the switcher, varying between Checkout sessions:
   *   - buttons in the page itself, the active currency's button disabled;
   *   - a radio group inside an iframe, the active currency's radio checked.
   */
  private async euroOption(): Promise<{ control: Locator; kind: "button" | "radio" }> {
    let found: { control: Locator; kind: "button" | "radio" } | undefined;
    await expect(async () => {
      const button = this.page.getByRole("button", { name: EURO_OPTION_NAME });
      if (await button.count()) {
        found = { control: button, kind: "button" };
        return;
      }
      for (const frame of this.page.frames()) {
        const radio = frame.getByRole("radio", { name: EURO_OPTION_NAME });
        if (await radio.count()) {
          found = { control: radio, kind: "radio" };
          return;
        }
      }
      throw new Error("No EUR option found in Stripe Checkout's currency switcher");
    }).toPass({ timeout: 15_000 });
    this.log.debug("Currency switcher variant", { kind: found!.kind });
    return found!;
  }

  async switchToEuro() {
    this.log.info("Switching Checkout currency to EUR");
    const { control, kind } = await this.euroOption();
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
    // recalculated, so wait on the line item showing euros — the content
    // callers actually read.
    await expect(this.lineItem).toContainText("€", { timeout: 10000 });
  }

  /** Reads the active currency from the EUR option's state (disabled button
   * or checked radio) rather than parsing the fluctuating converted amount. */
  async activeCurrency(): Promise<CheckoutCurrency> {
    const { control, kind } = await this.euroOption();
    const euroActive = kind === "radio" ? await control.isChecked() : await control.isDisabled();
    return euroActive ? "eur" : "local";
  }

  async lineItemText(): Promise<string> {
    return (await this.lineItem.innerText()).trim();
  }

  /**
   * Stripe serves the contact/payment form in one of two layouts, varying
   * between Checkout sessions: directly in the page (email shown as
   * read-only text, `.ReadOnlyFormField-title`), or inside an iframe (email
   * shown as a disabled "Email" textbox, card and billing fields and the Pay
   * button all inside that frame). Returns whichever frame holds the card
   * number field.
   */
  private async formFrame(): Promise<Frame> {
    let found: Frame | undefined;
    await expect(async () => {
      for (const frame of [this.page.mainFrame(), ...this.page.frames()]) {
        if (await frame.getByRole("textbox", { name: "Card number" }).count()) {
          found = frame;
          return;
        }
      }
      throw new Error("Stripe Checkout payment form not found");
    }).toPass({ timeout: 15_000 });
    this.log.debug("Checkout form layout", { inIframe: found !== this.page.mainFrame() });
    return found!;
  }

  async emailText(): Promise<string> {
    const frame = await this.formFrame();
    const readOnlyEmail = frame.locator(".ReadOnlyFormField-title");
    if (await readOnlyEmail.count()) {
      return (await readOnlyEmail.innerText()).trim();
    }
    return (await frame.getByRole("textbox", { name: "Email" }).inputValue()).trim();
  }

  async payButton(): Promise<Locator> {
    return (await this.formFrame()).getByRole("button", { name: "Pay" });
  }

  /**
   * Waits for the Amazon Pay wallet asset request Stripe only issues for
   * some currencies (confirmed live: present after switching to EUR, not
   * present under the local-currency default — see TC-PAY-009). Resolves to
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
   * Fills the card and billing fields in whichever layout this session uses
   * (see formFrame). Field names differ slightly between the two layouts:
   * "Expiration" vs "Expiration (MM/YY)", "Credit or debit card CVC/CVV" vs
   * "Security code", and a "Full name on card" placeholder vs a "Full name"
   * label — the locators below accept both. Textbox roles are used because
   * an SVG help icon next to the CVC field carries the same aria-label.
   *
   * Cardholder name, Address line 1, City and Postal code are required;
   * without them "Pay" stops at client-side validation and the card number
   * is never evaluated. They get fixed, clearly fake filler values;
   * `opts.name` overrides the cardholder name.
   */
  async fillCardTestData(opts: { number: string; expiry: string; cvc: string; name?: string }) {
    const form = await this.formFrame();
    await form.getByRole("textbox", { name: "Card number" }).fill(opts.number);
    await form.getByRole("textbox", { name: /^Expiration/ }).fill(opts.expiry);
    await form.getByRole("textbox", { name: /CVC|Security code/i }).fill(opts.cvc);
    await form
      .getByPlaceholder(/full name on card/i)
      .or(form.getByRole("textbox", { name: /^full name$/i }))
      .first()
      .fill(opts.name ?? "QA Automation");
    await form.getByRole("textbox", { name: "Address line 1" }).fill("1 Test Street");
    await form.getByRole("textbox", { name: "City" }).fill("Kyiv");
    await form.getByRole("textbox", { name: "Postal code" }).fill("01001");
  }

  async submitPayment() {
    this.log.info("Submitting payment");
    await (await this.payButton()).click();
  }

  async goBackToSite() {
    await this.backToSiteLink.click();
  }
}
