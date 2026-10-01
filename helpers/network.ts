import { expect, type Page } from "@playwright/test";

/**
 * Asserts that no request whose URL contains `urlPart` is sent within
 * `windowMs`. Showing that something did not happen needs an observation
 * window; this waits for the request itself and fails as soon as it is
 * sent, instead of sleeping and inspecting afterwards.
 *
 * Start it before the action under test and await it afterwards, so a
 * request fired by the action itself is not missed:
 *
 *   const noSession = expectNoRequest(page, "/api/payments/create-link", 2_000);
 *   await closeModal();
 *   await noSession;
 */
export async function expectNoRequest(page: Page, urlPart: string, windowMs: number): Promise<void> {
  const request = await page
    .waitForRequest((r) => r.url().includes(urlPart), { timeout: windowMs })
    .catch(() => null);
  expect(request?.url(), `Expected no request to ${urlPart}`).toBeUndefined();
}
