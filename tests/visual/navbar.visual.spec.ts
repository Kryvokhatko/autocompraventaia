import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";

/**
 * Nav-bar visual regression check — one snapshot per locale.
 *
 * German compound words (e.g. "Jetzt registrieren") have already caused
 * layout overflow in the nav bar; a cheap per-locale snapshot of the nav
 * container catches this regression without the flakiness of full-page
 * screenshots against a live external site.
 *
 * The nav bar is full viewport width, so its rendered pixel width shifts by
 * the vertical scrollbar's width depending on whether the page happens to
 * need a scrollbar at the exact capture moment — this forces the scrollbar
 * gutter to always be reserved so the width is deterministic across runs.
 *
 * On first run, generate baselines with:
 *   npx playwright test tests/visual --update-snapshots
 *
 * Not derived from a manual test case in the TC-<AREA>-<NUM> inventory — this
 * is an engineering-added supplementary check, not a formalized business test
 * case, so it intentionally carries no TC-ID/test-case annotation. Tagged
 * @visual/@regression on that basis rather than a risk-derived priority tag.
 */

const LOCALES: Locale[] = ["en", "es", "de"];

test.describe("Navbar visual regression", () => {
  for (const locale of LOCALES) {
    test(`navbar renders correctly (${locale.toUpperCase()})`, { tag: ["@visual", "@regression"] }, async ({ homePage, page }) => {
      await homePage.goto(locale);
      await page.addStyleTag({ content: "html { scrollbar-gutter: stable; overflow-y: scroll; }" });

      // Text-heavy element: tolerate a small pixel-diff ratio for font
      // anti-aliasing jitter between runs, not just exact-pixel match —
      // still tight enough to catch a real layout/content regression.
      await expect(homePage.navbar.container).toHaveScreenshot(`navbar-${locale}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
