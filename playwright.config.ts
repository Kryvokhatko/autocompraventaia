import 'dotenv/config';

import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */

/**
 * The target site comes from the environment so the same suite can run
 * against a staging deployment.
 */
const BASE_URL = process.env.BASE_URL ?? 'https://autocompraventaia.es/';
try {
  new URL(BASE_URL);
} catch {
  throw new Error(`Invalid BASE_URL: ${BASE_URL}`);
}

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  /**
   * GitHub-hosted runners have 4 vCPUs.
   */
  workers: isCI ? 4 : undefined,
  /**
   * Playwright stops itself before the 30-minute CI job timeout kills the
   * job, so the HTML report and traces are still written and uploaded.
   */
  globalTimeout: isCI ? 20 * 60 * 1000 : undefined,
  /**
   * The github reporter adds failure annotations directly on the pull request.
   */
  reporter: isCI
    ? [
        ['github'],
        ['list'],
        ['html', { open: 'never' }],
        ['./helpers/traceability-reporter.ts'],
      ]
    : [
        ['list'],
        ['html'],
        ['./helpers/traceability-reporter.ts'],
      ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
