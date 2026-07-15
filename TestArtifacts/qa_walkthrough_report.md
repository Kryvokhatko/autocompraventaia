# QA Walkthrough Report — autocompraventaia.es

**Last updated:** 2026-07-15
**Locales covered:** English, Spanish, German
**Formalized test cases:** `TestArtifacts/i18n_test_cases_2026-07-12.md`, `TestArtifacts/test_cases_2026-07-15.md`

---

## 1. Scope

**Mission:** QA all workflows on https://autocompraventaia.es/, restricted to English, Spanish, and German locales.
**Covered:** Home page, locale switching, registration (email/password and Google), login (email/password and Google, including error handling), logout, Offers Dashboard, Below-Market page, Interactive Map, Top Sales, Analytics, Notifications, Favorites, Payments, Terms of Service, footer links, and unauthenticated route protection.
**Out of scope:** All locale variants other than EN/ES/DE; real payment submission; completing a full Google OAuth consent flow; mobile/tablet viewports; native-speaker linguistic review of translation quality (this report covers presence/absence and formatting correctness of translations, not their grammatical quality).

---

## 2. Coverage

**Notation:** ✓ confirmed working · ✗ defect (ID) · — not tested, with reason.

| Flow | EN | ES | DE |
|---|---|---|---|
| 1. Home / Landing Page | ✓ | ✓ | ✗ D-03 |
| 2. Locale switching | ✓ | ✓ | ✓ |
| 3. Registration | ✓ | ✗ D-02 | ✗ D-02 |
| 4. Registration via Google | ✓ | ✓ | ✓ |
| 5. Login | ✓ | ✗ D-02 | ✗ D-02 |
| 6. Login via Google | ✓ | ✓ | ✓ |
| 7. Login error handling | ✓ | — not tested (shared form/backend with EN) | — not tested (shared form/backend with EN) |
| 8. Logout | ✓ | — not tested | — not tested |
| 9. Offers Dashboard | ✓ | — requires login, not tested | — requires login, not tested |
| 10. Below-Market | ✗ D-10 | — requires login, not tested | ✗ D-10 |
| 11. Interactive Map | ✓ | — not tested | — not tested |
| 12. Top Sales | ✓ | — not tested | — not tested |
| 13. Analytics | ✓ / ✗ D-11 | — not tested | — not tested |
| 14. Notifications | ✓ | — not tested | — not tested |
| 15. Favorites | ✓ / ✗ D-13 | — not tested | — not tested |
| 16. Payments | ✓ | ✓ | ✓ |
| 17. Terms of Service | ✗ D-12 | ✗ D-12 | ✗ D-12 |
| 18. Footer links | ✓ | ✓ | ✓ |
| 19. Unauthenticated route protection | ✓ | ✓ | ✓ |
| 20. Favorites-count API (logged out) | ✗ D-01 | ✗ D-01 | ✗ D-01 |

**Home / Landing Page.** Fully working in English and Spanish, including the audience cards, profit calculator, and success stories. In German, the navigation, hero section, and call-to-action are translated, but the audience cards, calculator details, and success-story labels remain in Spanish (D-03).

**Locale switching.** The language switcher and direct `?_locale=` links both load the correct locale consistently across pages.

**Registration.** Account creation succeeds in all three languages. In Spanish and German, the registration form itself (heading, field labels, button, sign-up options) displays in English even though the rest of the page is translated (D-02).

**Registration via Google.** The "Sign up with Google" link is present on all three locales and correctly routes to the Google connector.

**Login.** Same pattern as Registration — login itself works in all three languages; the form content is English-only on Spanish and German (D-02).

**Login via Google.** Present and correctly routed on all three locales.

**Login error handling.** Wrong credentials show an inline "Invalid credentials." message; an empty submission is blocked by the browser's native "Please fill out this field." validation. Not separately tested on Spanish/German, since it's the same shared form and backend as English.

**Logout.** Clears the session and redirects to the home page; a subsequent attempt to reach an authenticated page correctly redirects to login.

**Offers Dashboard.** Loads with filter controls and a populated listing of 123 cars.

**Below-Market.** Page title, heading, and all labels are in Spanish on both English and German locales (D-10).

**Interactive Map.** Renders with a large number of geolocated offer markers.

**Top Sales.** Renders a ranked best-sellers list with a heading and methodology note, correctly in English.

**Analytics.** Page structure (heading, calendar, seven analysis tabs) renders correctly. Separately, the page triggers repeated console resource-load errors (D-11).

