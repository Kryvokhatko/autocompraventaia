import { test, expect } from "../fixtures/pages.fixture";

/**
 * Home-page localization regression test.
 *
 * Under ?_locale=de, several sections on the home page are stuck in Spanish:
 * audience cards, calculator breakdown, and the success-stories section.
 * This test asserts those Spanish substrings are absent and that the German
 * equivalents are present instead.
 */

test.describe("Home page localization", () => {
  test("TC-HOME-001 — DE home page renders audience, calculator, and success-story sections in German", async ({ homePage }) => {
    test.info().annotations.push({ type: "test-case", description: "TC-HOME-001" });

    await homePage.goto("de");

    const body = await homePage.bodyText();

    // Audience cards: Spanish strings must not appear.
    expect(body).not.toContain("Compraventas y Concesionarios");
    expect(body).not.toContain("Compradores Particulares");
    expect(body).not.toContain("Inversores");

    // Calculator breakdown: Spanish strings must not appear.
    expect(body).not.toContain("Qué incluye el cálculo:");
    expect(body).not.toContain("Transporte");
    expect(body).not.toContain("Impuesto matriculación (IEDMT)");
    expect(body).not.toContain("Gestoría e ITV");
    expect(body).not.toContain("Precios reales de reventa en España");
    expect(body).not.toContain("Basado en datos reales de mercado");

    // Success stories: Spanish labels must not appear.
    expect(body).not.toContain("Casos de Éxito Reales");
    expect(body).not.toContain("Comprado en DE:");
    expect(body).not.toContain("Vendido en ES:");
    expect(body).not.toContain("Beneficio Neto:");

    // German equivalents should be present.
    expect(body).toContain("Händler");
    expect(body).toContain("Investoren");
    expect(body).toContain("Erfolgsgeschichten");
  });
});
