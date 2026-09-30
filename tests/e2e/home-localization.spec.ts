import { test, expect } from "../../fixtures/pages.fixture";

/**
 * Home-page localization regression test.
 *
 * Under ?_locale=de, the audience cards, profit calculator and deal-example
 * sections must render in German, with none of their Spanish copy leaking
 * through. Guards defect D-03 (those sections stuck in Spanish), which is
 * fixed on the live site.
 */

// Spanish headings of the same sections, as served under ?_locale=es.
const SPANISH_SECTION_COPY = [
  "Concesionarios y compraventas",
  "Comerciantes independientes",
  "Importadores y asesores de compra",
  "Estima el beneficio potencial",
  "Ejemplos de cálculo de operaciones",
  "Características Principales",
];

const GERMAN_SECTION_COPY = [
  "Autohäuser und Gebrauchtwagenhändler",
  "Selbstständige Fahrzeughändler",
  "Importeure und Fahrzeugvermittler",
  "Möglichen Gewinn kalkulieren",
  "Beispielkalkulationen",
  "Hauptfunktionen",
];

test.describe("Home page localization", () => {
  test("TC-HOME-001 — DE home page renders audience, calculator, and deal-example sections in German", { tag: ["@critical", "@p0", "@regression"] }, async ({ homePage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-HOME-001" });

    await homePage.goto("de");

    const body = await homePage.bodyText();

    for (const spanish of SPANISH_SECTION_COPY) {
      expect(body, `Spanish copy leaked into DE page: "${spanish}"`).not.toContain(spanish);
    }
    for (const german of GERMAN_SECTION_COPY) {
      expect(body, `German copy missing: "${german}"`).toContain(german);
    }
  });
});
