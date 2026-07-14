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
    await this.page.goto(`/login?_locale=${locale}`);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
