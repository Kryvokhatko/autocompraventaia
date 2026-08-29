import { test as setup } from "@playwright/test";
import { RegisterPage } from "../../pages/register.page";
import { createDisposableAccount, trialTimeRemainingMs, persistRegisteredAccount } from "../../helpers/test-data";
import { createLogger } from "../../helpers/logger";

/**
 * Registers ONE fresh disposable account and persists storageState for reuse
 * across every browser/device project in this run (storageState is just
 * cookies + localStorage — it is not tied to a browser engine, so chromium/
 * firefox/webkit/mobile projects can all load the same file).
 *
 * Why one shared account instead of one per project: the site grants only a
 * 14-minute free-access trial per registered account. Registering once and
 * reusing the session keeps the whole authenticated suite inside that
 * window and avoids hammering the site with unnecessary registrations.
 */

const log = createLogger("AuthSetup");
const authFile = "playwright/.auth/trial-session.json";

setup("register disposable trial account", async ({ page }) => {
  const account = createDisposableAccount();
  log.info("Registering disposable trial account", { email: account.email });

  const registerPage = new RegisterPage(page);
  await registerPage.goto("en");
  await registerPage.register(account.email, account.password);

  const remainingMs = trialTimeRemainingMs(account.registeredAt);
  log.info("Registration complete; trial window active", {
    trialMinutesRemaining: Math.round(remainingMs / 60000),
  });
  if (remainingMs < 10 * 60 * 1000) {
    log.warn("Less than 10 minutes of trial remaining right after registration — investigate slow registration flow");
  }

  await page.context().storageState({ path: authFile });
  persistRegisteredAccount(account);
});
