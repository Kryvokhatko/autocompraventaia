import type { Locator, Page } from "@playwright/test";
import { BasePage, type Locale } from "./base.page";
import { NavbarComponent } from "../components/navbar.component";

export class RegisterPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page, "RegisterPage");
    this.navbar = new NavbarComponent(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.emailInput = page.getByLabel(/e-?mail|correo electrónico/i);
    this.passwordInput = page.getByLabel(/password|contraseña|passwort/i);
    this.submitButton = page.getByRole("button", {
      name: /create an account|crear una cuenta|konto erstellen/i,
    });
  }

  async goto(locale: Locale) {
    this.log.info("Navigating to register page", { locale });
    await this.open("/register", locale);
  }

  /**
   * Registers a fresh account. The site grants only a ~60-second free trial
   * per new account, so callers must treat the resulting session as
   * short-lived — see helpers/test-data.ts.
   */
  async register(email: string, password: string) {
    this.log.info("Registering disposable test account");
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL("**/offers");
  }
}
