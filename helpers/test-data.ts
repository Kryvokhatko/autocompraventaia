import { faker } from "@faker-js/faker";

/**
 * Disposable-account factory, for tests that change account state.
 *
 * Read-only checks run as the shared paid account (helpers/test-user.ts).
 * Anything that registers, logs out, or edits favorites registers its own
 * throwaway account instead, so the shared account is never modified and
 * those tests always start from the same pre-seeded favorites list.
 *
 * The site's register form accepts any email and gives the new account a
 * ~60-second free trial — enough for one short test, not for a whole run.
 * Emails are namespaced by worker index + timestamp + a random suffix so
 * parallel workers never collide.
 */

export interface DisposableAccount {
  email: string;
  password: string;
}

export function createDisposableEmail(workerIndex = 0): string {
  const stamp = Date.now();
  const random = faker.string.alphanumeric(6).toLowerCase();
  return `qa-taf-w${workerIndex}-${stamp}-${random}@mailinator.com`;
}

/** Card expiry in MM/YY format, December of next year — always in the future. */
export function futureCardExpiry(): string {
  const year = (new Date().getFullYear() + 1) % 100;
  return `12/${String(year).padStart(2, "0")}`;
}

export function createDisposableAccount(workerIndex = 0): DisposableAccount {
  return {
    email: createDisposableEmail(workerIndex),
    password: `${faker.internet.password({ length: 12 })}1!`,
  };
}
