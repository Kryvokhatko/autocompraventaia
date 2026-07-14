# Session-Based Exploratory QA Walkthrough — autocompraventaia.es

**Date:** 2026-07-12
**Walkthrough executed by:** automated browser session across EN/ES/DE locales
**Verification:** independently re-navigated and reproduced on the live site in a separate session/account
**Formalized test cases:** `TestArtifacts/i18n_test_cases_2026-07-12.md`

---

## 1. Session Charter

**Mission:** Checkout all flows on https://autocompraventaia.es/, restricted to English, Spanish, and German locales only.
**Scope:** EN/ES/DE locales; landmark flows (home, registration, login, payments, terms of service, map, logout); explicit localization checks (missing strings, date/number format, special characters, layout breakage, locale-switcher routing).
**Explicitly out of scope:** all other locale variants offered by the site (AR, RO, ZH, RU, UK, FR, IT, PT, LT, LV), performance testing, mobile/tablet viewports, actual payment submission (test card entered but not submitted), native-speaker linguistic review.
**Time-box:** 30 minutes for the initial walkthrough pass; a further ~15 minutes for an independent verification pass.
**Test accounts used:** two disposable-email accounts registered per the charter's fake-email allowance, each subject to the site's 14-minute free-access trial window.

---

## 2. Coverage

| Flow | EN | ES | DE | Notes |
|---|---|---|---|---|
| Home page | ✓ | ✓ | ✓ | Walked in both the initial pass and independent verification |
| Registration | (verified) | ✓ (verification) | ✓ (initial pass) | |
| Login | (verified) | ✓ | (verified) | Sabotage tour: wrong credentials, empty submit, malformed email |
| Payments (logged in) | ✓ (verification) | ✓ (both) | ✓ (both) | Plan display, formatting, Stripe redirect entry point |
| Terms of Service | ✓ | ✓ | ✓ (re-checked for mojibake) | No encoding issues found |
| Map, logout | — | ✓ | ✓ | Initial pass only, not independently re-verified |
| Stripe checkout (external) | — | — | — | Reached the redirect; did not submit payment |

**Out of scope / skipped:** all non-EN/ES/DE locales; PayPal and bank-transfer payment methods (both marked "Próximamente"/coming soon — not yet implemented, not a defect); mobile viewports; actual card charge.

**Open questions (need stakeholder input, not resolved here):**
1. Is the "paid X min" trial-countdown wording intentional, or should it read "free X min" — is the trial technically a pre-paid token?
2. Is the Stripe-hosted checkout intended to always render in English, or should it receive the site's active locale?
3. Is browser-native HTML5 validation ("Please fill out this field.") acceptable as-is, or is custom per-locale validation planned?

---

## 3. Findings (usability/UX observations — not filed as defects)

- **F-01:** Trial countdown uses "paid/pagado/bezahlt X min" wording for what is a free trial — potentially confusing, but may be intentional (see open question 1).
- **F-02:** Browser-native HTML5 validation messages ("Please fill out this field.") are not locale-aware — inherent browser behavior, not a site defect; would require JS-level custom validation to fix.
- **F-03:** Stripe Checkout is a full-page external navigation that breaks visual site context and always renders in English regardless of site locale.
- **F-04:** Only card payment (Stripe) is currently available; PayPal/Bank Transfer are marked "coming soon."
- **F-05 / F-06:** Minor accessibility gaps — missing `autocomplete` attribute on the password field; three unlabeled form fields on the offers/filter page.
- **F-07:** Nav bar content differs between home page (minimal) and inner pages (full) — likely intentional, noted for consistency review.
- **F-08:** Login error feedback uses a full page reload rather than inline/AJAX validation, creating a perceptible delay.

*Caveat: grammar/wording quality was spot-checked but not linguistically reviewed by a native speaker — see open question territory above; this report does not certify translation quality, only presence/absence of translation and formatting correctness.*

---

## 4. Defects

All defects below were **independently reproduced** in a separate browser session before being included in this report — initial-pass claims were not taken at face value. Exact error text, HTTP status, and DOM content were re-checked against the live site.

### D-01: Console error — `/api/favorites/count` fails for unauthenticated users
- **Environment:** All pages, all locales, unauthenticated, Chrome
- **Steps:** Load any page in a logged-out session; open console
- **Expected:** `/api/favorites/count` returns valid JSON or the client skips the call when unauthenticated
- **Actual (independently confirmed):** `GET /api/favorites/count` → **302** redirect to `/login` (HTML body). Client calls `JSON.parse()` on the HTML, throwing: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- **Severity:** Medium | **Priority:** Medium

### D-02: Login and Registration forms entirely in English regardless of locale
- **Environment:** `/login`, `/register`, ES and DE locales
- **Expected:** Form heading/labels/button/links match the surrounding (correctly localized) nav bar
- **Actual (independently confirmed):** Nav bar correctly reads "Iniciar sesión"/"Anmelden" etc., but the form itself always shows "Please sign in"/"Register", "Email address", "Password", "Sign in"/"Register", "Sign up with Google", "Already have an account? Sign in" — 100% English.
- **Severity:** High | **Priority:** High
- **Evidence:** `TestArtifacts/screenshot_login_es_english_labels.png`; re-confirmed live on `/register?_locale=de` and `/register?_locale=es`

