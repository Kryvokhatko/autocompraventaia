/*
 * The shared account belongs to the project owner and has an active paid subscription.
 * It is for read-only checks only. Tests that change account state (registration,
 * logout, removing favorites) must use a disposable account from helpers/test-data.ts
 * so the owner's account is never modified.
 */

/**
 * storageState saved by tests/setup/auth.setup.ts for the shared paid account.
 * Spec files opt in with test.use({ storageState: AUTH_FILE }).
 */
export const AUTH_FILE = "playwright/.auth/user.json";

export interface TestUser {
  email: string;
  password: string;
}

export function getTestUser(): TestUser {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    const missing = [
      ...(!email ? ["TEST_USER_EMAIL"] : []),
      ...(!password ? ["TEST_USER_PASSWORD"] : []),
    ].join(", ");

    throw new Error(
      `Missing required environment variable(s): ${missing}. ` +
        "Copy .env.example to .env locally or add the GitHub Actions secrets in CI."
    );
  }

  return { email, password };
}
