import { test, expect } from "../../fixtures/pages.fixture";
import type { Locale } from "../../pages/base.page";

/**
 * Branding-element localization regression test.
 *
 * The logo alt text, footer copyright line, and the six feature-section
 * image alt texts are permanently in Spanish regardless of locale.
 * This test asserts the correct per-locale text for EN and DE.
 */

const LOGO_ALT: Record<"en" | "de", string> = {
  en: "Your AI assistant for car search in Germany",
  de: "Ihr KI-Assistent für die Autosuche in Deutschland",
};

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

      await homePage.goto(locale);

      // Logo alt text.
      const logoImg = page.locator('img[alt]').first();
      await expect(logoImg).toHaveAttribute("alt", LOGO_ALT[locale]);

      // Footer copyright.
      const footer = page.locator("footer");
      await expect(footer).toContainText(FOOTER_COPYRIGHT[locale]);

      // Feature-section image alt texts.
      for (const alt of FEATURE_ALTS[locale]) {
        const featureImg = page.locator(`img[alt="${alt}"]`);
        await expect(featureImg).toBeAttached();
      }
    });
  }
});
