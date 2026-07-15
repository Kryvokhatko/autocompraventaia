import { faker } from "@faker-js/faker";

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
