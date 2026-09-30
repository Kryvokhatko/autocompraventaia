import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class LoginPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, "LoginPage");
    this.navbar = new NavbarComponent(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.emailInput = page.getByLabel(/e-?mail|correo electrónico/i);
    this.passwordInput = page.getByLabel(/password|contraseña|passwort/i);
    this.submitButton = page.getByRole("button", {
      name: /sign in|iniciar sesión|anmelden/i,
    });
    this.errorMessage = page.getByRole("alert");
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to login page", { locale });
    await this.open("/login", locale);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Same as login(), for credentials that must not appear in test output.
   * Playwright names each fill() step after the typed value, and step names
   * are stored in the HTML report, which CI uploads as a downloadable
   * artifact. Writing the values through the DOM gives steps named
   * "Evaluate" instead. The form is a plain server-rendered POST, so setting
   * the input values directly submits them unchanged.
   */
  async loginWithSecretCredentials(email: string, password: string) {
    const setValue = (input: HTMLElement, value: string) => {
      (input as HTMLInputElement).value = value;
    };
    await this.emailInput.evaluate(setValue, email);
    await this.passwordInput.evaluate(setValue, password);
    await this.submitButton.click();
  }
}
