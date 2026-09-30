import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";

/**
 * Branding-element localization regression test.
 *
 * The footer copyright line and the six feature-section image alt texts on
 * the home page stay in Spanish regardless of locale (open defects D-04,
 * D-05). This test asserts the correct per-locale text for EN and DE and is
 * marked test.fail() until they are fixed.
 *
 * The logo is a decorative brand mark with an empty alt attribute (the
 * wordmark next to it is real text), so it has no alt text to localize.
 */

const FOOTER_COPYRIGHT: Record<"en" | "de", string> = {
  en: "© 2024 Auto compraventa IA. All rights reserved.",
  de: "© 2024 Auto compraventa IA. Alle Rechte vorbehalten.",
};

const FEATURE_ALTS: Record<"en" | "de", string[]> = {
  en: [
    "Offers Dashboard",
    "Profit Analytics",
    "Best Sellers",
    "Cheap Cars",
    "My Favorites",
    "Interactive Map",
  ],
  de: [
    "Angebotsübersicht",
    "Gewinnanalyse",
    "Bestseller",
    "Günstige Autos",
    "Meine Favoriten",
    "Interaktive Karte",
  ],
};

const LOCALES: Locale[] = ["en", "de"];

test.describe("Branding localization", () => {
  for (const locale of LOCALES) {
    test(`TC-BRAND-001 — branding elements localize under ${locale.toUpperCase()} locale`, { tag: ["@p2", "@regression"] }, async ({ homePage, page }) => {
      test.info().annotations.push({ type: "test-case", description: "TC-BRAND-001" });
      test.fail(true, "Open defects D-04/D-05: footer copyright and feature image alt text stay Spanish");

      await homePage.goto(locale);

      await expect(page.getByRole("contentinfo")).toContainText(FOOTER_COPYRIGHT[locale]);

      for (const alt of FEATURE_ALTS[locale]) {
        await expect(page.getByRole("img", { name: alt, exact: true })).toBeAttached();
      }
    });
  }
});
