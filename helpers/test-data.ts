import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";

/**
 * Core test data factory — SUT-independent, reusable across projects.
 *
 * The site's "Register Now" flow accepts any email and grants a 14-minute
 * free-access trial per account (see TestArtifacts/qa_walkthrough_report_2026-07-12.md).
 * There is no long-lived test account: every worker/run that needs an
 * authenticated session registers its own fresh disposable account. Emails
 * are namespaced by worker + timestamp so parallel workers never collide.
 */

export const TRIAL_WINDOW_MS = 14 * 60 * 1000;

export interface DisposableAccount {
  email: string;
  password: string;
  registeredAt: number;
}

export function createDisposableEmail(workerIndex = 0): string {
  const stamp = Date.now();
  const random = faker.string.alphanumeric(6).toLowerCase();
  return `qa-taf-w${workerIndex}-${stamp}-${random}@mailinator.com`;
}

export function createDisposableAccount(workerIndex = 0): DisposableAccount {
  return {
    email: createDisposableEmail(workerIndex),
    password: `${faker.internet.password({ length: 12 })}1!`,
    registeredAt: Date.now(),
  };
}

/** Milliseconds remaining in the 14-minute trial window since registration. */
export function trialTimeRemainingMs(registeredAt: number): number {
  return TRIAL_WINDOW_MS - (Date.now() - registeredAt);
}

/**
 * auth.setup.ts already persists storageState (cookies + localStorage) for
 * every spec project to reuse — but storageState alone doesn't carry the
 * account's plaintext email, so a spec file has no way to check the site
 * echoes it back correctly anywhere (e.g. Stripe Checkout's pre-filled
 * email — see TC-PAY-010). Persisting the account's identity alongside
 * storageState, in the same gitignored playwright/.auth/ directory, closes
 * that gap without changing what any existing spec file reads. Password is
 * deliberately not included — nothing downstream needs it.
 */
export interface RegisteredAccount {
  email: string;
  registeredAt: number;
}

const REGISTERED_ACCOUNT_PATH = path.join("playwright", ".auth", "trial-account.json");

export function persistRegisteredAccount(account: DisposableAccount): void {
  fs.mkdirSync(path.dirname(REGISTERED_ACCOUNT_PATH), { recursive: true });
  fs.writeFileSync(
    REGISTERED_ACCOUNT_PATH,
    JSON.stringify({ email: account.email, registeredAt: account.registeredAt } satisfies RegisteredAccount)
  );
}

export function readRegisteredAccount(): RegisteredAccount {
  return JSON.parse(fs.readFileSync(REGISTERED_ACCOUNT_PATH, "utf-8"));
}