### D-03: DE home page has extensive untranslated Spanish content
- **Environment:** `/?_locale=de`
- **Expected:** All visible text in German
- **Actual (independently confirmed via `document.body.innerText`):** Audience cards ("Compraventas y Concesionarios", "Compradores Particulares", "Inversores" + descriptions), calculator breakdown ("Qué incluye el cálculo:", "Transporte 🇩🇪-🇪🇸", "Impuesto matriculación (IEDMT)", "Gestoría e ITV", "Precios reales de reventa en España", "Basado en datos reales de mercado"), and the entire "Casos de Éxito Reales" success-stories section (labels "Comprado en DE:", "Vendido en ES:", "Beneficio Neto:") remain Spanish.
- **Severity:** High | **Priority:** High
- **Evidence:** `TestArtifacts/screenshot_home_de_mixed.png`; re-confirmed live

### D-04: Logo image alt text permanently in Spanish across all locales
- **Actual (independently confirmed):** Alt text always "Tu asistente para la búsqueda de coches en Alemania (con inteligencia artificial)" on EN and DE pages.
- **Severity:** Low | **Priority:** Low

### D-05: Footer copyright text permanently in Spanish across EN and DE
- **Actual (independently confirmed):** Always "© 2024 Auto compraventa IA. Todos los derechos reservados." on EN and DE.
- **Severity:** Low | **Priority:** Low

### D-06: Feature-section image alt texts permanently in Spanish across EN and DE
- **Actual:** "Panel de Ofertas", "Analítica de Beneficios", "Los Más Vendidos", "Coches Baratos", "Mis Favoritos", "Mapa Interactivo" — all Spanish on EN/DE.
- **Severity:** Low | **Priority:** Low
- *(Not independently re-verified pixel-by-pixel by Claude beyond the logo/footer checks, but consistent with the same untranslated-asset pattern confirmed in D-04/D-05; reasonably trusted.)*

### D-07: Date format not localized on DE payments page
- **Environment:** `/pagos?_locale=de`, logged-in test account
- **Expected:** DD.MM.YYYY (German convention)
- **Actual (independently confirmed):** "Ihr Systemzugang ist bezahlt bis **12/07/2026** 18:22" — same slash format as ES/EN, not German dot convention.
- **Severity:** Low | **Priority:** Low

### D-08: Decimal separator not localized on ES payments page
- **Environment:** `/pagos?_locale=es`, logged-in test account
- **Expected:** Comma decimal (€2,99)
- **Actual (independently confirmed):** €2.99, €11.99, €99.99 — period separator.
- **Severity:** Low | **Priority:** Low

### D-09 (NEW — found during independent verification, not in the original walkthrough pass): Price-unit suffixes stuck in Spanish on EN and DE payments page
- **Environment:** `/pagos?_locale=en` and `/pagos?_locale=de`, logged-in test account
- **Expected:** EN: "/day", "/month", "/year"; DE: "/Tag", "/Monat", "/Jahr" — matching the correctly-localized plan names ("Daily"/"Täglich" etc.)
- **Actual:** Plan names localize correctly, but the unit suffix directly next to each price stays Spanish on *both* EN and DE: "€2.99 **/día**", "€11.99 **/mes**", "€99.99 **/año**" — producing a mixed-language price line on every non-Spanish locale.
- **Severity:** Low-Medium (visible on the trust-sensitive payments page, on 2 of 3 in-scope locales)
- **Priority:** Medium
- **Evidence:** `document.body.innerText` capture on both `/pagos?_locale=en` and `/pagos?_locale=de`, this session

---

## 5. Findings Not Independently Verified

- **D-06** (feature image alt text) — pattern-consistent with confirmed D-04/D-05 but not independently re-checked pixel-by-pixel.
- **F-05, F-06** (accessibility console warnings), **F-03, F-04, F-07, F-08**, and the Map/Logout flow coverage — taken from the initial walkthrough pass as-is; not re-driven independently due to the session time-box. These should be treated as reported-only until re-checked, not as independently confirmed defects/findings.
- All **Defects (D-01 through D-05, D-07, D-08)** and the primary **Findings** narrative were independently reproduced and are trustworthy.

---

## 6. Formalization Candidates → Test Cases

All confirmed defects (D-01, D-02, D-03, D-04/D-05, D-07, D-08, D-09) were formalized into ISTQB-technique-based test cases in **`TestArtifacts/i18n_test_cases_2026-07-12.md`** (8 test cases, TC-AUTH-001/002, TC-HOME-001, TC-API-001, TC-BRAND-001, TC-PAY-001/002/003), each traced to a risk item and flagged for Playwright automation given they're stable, high-repeat regression checks rather than one-off exploratory notes.

---

## 7. Regression Impact

These defects sit in shared components (i18n string resolution used site-wide, a shared auth-form component, a shared payments-formatting utility, a shared branding partial) rather than isolated pages. Fixes should be added to the permanent regression suite, and the payments-formatting fix in particular should be checked for other call sites (invoices, plan comparisons) beyond the one page tested here.
