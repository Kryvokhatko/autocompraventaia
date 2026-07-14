# Formalized Test Cases — autocompraventaia.es Localization (EN/ES/DE)

Source: exploratory QA walkthrough session, 2026-07-12 (see `qa_walkthrough_report_2026-07-12.md` for the full session report). Test basis is an exploratory session, not a written spec — conditions below trace to defect IDs from that session, not to requirement IDs.

## 1. Summary

Analyzed: 7 confirmed defects from a session-based exploratory walkthrough of https://autocompraventaia.es/ across EN/ES/DE locales (Landmark, Sabotage, Consistency, and Location tours). All 7 were independently reproduced by re-navigating the live site (not taken on the walkthrough tool's word alone).

**Assumptions made:**
- The nav bar / footer link translations (which do work correctly) represent the site's actual i18n intent — used as the oracle for "what correct output looks like" where no written spec exists.
- German date convention (DD.MM.YYYY) and Spanish decimal-comma convention are assumed as the correct target formats per general locale convention, since no formatting spec was provided.
- "Locale" is determined by the `?_locale=` query parameter, consistent with how the site itself implements the switcher.

**Ambiguities flagged (would block full sign-off without a stakeholder answer):**
- Whether "paid X min" trial-countdown wording (F-01, not formalized below — a finding, not a defect) is intentional.
- Whether the Stripe-hosted checkout is expected to render in the site's active locale or is accepted as English-only by design.

## 2. Risks and Traceability

| Risk ID | Risk | Likelihood | Impact | Covered by conditions |
|---|---|---|---|---|
| R-LOC-01 | Auth funnel (login/register) untranslated → non-English users abandon signup | High (already observed in both ES and DE) | High — blocks the primary conversion funnel | TCOND-01, TCOND-02 |
| R-LOC-02 | Primary landing page shows mixed-language content → damages credibility/trust for DE visitors | High (already observed) | High — first impression for all new DE traffic | TCOND-03 |
| R-API-01 | Client throws on unauthenticated API response → console noise, possible downstream JS state issues | High (every unauth. page load) | Medium — no visible breakage yet, but fragile | TCOND-04 |
| R-LOC-03 | Site-wide branding elements (logo alt, footer, image alt) stuck in Spanish | High (already observed) | Low — accessibility/SEO impact, not user-blocking | TCOND-05 |
| R-LOC-04 | Payment page date/number/unit formatting not locale-aware | High (already observed) | Low-Medium — visible on a trust-sensitive page (payments) | TCOND-06, TCOND-07, TCOND-08 |

## 3. Test Conditions

| Condition ID | Condition | Traces to |
|---|---|---|
| TCOND-01 | Login form content (heading, labels, button, OAuth link, "already have an account" link) must render in the active locale | D-02, R-LOC-01 |
| TCOND-02 | Register form content must render in the active locale | D-02, R-LOC-01 |
| TCOND-03 | Home page audience cards, calculator section, and success-stories section must render in the active locale | D-03, R-LOC-02 |
| TCOND-04 | `/api/favorites/count` must not cause a client-side exception for unauthenticated users | D-01, R-API-01 |
| TCOND-05 | Site-wide branding elements (logo alt text, footer copyright, feature image alt text) must render in the active locale | D-04, D-05, R-LOC-03 |
| TCOND-06 | Payments page subscription-expiry date must use the locale-correct date format | D-07, R-LOC-04 |
| TCOND-07 | Payments page prices must use the locale-correct decimal separator | D-08, R-LOC-04 |
| TCOND-08 | Payments page price-unit suffixes (day/month/year) must match the active locale | D-09, R-LOC-04 |

## 4. Test Cases