**Notifications.** Channel settings (Telegram, Email) and an empty notification history table render correctly.

**Favorites.** Eleven cars are pre-seeded for every new account — this is intentional shared demo data, not a bug. Removing a favorite works and is correctly saved, but the nav badge count doesn't update until the page is reloaded (D-13).

**Payments.** Plan headings, pricing, and the active-subscription banner are all correctly localized on all three locales ("Choose Your Plan" / "Elige tu Plan" / "Wählen Sie Ihren Plan"). Three separate formatting defects remain on the page — see D-07, D-09, D-14.

**Terms of Service.** Redirects an unauthenticated visitor to the login page on all three locales, whether reached by direct URL or by the link in the public footer (D-12). Renders correctly once the visitor is logged in.

**Footer links.** Social and email links are valid on all three locales. The copyright line itself stays in Spanish on English and German (D-05).

**Unauthenticated route protection.** Every protected route (Offers, Map, Top Sales, Below-Market, Favorites, Payments) correctly redirects an unauthenticated visitor to the login page, on all three locales.

**Favorites-count API (logged out).** Loading any public page while logged out triggers a client-side error — see D-01.

---

## 3. Findings

Usability/UX observations that aren't necessarily wrong, just worth the site owner's attention — kept separate from Defects below.

- **Trial-countdown wording.** The nav shows "paid X min" / "pagado X min" / "bezahlt X min" for what is a free trial — potentially confusing phrasing for a no-cost trial period. *(Last confirmed: 2026-07-15)*
- **Form validation is browser-native only.** Field-required and email-format validation use the browser's built-in messages ("Please fill out this field."), which aren't locale-aware. *(Last confirmed: 2026-07-15)*
- **Checkout is a full-page external navigation.** Proceeding to the Stripe-hosted payment step leaves the site's visual context entirely and renders in English regardless of the site's active locale. *(Last confirmed: 2026-07-12)*
- **Only one payment method is currently live.** Card payment via Stripe is available; PayPal and Bank Transfer are both marked "Coming soon." *(Last confirmed: 2026-07-15)*
- **Minor accessibility gaps.** The password field is missing an `autocomplete` attribute; three fields on the offers filter panel have no associated label. *(Last confirmed: 2026-07-12)*
- **Nav bar content differs between the home page and inner pages.** The home page shows a reduced nav; inner pages show the full set of links. Likely intentional, worth a design-consistency review. *(Last confirmed: 2026-07-12)*
- **Login errors reload the page rather than validating inline via AJAX.** Creates a small perceptible delay compared to an inline error. *(Last confirmed: 2026-07-12)*
- **Login error text isn't exposed to assistive technology.** The "Invalid credentials." message isn't marked with an ARIA `alert` role, so it may not be reliably announced by screen readers. *(Last confirmed: 2026-07-15)*
- **Locale is dropped on login redirects.** When an unauthenticated visitor is redirected to the login page from a locale-scoped page, the locale parameter is lost — the destination is always the default. This is currently invisible only because the login form is itself English-only (D-02); it will become independently visible once that's fixed. *(Last confirmed: 2026-07-15)*

*Caveat: translation grammar/wording was spot-checked but not linguistically reviewed by a native speaker — this report covers presence/absence and formatting correctness of translations, not their linguistic quality.*

---

## 4. Defects

| ID | Title | Severity | Priority | Last confirmed |
|---|---|---|---|---|
| D-01 | Favorites-count API throws a client-side error for unauthenticated users | Medium | Medium | 2026-07-15 |
| D-02 | Login and Registration forms are entirely in English regardless of locale | High | High | 2026-07-15 |
| D-03 | German home page has extensive untranslated Spanish content | High | High | 2026-07-15 |
| D-04 | Logo image alt text is permanently in Spanish | Low | Low | 2026-07-15 |
| D-05 | Footer copyright text is permanently in Spanish | Low | Low | 2026-07-15 |
| D-06 | Feature-section image alt texts are permanently in Spanish | Low | Low | 2026-07-15 |
| D-07 | Payments page date format isn't localized on German | Low | Low | 2026-07-15 |
| D-08 | Payments page decimal separator isn't localized on Spanish | Low | Low | 2026-07-15 |
| D-09 | Payments page price-unit suffixes stay in Spanish on English and German | Low-Medium | Medium | 2026-07-15 |
| D-10 | Below-Market page isn't localized on English or German | Medium | Medium | 2026-07-15 |
| D-11 | Analytics page triggers repeated console resource-load errors | Low | Low | 2026-07-15 |
| D-12 | Terms of Service requires authentication | High | High | 2026-07-15 |
| D-13 | Favorites badge count doesn't update live after removing a favorite | Low | Low | 2026-07-15 |
| D-14 | Payment-method selection shows a Spanish plan label on the English payments page | Low | Low | 2026-07-15 |

