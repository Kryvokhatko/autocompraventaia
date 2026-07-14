import { test, expect } from "../fixtures/pages.fixture";
import type { Locale } from "../pages/base.page";

/**
 * Home-page hero section visual regression check.
 *
 * Screenshots only the above-the-fold hero area (not the full page) per
 * locale. The page has no <main> element — the hero is a direct
 * `<div class="hero-section">` child of <body>, immediately after <nav>.
 *
 * The hero is full viewport width, so its rendered pixel width shifts by
 * the vertical scrollbar's width depending on whether the page happens to
 * need a scrollbar at the exact capture moment (it always does once fully
 * loaded, but timing can vary) — this forces the scrollbar gutter to always
 * be reserved so the width is deterministic across runs.
 *
 * On first run, generate baselines with:
 *   npx playwright test tests/visual --update-snapshots
 */

const LOCALES: Locale[] = ["en", "es", "de"];

test.describe("Home hero visual regression", () => {
  for (const locale of LOCALES) {
    test(`hero section renders correctly (${locale.toUpperCase()})`, async ({ homePage, page }) => {
      await homePage.goto(locale);
      await page.addStyleTag({ content: "html { scrollbar-gutter: stable; overflow-y: scroll; }" });

      const hero = page.locator(".hero-section");
      await hero.waitFor({ state: "visible" });

      // Text-heavy element: tolerate a small pixel-diff ratio for font
      // anti-aliasing jitter between runs, not just exact-pixel match —
      // still tight enough to catch a real layout/content regression.
      await expect(hero).toHaveScreenshot(`home-hero-${locale}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