```
ID:            TC-AUTH-001
Title:         Login form renders in Spanish under ES locale
Traceability:  TCOND-01; Risk: R-LOC-01 (High)
Priority:      High
Technique:     Equivalence Partitioning (locale = {en, es, de} as equivalence classes; this case = "es" partition)
Preconditions: - Browser has no active session (logged out)
               - Site reachable at https://autocompraventaia.es/
Test data:     Locale: es (via ?_locale=es query param or locale switcher)

Steps:
  1. Navigate to https://autocompraventaia.es/login?_locale=es
  2. Observe the page heading, field labels, submit button text, OAuth link text, and "already have an account" link text

Expected result:
  - Heading reads "Iniciar sesión" (or equivalent ES heading)
  - Email field label reads "Correo electrónico"
  - Password field label reads "Contraseña"
  - Submit button reads "Iniciar sesión"
  - "Sign in with Google" link reads "Iniciar sesión con Google" (or equivalent)
  - "Already have an account? Sign in" link reads its ES equivalent
  - Nav bar (already correctly localized) matches ES throughout, for consistency check

Actual result observed in this session:
  - Heading: "Please sign in" (English) — FAIL
  - Labels: "Email address", "Password" (English) — FAIL
  - Button: "Sign in" (English) — FAIL
  - Nav bar: correctly Spanish — PASS (confirms the defect is isolated to the form component, not global i18n failure)

Status:        Fail (confirmed defect D-02)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-AUTH-002
Title:         Register form renders in German under DE locale
Traceability:  TCOND-02; Risk: R-LOC-01 (High)
Priority:      High
Technique:     Equivalence Partitioning (locale = {en, es, de}; this case = "de" partition)
Preconditions: - Browser has no active session (logged out)
Test data:     Locale: de (via ?_locale=de)

Steps:
  1. Navigate to https://autocompraventaia.es/register?_locale=de
  2. Observe the page heading, field labels, submit button text, OAuth link text, "already have an account" link text

Expected result:
  - Heading reads "Registrieren"
  - Email field label reads "E-Mail-Adresse"
  - Password field label reads "Passwort"
  - Submit button reads "Registrieren"
  - "Sign up with Google" link reads its DE equivalent
  - "Already have an account? Sign in" link reads its DE equivalent

Actual result observed in this session:
  - Heading: "Register" (English) — FAIL
  - Labels: "Email address", "Password" (English) — FAIL
  - Button: "Register" (English) — FAIL
  - Nav bar: correctly German ("Über uns", "Angebote", "Karte", etc.) — PASS

Status:        Fail (confirmed defect D-02)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-HOME-001
Title:         Home page audience/calculator/success-story sections render fully in German under DE locale
Traceability:  TCOND-03; Risk: R-LOC-02 (High)
Priority:      High
Technique:     Equivalence Partitioning (locale classes) + Checklist-Based Testing (enumerate every translatable section on the page)
Preconditions: - None (public page)
Test data:     Locale: de (via ?_locale=de)

Steps:
  1. Navigate to https://autocompraventaia.es/?_locale=de
  2. Read the three audience cards (dealer/private-buyer/investor)
  3. Read the calculator "what's included" breakdown section
  4. Read the "success stories" section (heading + per-story labels)

Expected result:
  - All text in steps 2-4 is in German — no Spanish strings visible

Actual result observed in this session:
  - Audience cards: "Compraventas y Concesionarios", "Compradores Particulares", "Inversores" and their descriptions — all Spanish — FAIL
  - Calculator: "Qué incluye el cálculo:", "Transporte 🇩🇪-🇪🇸", "Impuesto matriculación (IEDMT)", "Gestoría e ITV", "Precios reales de reventa en España", "Basado en datos reales de mercado" — all Spanish — FAIL
  - Success stories: "Casos de Éxito Reales" heading, "Comprado en DE:", "Vendido en ES:", "Beneficio Neto:" labels — all Spanish — FAIL
  - Surrounding sections (nav, hero, feature descriptions, footer links) — correctly German — PASS

Status:        Fail (confirmed defect D-03)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-API-001
Title:         Favorites-count API does not throw a client-side error for unauthenticated users
Traceability:  TCOND-04; Risk: R-API-01 (Medium)
Priority:      Medium
Technique:     Error Guessing (unauthenticated state is an untested precondition an attacker/normal-user would trivially hit) + Equivalence Partitioning (locale = {en, es, de} — verify the defect isn't locale-specific)
Preconditions: - Browser has no active session / no auth cookie (clean/incognito context)
Test data:     Locales: en, es, de (repeat for each)

Steps:
  1. Open a clean (logged-out) browser session
  2. Navigate to https://autocompraventaia.es/?_locale=<en|es|de>
  3. Open the browser console
  4. Inspect network requests to /api/favorites/count

Expected result:
  - No console errors on page load
  - /api/favorites/count returns a 200 with valid JSON (e.g. {"count":0}), or the client skips calling it when unauthenticated

Actual result observed in this session:
  - Console error: "Error fetching favorites count: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
  - Network: GET /api/favorites/count → 302 redirect to /login, which returns an HTML document; client attempts JSON.parse() on it
  - Reproduced on es locale; behavior is locale-independent (endpoint, not content, is at fault)

Status:        Fail (confirmed defect D-01)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-BRAND-001
Title:         Logo alt text, footer copyright, and feature image alt text localize under EN and DE
Traceability:  TCOND-05; Risk: R-LOC-03 (Low)
Priority:      Low
Technique:     Equivalence Partitioning (locale = {en, de}; es is the known-correct baseline, excluded as it's already correct) + Checklist-Based Testing
Preconditions: - None (public page)
Test data:     Locales: en, de

Steps:
  1. Navigate to https://autocompraventaia.es/?_locale=<en|de>
  2. Inspect the logo image's alt attribute
  3. Scroll to the footer and read the copyright line
  4. Inspect alt text of the six feature-section images (offers dashboard, analytics, best sellers, cheap cars, favorites, map)

Expected result:
  - Logo alt text matches locale (e.g. EN: "Your AI assistant for car search in Germany")
  - Footer copyright is localized (e.g. EN: "© 2024 Auto compraventa IA. All rights reserved.")
  - Feature image alt texts are localized (e.g. EN: "Offers Dashboard", "Profit Analytics", ...)

Actual result observed in this session:
  - Logo alt text: always the Spanish string, on both EN and DE — FAIL
  - Footer: always "© 2024 Auto compraventa IA. Todos los derechos reservados." on both EN and DE — FAIL
  - Feature image alt text: always Spanish ("Panel de Ofertas", "Analítica de Beneficios", etc.) on both EN and DE — FAIL

Status:        Fail (confirmed defects D-04, D-05)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-PAY-001
Title:         Payments page subscription-expiry date uses DD.MM.YYYY under DE locale
Traceability:  TCOND-06; Risk: R-LOC-04 (Low-Medium)
Priority:      Medium
Technique:     Boundary Value Analysis is not applicable (not a range); Equivalence Partitioning by locale, with the date-format string treated as the output partition to verify
Preconditions: - Test account is registered and has an active (trial) subscription
               - Account has remaining trial time (14-minute window from registration — sequence this test soon after registration)
Test data:     Locale: de; account: any freshly registered test account

Steps:
  1. Register a test account (any disposable email)
  2. Navigate to https://autocompraventaia.es/pagos?_locale=de
  3. Read the "active subscription" expiry date/time string

Expected result:
  - Date renders as DD.MM.YYYY (German convention), e.g. "12.07.2026 18:22"

Actual result observed in this session:
  - Date rendered as "12/07/2026 18:22" (same DD/MM/YYYY slash format as ES/EN) — FAIL

Status:        Fail (confirmed defect D-07)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-PAY-002
Title:         Payments page prices use comma decimal separator under ES locale
Traceability:  TCOND-07; Risk: R-LOC-04 (Low-Medium)
Priority:      Low
Technique:     Equivalence Partitioning by locale
Preconditions: - Test account is registered and reaches the payments page
Test data:     Locale: es

Steps:
  1. Register a test account (any disposable email)
  2. Navigate to https://autocompraventaia.es/pagos?_locale=es
  3. Read the three plan prices (daily/monthly/annual)

Expected result:
  - Prices render with comma decimal separator, e.g. "€2,99", "€11,99", "€99,99"

Actual result observed in this session:
  - Prices rendered as "€2.99", "€11.99", "€99.99" (period separator) — FAIL

Status:        Fail (confirmed defect D-08)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-PAY-003
Title:         Payments page price-unit suffixes match locale under EN and DE
Traceability:  TCOND-08; Risk: R-LOC-04 (Low-Medium)
Priority:      Low
Technique:     Equivalence Partitioning by locale + Checklist-Based Testing (per-plan suffix check)
Preconditions: - Test account is registered and reaches the payments page
Test data:     Locales: en, de

Steps:
  1. Register a test account (any disposable email)
  2. Navigate to https://autocompraventaia.es/pagos?_locale=<en|de>
  3. Read the unit suffix immediately following each plan's price (daily/monthly/annual)

Expected result:
  - EN: "/day", "/month", "/year"
  - DE: "/Tag", "/Monat", "/Jahr"
  - Plan name itself (already correctly localized, e.g. "Daily"/"Täglich") matches the suffix language

Actual result observed in this session:
  - EN page: plan names correct ("Daily", "Monthly", "Yearly") but suffixes remained Spanish: "/día", "/mes", "/año" — FAIL
  - DE page: plan names correct ("Täglich", "Monatlich", "Jährlich") but suffixes remained Spanish: "/día", "/mes", "/año" — FAIL
  - Mixed-language display on both locales, newly identified during independent verification (not caught by the initial pass)

Status:        Fail (confirmed defect D-09 — identified during independent verification)
Author:        QA walkthrough session   Reviewed by: —
```