**D-01 — Favorites-Count API Throws a Client-Side Error for Unauthenticated Users**
Environment: all public pages, all locales, unauthenticated.
Steps: load any page in a logged-out session, open the browser console.
Expected: the favorites-count endpoint returns valid data, or the client skips the call while unauthenticated.
Actual: the endpoint returns an HTML login-redirect page instead of JSON; the client attempts to parse it as JSON and throws `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.

**D-02 — Login and Registration Forms Are Entirely in English Regardless of Locale**
Environment: `/login`, `/register`, Spanish and German locales.
Steps: navigate to either form under `?_locale=es` or `?_locale=de`; observe the heading, labels, button, and links.
Expected: form content matches the locale, consistent with the correctly-localized nav bar.
Actual: the nav bar reads correctly ("Iniciar sesión" / "Anmelden"), but the form itself always shows "Please sign in" / "Register", "Email address", "Password", "Sign up with Google", "Already have an account? Sign in" — entirely in English.

**D-03 — German Home Page Has Extensive Untranslated Spanish Content**
Environment: `/?_locale=de`.
Steps: load the German home page; read the audience cards, calculator breakdown, and success-stories section.
Expected: all visible text in German.
Actual: the audience cards ("Compraventas y Concesionarios", "Compradores Particulares", "Inversores"), the calculator breakdown ("Qué incluye el cálculo:", "Transporte 🇩🇪-🇪🇸", "Impuesto matriculación (IEDMT)", "Gestoría e ITV", "Precios reales de reventa en España"), and the "Casos de Éxito Reales" success-stories section (labels "Comprado en DE:", "Vendido en ES:", "Beneficio Neto:") all remain in Spanish.

**D-04 — Logo Image Alt Text Is Permanently in Spanish**
Environment: all pages, all locales.
Actual: the logo's alt text always reads "Tu asistente para la búsqueda de coches en Alemania (con inteligencia artificial)" regardless of the active locale.

**D-05 — Footer Copyright Text Is Permanently in Spanish**
Environment: all pages, English and German locales.
Actual: the footer always reads "© 2024 Auto compraventa IA. Todos los derechos reservados." on both English and German.

**D-06 — Feature-Section Image Alt Texts Are Permanently in Spanish**
Environment: home page, English and German locales.
Actual: the six feature-section images' alt text ("Panel de Ofertas", "Analítica de Beneficios", "Los Más Vendidos", "Coches Baratos", "Mis Favoritos", "Mapa Interactivo") stays in Spanish on both English and German.

**D-07 — Payments Page Date Format Isn't Localized on German**
Environment: `/pagos?_locale=de`, authenticated.
Expected: the active-subscription expiry date renders as DD.MM.YYYY (German convention).
Actual: renders as DD/MM/YYYY (e.g. "15/07/2026") — the same slash format used on Spanish and English.

**D-08 — Payments Page Decimal Separator Isn't Localized on Spanish**
Environment: `/pagos?_locale=es`, authenticated.
Expected: prices render with a comma decimal separator (e.g. "€2,99").
Actual: prices render with a period ("€2.99", "€11.99", "€99.99").

**D-09 — Payments Page Price-Unit Suffixes Stay in Spanish on English and German**
Environment: `/pagos?_locale=en` and `/pagos?_locale=de`, authenticated.
Expected: EN suffixes read "/day", "/month", "/year"; DE suffixes read "/Tag", "/Monat", "/Jahr" — matching the correctly-localized plan names.
Actual: plan names localize correctly ("Daily"/"Täglich" etc.), but the unit suffix next to each price stays Spanish on both locales: "/día", "/mes", "/año".

**D-10 — Below-Market Page Isn't Localized on English or German**
Environment: `/below-market`, authenticated, English and German locales.
Steps: log in, navigate to the Below-Market page with English or German selected.
Expected: page title, heading, and all labels render in the active locale.
Actual: the page title, heading, and all labels ("España 🇪🇸", "Ahorro vs 2ª:", "Dif. media:", "Ver Ofertas") are in Spanish on both English and German.

**D-11 — Analytics Page Triggers Repeated Console Resource-Load Errors**
Environment: `/stats/profit`, authenticated.
Steps: log in, open Analytics, open the browser console.
Expected: no repeated resource-load failures.
Actual: 12-13 "Failed to load resource" errors (HTTP 410 and/or 404) log within seconds of page load, consistent with references to offers whose availability changes over time.

**D-12 — Terms of Service Requires Authentication**
Environment: `/terms-of-service`, all locales.
Steps: in a logged-out session, navigate directly to the Terms of Service page, or click its link in the public home page footer.
Expected: the page renders publicly — this is a legal/compliance page, not a product feature.
Actual: both paths redirect to the login page, on all three locales. Renders correctly once authenticated.

**D-13 — Favorites Badge Count Doesn't Update Live After Removing a Favorite**
Environment: `/favorites`, authenticated.
Steps: log in with an account that has pre-seeded favorites, remove one car, confirm the dialog, observe the nav favorites-count badge without reloading.
Expected: the badge reflects the new count immediately.
Actual: the badge stays at the pre-removal count for several seconds after a confirmed removal; a full page reload shows the correct count. The removal itself is saved correctly — only the live badge display is stale.

**D-14 — Payment-Method Selection Shows a Spanish Plan Label on the English Payments Page**
Environment: `/pagos?_locale=en`, authenticated.
Steps: log in, open Payments with English selected, click "Select Plan" on any plan card.
Expected: the payment-method selection step shows the plan name in English (e.g. "Daily - €2.99/day"), matching the plan card it was selected from.
Actual: the payment-method step reads "Selected Plan: Diario - €2.99/día" — the Spanish plan name and price suffix, even though the plan card itself correctly read "Daily."

---

## 5. Test-Artifact Traceability Index

Full test case text, technique, preconditions, steps, and expected/actual results live in `i18n_test_cases_2026-07-12.md` and `test_cases_2026-07-15.md`. This index maps each feature area to its condition and case IDs only.

| Feature | Test Conditions | Test Cases |
|---|---|---|
| Home / Landing Page localization | TCOND-03 | TC-HOME-001 |
| Registration & Login | TCOND-01, TCOND-02, TCOND-09, TCOND-10, TCOND-12 | TC-AUTH-001, TC-AUTH-002, TC-AUTH-003, TC-AUTH-004, TC-AUTH-005, TC-AUTH-007 |
| Logout | TCOND-11 | TC-AUTH-006 |
| Favorites-count API error handling | TCOND-04 | TC-API-001 |
| Branding (logo/footer/feature-image alt text) | TCOND-05 | TC-BRAND-001 |
| Payments — date/decimal/unit-suffix formatting | TCOND-06, TCOND-07, TCOND-08, TCOND-16 | TC-PAY-001, TC-PAY-002, TC-PAY-003, TC-PAY-004 |
| Analytics page | TCOND-13, TCOND-15 | TC-STATS-001, TC-STATS-002 |
| Below-Market page localization | TCOND-14 | TC-MARKET-001 |
| Offers Dashboard | TCOND-15 | TC-OFFERS-001 |
| Interactive Map | TCOND-15 | TC-MAP-001 |
| Top Sales | TCOND-15 | TC-TOPSALES-001 |
| Notifications | TCOND-15 | TC-NOTIF-001 |
| Favorites (content & badge) | TCOND-15, TCOND-19 | TC-FAV-001, TC-FAV-002 |
| Terms of Service accessibility | TCOND-17 | TC-TOS-001 |
| Unauthenticated route protection | TCOND-18 | TC-SEC-001 |
| Payment-method plan-label localization (D-14) | — | Not yet formalized |

---

## 6. Regression Impact

Most defects sit in shared, site-wide components — translation resolution, the shared auth-form component, the shared payments-formatting utility, the shared branding partial — rather than isolated pages, so fixes should be added to the permanent regression suite rather than treated as one-offs. The auth-form and branding-partial fixes touch code paths rendered on every page load across all locales; the payments-formatting fix touches a shared currency/date utility that's worth checking for other call sites (invoices, plan comparisons) beyond the pages tested here.

Four areas are newly covered by this report and should be added to the regression suite once addressed: the Below-Market localization gap (D-10), the Analytics page's resource-loading behavior (D-11), the Favorites-badge live-update gap (D-13), and — highest priority, given it's a compliance-relevant public page — Terms of Service route protection (D-12). D-14 (payment-method plan-label localization) is newly discovered and does not yet have a formalized test case.
