import { test as setup, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { AUTH_FILE, getTestUser } from "../../helpers/test-user";
import { createLogger } from "../../helpers/logger";

/**
 * Signs in the shared paid test account once per run and saves the session
 * (storageState) so every spec that needs a signed-in user reuses it.
 * Failing here fails fast with one clear error instead of every dependent
 * test failing on a login page.
 *
 * Why a paid account rather than self-registered ones: a newly registered
 * account only gets a ~60-second free trial, after which every dashboard page
 * redirects to /pagos — far shorter than one run of the suite.
 */

// This step handles the shared account's credentials, and traces record
// the arguments of every action. CI uploads reports as downloadable
// artifacts, so recording is disabled here (see also
// LoginPage.loginWithSecretCredentials).
setup.use({ trace: "off", screenshot: "off", video: "off" });

const log = createLogger("AuthSetup");

setup("sign in shared paid test account", async ({ page }) => {
  const user = getTestUser();

  log.info("Signing in shared test account");
  const loginPage = new LoginPage(page);
  await loginPage.goto("en");
  await loginPage.loginWithSecretCredentials(user.email, user.password);
  await expect(page).toHaveURL(/\/offers/, { timeout: 15_000 });

  const expiresAt = await loginPage.navbar.trialExpiresAt();
  if (expiresAt <= Date.now()) {
    throw new Error("The shared test account's subscription has expired and needs renewing by the site owner.");
  }

  const daysLeft = Math.floor((expiresAt - Date.now()) / 86_400_000);
  if (daysLeft < 14) {
    log.warn(`Shared test account subscription expires in ${daysLeft} days`);
  } else {
    log.info("Shared test account subscription is active", { subscriptionDaysLeft: daysLeft });
  }

  await page.context().storageState({ path: AUTH_FILE });
});