## 5. Automation Candidates

| Test Case | Automate? | Rationale |
|---|---|---|
| TC-AUTH-001, TC-AUTH-002 | Yes | Stable DOM targets (form labels/headings), high-value (core funnel), cheap to assert via Playwright locator text match per locale — good regression-suite fit. |
| TC-HOME-001 | Yes, partially | The specific Spanish strings are stable regression markers ("assert these Spanish substrings are absent under ?_locale=de"); full translation-quality coverage is not automatable and stays manual/native-review. |
| TC-API-001 | Yes | Pure network/console assertion (no visual judgment needed) — ideal for a Playwright test that loads the page unauthenticated and asserts zero console errors + a 2xx/JSON response from the endpoint. |
| TC-BRAND-001 | Yes | Static attribute/text assertions (alt text, footer string) — low-maintenance, high repeatability. |
| TC-PAY-001, TC-PAY-002, TC-PAY-003 | Yes, with a fixture caveat | Requires a fresh registered account per run (14-minute trial window) — automate with a disposable-email fixture and keep the run fast enough to complete within the trial window; otherwise a good regex/format-assertion candidate (date pattern, decimal separator, unit-suffix string). |

## 6. Regression Impact

Regression impact analysis: all 7 defects sit in shared/global components (i18n string resolution, a shared auth-form component, a shared payments-formatting utility, a shared branding partial) rather than isolated one-off pages. Any fix to these should be added to the permanent regression suite — not treated as a one-off — because:
- The auth-form and branding-partial fixes touch code paths rendered on every page load across all locales.
- The payments-formatting fix touches a shared currency/date utility likely reused elsewhere (e.g. plan comparison, invoices) — worth checking for other call sites once fixed.
