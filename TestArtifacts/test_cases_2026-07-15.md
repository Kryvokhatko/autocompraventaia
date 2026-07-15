# Formalized Test Cases — autocompraventaia.es Full-Site Walkthrough (EN/ES/DE)

Source: session-based exploratory walkthrough, 2026-07-15 (see `qa_walkthrough_report_2026-07-15.md` for the full session report, coverage table, and defect list). Test basis is exploratory coverage of the live site, not a written spec — conditions below trace to session findings and defect IDs, not to requirement IDs. This document extends the 2026-07-12 walkthrough's test-case set (`i18n_test_cases_2026-07-12.md`) — TC-AUTH-001/002, TC-HOME-001, TC-API-001, TC-BRAND-001, and TC-PAY-001/002/003 are carried forward unchanged (still valid, independently re-confirmed as still failing this session) and are not re-listed in full here; refer to the 2026-07-12 document for their complete text.

## 1. Summary

Scope this session: full-site coverage (all major workflows), English/Spanish/German locales only. The real constraint is the site's 14-minute free-trial window per account, not a fixed wall-clock session — coverage was completed by chaining multiple fresh registrations, each granting a new 14-minute window, rather than treating any single window as a hard stop. 19 flows were walked; 13 defects are tracked against this site as of this session — 9 carried forward from 2026-07-12 (7 independently re-confirmed present this session, 2 not re-checked this session) and 4 newly discovered.

**Assumptions made:**
- Pages/flows that consistently redirect an unauthenticated visitor to `/login` (Offers, Map, Top Sales, Below-Market, Payments) are assumed to be intentionally gated paid/account features, not defects — this matches the product's subscription-based access model confirmed via the Payments page.
- The 11 favorites pre-loaded on every freshly registered trial account were confirmed, via multiple independently registered accounts, to be identical sample/demo data rather than user-specific or shared-account data — this resolves what would otherwise be an open question.

**Ambiguities flagged (would block full sign-off without a stakeholder answer):**
- Whether the below-market page is intentionally Spanish-only (a "Spain-side" view) or should receive full EN/DE localization like the rest of the authenticated dashboard — now confirmed present on both EN and DE.
- Whether the repeated 410/404 resource errors on the Analytics page reflect expected data lifecycle (offers that have since been removed) or a real backend asset-cleanup gap.
- Whether Terms of Service is deliberately restricted to logged-in users or whether this is an unintended side effect of a route-protection rule that was meant to apply only to product features.

## 2. Risks and Traceability

| Risk ID | Risk | Likelihood | Impact | Covered by conditions |
|---|---|---|---|---|
| R-FUNC-01 | Core paid-product workflows (dashboard, map, analytics, favorites, notifications, payments) stop working, undermining the product's primary value proposition | Low (all confirmed working this session) | High — these are the reasons a customer pays | TCOND-09 .. TCOND-16 |
| R-ACC-01 | A public legal page (Terms of Service) is unreachable by non-customers, which is both a UX dead-end from the footer and a possible compliance exposure | High (confirmed) | Medium-High — legal/compliance page, first-touch for prospective users | TCOND-17 |
| R-LOC-05 | Below-market page shows no locale support at all (not even partial) for EN visitors, unlike the rest of the authenticated dashboard | High (confirmed) | Medium — visible to every non-Spanish paying customer who uses this specific feature | TCOND-14 |
| R-DATA-01 | Analytics page repeatedly fails to load backend resources (410/404), suggesting stale references to removed offers | High (confirmed, exact count varies run to run) | Low — no visible breakage, but console noise and possible incomplete chart data | TCOND-13 |
| R-SEC-01 | Protected routes could be reachable without authentication, exposing paid data to anonymous users | Low (confirmed correctly gated) | High if it ever regressed | TCOND-18 |

*(R-LOC-01..04 and R-API-01 from the 2026-07-12 session still apply unchanged — see that document.)*

## 3. Test Conditions

| Condition ID | Condition | Traces to |
|---|---|---|
| TCOND-09 | New-user registration (email/password) must succeed and grant dashboard access with an active trial | R-FUNC-01 |
| TCOND-10 | Login (email/password) must succeed for valid credentials and fail safely (clear inline error, no crash) for invalid ones | R-FUNC-01 |
| TCOND-11 | Logout must end the session and prevent further access to authenticated pages | R-FUNC-01 |
| TCOND-12 | "Continue with Google" entry points must be present and route to the OAuth connector on both register and login | R-FUNC-01 |
| TCOND-13 | Analytics page must load without repeated resource-load failures | R-DATA-01 |
| TCOND-14 | Below-market page content must render in the site's active locale | R-LOC-05 |
| TCOND-15 | Offers Dashboard, Interactive Map, Top Sales, Notifications, and Favorites must each render their core content for an authenticated user | R-FUNC-01 |
| TCOND-16 | Payments page must display all three subscription plans with correct pricing and an active-subscription banner reflecting the real trial expiry | R-FUNC-01 |
| TCOND-17 | Terms of Service must be reachable by an unauthenticated visitor | R-ACC-01 |
| TCOND-18 | Pages that require an active account must redirect an unauthenticated visitor to login rather than exposing content | R-SEC-01 |
| TCOND-19 | The favorites-count badge in the nav must reflect the current count immediately after an add/remove action, without requiring a page reload | R-FUNC-01 |

## 4. Test Cases

```
ID:            TC-AUTH-003
Title:         New user can register with email/password and reach the dashboard with an active trial
Traceability:  TCOND-09; Risk: R-FUNC-01 (High)
Priority:      High
Technique:     Use Case Testing (primary registration path) + Equivalence Partitioning (valid email/password class)
Preconditions: - Browser has no active session
               - A disposable email address is available
Test data:     A syntactically valid, previously-unused email address; a password meeting the field's minimum requirements

Steps:
  1. Navigate to https://autocompraventaia.es/register
  2. Fill in the email and password fields with valid, unused values
  3. Submit the form

Expected result:
  - User is redirected to /offers
  - A trial-status indicator appears in the nav showing remaining trial time, counting down from the full trial window
  - No console errors related to the registration flow itself

Actual result observed in this session:
  - Registration succeeded; redirected to /offers as expected
  - Trial badge appeared and correctly counted down across subsequent page navigations (e.g. "paid 14 min" → "paid 13 min")
  - No registration-flow console errors (the pre-existing, separately-tracked favorites-count error — D-01 — is unrelated to this flow and appears on any unauthenticated OR just-authenticated page load)

Status:        Pass
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-AUTH-004
Title:         Registered user can log in with valid email/password credentials
Traceability:  TCOND-10; Risk: R-FUNC-01 (High)
Priority:      High
Technique:     Use Case Testing (primary login path)
Preconditions: - An account with known valid credentials exists
Test data:     The account's registered email and password

Steps:
  1. Navigate to https://autocompraventaia.es/login
  2. Enter the valid email and password
  3. Submit the form

Expected result:
  - User is authenticated and redirected into the dashboard

Actual result observed in this session:
  - Login succeeded and redirected to /offers as expected

Status:        Pass
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-AUTH-005
Title:         Login form handles invalid input safely (wrong password, empty submit, malformed email)
Traceability:  TCOND-10; Risk: R-FUNC-01 (High)
Priority:      Medium
Technique:     Error Guessing + Equivalence Partitioning (invalid-credential class, empty-field class, malformed-email class)
Preconditions: - Browser has no active session
Test data:     A syntactically valid but non-existent/incorrect email+password pair; an empty form submission; a malformed email string

Steps:
  1. Navigate to https://autocompraventaia.es/login
  2. Case A: enter a valid-looking but incorrect email/password and submit
  3. Case B: submit the form with both fields empty
  4. Case C: enter a malformed email (no "@") and submit

Expected result:
  - Case A: a clear, user-visible error message; no crash; no account access granted
  - Case B: browser-native or custom validation blocks submission with a clear message
  - Case C: browser-native or custom validation blocks submission with a clear message

Actual result observed in this session:
  - Case A: inline message "Invalid credentials." is shown; form remains usable; a 401 response is logged to console (expected for a rejected login, not itself a defect). Note: the error text is not exposed via an ARIA `alert` role, so it would not be reliably announced to assistive-technology users — accessibility finding, not filed as a defect this session (see Findings, F-09 in the walkthrough report).
  - Case B: browser-native HTML5 validation message "Please fill out this field." appears — consistent with the previously-noted finding that validation is browser-native, not custom-localized (F-02 from 2026-07-12).
  - Case C: not independently re-tested this session (browser-native `type="email"` validation was already confirmed in the 2026-07-12 session and the field markup is unchanged) — inherited pass, not re-verified today.

Status:        Pass (with one new accessibility finding, F-09)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-AUTH-006
Title:         Logged-in user can log out and loses access to authenticated pages
Traceability:  TCOND-11; Risk: R-FUNC-01 (High)
Priority:      Medium
Technique:     Use Case Testing
Preconditions: - User is logged in with an active session
Test data:     n/a

Steps:
  1. While logged in, locate the logout control in the nav bar (an icon-only link, not a text link — no visible "Logout" label, identified via its `title` attribute and `onclick` handler)
  2. Activate it
  3. Attempt to navigate to an authenticated page (e.g. /offers)

Expected result:
  - Session ends
  - Subsequent attempts to reach authenticated pages redirect to /login

Actual result observed in this session:
  - Confirmed the logout control exists: an icon-only anchor (`href="#"`, `onclick="handleLogout(event)"`, `title="Logout"`) in the authenticated nav bar
  - Full click-through confirmed: activating the control clears the session's authentication cookie, redirects to the home page, and a subsequent attempt to reach `/offers` correctly redirects to `/login`
  - Note: an initial check appeared to show the session staying alive post-logout; re-running with a longer wait for the logout request to finish before checking showed this was a timing artifact in the check itself (the logout call had not yet completed), not a site defect

Status:        Pass — full click-through and post-logout redirect confirmed
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-AUTH-007
Title:         "Continue with Google" entry points exist on both register and login
Traceability:  TCOND-12; Risk: R-FUNC-01 (High)
Priority:      Low
Technique:     Checklist-Based Testing
Preconditions: - None
Test data:     n/a

Steps:
  1. Navigate to /register?_locale=<en|es|de> and locate the Google sign-up link
  2. Navigate to /login?_locale=<en|es|de> and locate the Google sign-in link
  3. Inspect each link's destination without completing the OAuth flow

Expected result:
  - Both links are present on all three locales and point to the site's OAuth connector endpoint

Actual result observed in this session:
  - Present on EN, ES, and DE; all point to /connect/google
  - The OAuth flow itself (Google's consent screen, account linking, callback handling) was not exercised — out of scope for a walkthrough using disposable test identities

Status:        Pass, all 3 locales independently confirmed (entry point only; full OAuth completion not in scope)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-STATS-001
Title:         Analytics page renders for an authenticated user
Traceability:  TCOND-15; Risk: R-FUNC-01 (High)
Priority:      Medium
Technique:     Use Case Testing
Preconditions: - User is logged in
Test data:     n/a

Steps:
  1. Navigate to /stats/profit while authenticated
  2. Observe the page heading, calendar view, and tab set

Expected result:
  - Page renders with a heading, a sales calendar, and multiple analysis tabs

Actual result observed in this session:
  - Heading "Analytics & Benefit Statistics" present
  - Calendar view with per-day profit figures present
  - Seven tabs present: Overview, Trends, Seasonality, Mileage, Liquidity, Risks, Forecast

Status:        Pass
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-STATS-002
Title:         Analytics page triggers repeated resource-load failures (410/404) in console
Traceability:  TCOND-13; Risk: R-DATA-01 (Medium)
Priority:      Low
Technique:     Error Guessing
Preconditions: - User is logged in
Test data:     n/a

Steps:
  1. Navigate to /stats/profit while authenticated
  2. Open the browser console
  3. Observe resource-load errors over the following few seconds

Expected result:
  - No repeated resource-load failures

Actual result observed in this session:
  - 13 "Failed to load resource: the server responded with a status of 410 ()" errors logged within seconds of page load. A second, independent check in the same session recorded a similar but not identical mix of 410 and 404 errors (12-13 total) — consistent with the underlying resources being offer-linked assets whose availability changes as the live catalog changes, rather than a fixed, deterministic count.

Status:        Fail (confirmed defect D-11)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-MARKET-001
Title:         Below-market page does not localize for EN or DE locale
Traceability:  TCOND-14; Risk: R-LOC-05 (Medium)
Priority:      Medium
Technique:     Equivalence Partitioning by locale
Preconditions: - User is logged in
Test data:     Locales: en, de

Steps:
  1. Navigate to /below-market?_locale=en while authenticated; observe page title, heading, and content labels
  2. Repeat for /below-market?_locale=de

Expected result:
  - Page title, heading, and labels render in the active locale on both EN and DE

Actual result observed in this session:
  - EN: page title "Coches por debajo del precio de mercado" (Spanish); heading and all subheadings/labels Spanish ("España 🇪🇸", "Ahorro vs 2ª:", etc.)
  - DE: page title and heading also "Coches por debajo del precio de mercado" (Spanish) — same pattern, directly observed, not inferred
  - Confirmed on three independently registered accounts across both locales — not an account-specific caching artifact

Status:        Fail (confirmed defect D-10, both EN and DE directly observed)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-OFFERS-001
Title:         Offers Dashboard renders for an authenticated user
Traceability:  TCOND-15; Risk: R-FUNC-01 (High)
Priority:      Medium
Technique:     Use Case Testing
Preconditions: - User is logged in
Test data:     n/a

Steps:
  1. Navigate to /offers while authenticated
  2. Observe the listing table and filter controls

Expected result:
  - A filterable table of car listings renders

Actual result observed in this session:
  - Page loads (200, no redirect) with the dashboard layout and filter controls (Make/Model/Year/price/profit columns) present
  - Data grid confirmed populated: 123 table rows rendered

Status:        Pass — page load, layout, and populated data grid all independently confirmed
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-MAP-001
Title:         Interactive Map renders offers for an authenticated user
Traceability:  TCOND-15; Risk: R-FUNC-01 (High)
Priority:      Low
Technique:     Use Case Testing
Preconditions: - User is logged in
Test data:     n/a

Steps:
  1. Navigate to /map while authenticated
  2. Observe the map and marker count

Expected result:
  - Map renders with geolocated offer markers

Actual result observed in this session:
  - Map renders with a large number of geolocated markers, independently confirmed. The exact marker count observed differs from the walkthrough pass's reported figure — consistent with a live, continuously-updating dataset rather than a discrepancy between the two checks.

Status:        Pass, independently confirmed
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-TOPSALES-001
Title:         Top Sales ranking page renders for an authenticated user
Traceability:  TCOND-15; Risk: R-FUNC-01 (High)
Priority:      Low
Technique:     Use Case Testing
Preconditions: - User is logged in
Test data:     n/a

Steps:
  1. Navigate to /top-sales while authenticated
  2. Observe the ranking table

Expected result:
  - A ranked list of best-selling models renders

Actual result observed in this session:
  - Heading "Best-sellers in Spain" (correctly localized to English) confirmed independently, along with ranking content and a methodology note describing the pricing model

Status:        Pass, independently confirmed
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-NOTIF-001
Title:         Notifications settings page renders for an authenticated user
Traceability:  TCOND-15; Risk: R-FUNC-01 (High)
Priority:      Low
Technique:     Use Case Testing
Preconditions: - User is logged in
Test data:     n/a

Steps:
  1. Navigate to /notifications while authenticated
  2. Observe the settings controls and history table

Expected result:
  - Notification channel settings (e.g. Telegram, Email) and a history table render

Actual result observed in this session:
  - "Settings" heading with Telegram and Email Notifications options (both "No active method" for a fresh account) and an empty notification history table rendered as expected
  - One 404 console resource error observed alongside this page load — minor, not filed as its own defect given the small scale (1 occurrence vs. 13 on Analytics) but consistent with the same class of issue as D-11

Status:        Pass
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-FAV-001
Title:         Favorites page renders pre-seeded sample data and shows the badge count in the nav
Traceability:  TCOND-15; Risk: R-FUNC-01 (High)
Priority:      Medium
Technique:     Use Case Testing + Equivalence Partitioning (fresh-account state)
Preconditions: - User is a freshly registered account
Test data:     n/a

Steps:
  1. Register a fresh account
  2. Navigate to /favorites
  3. Observe the listing and the nav favorites-count badge

Expected result:
  - A consistent, documented set of sample favorites appears for new accounts, with the nav badge reflecting the same count

Actual result observed in this session:
  - All independently registered test accounts this session (multiple) showed the identical 11-car favorites list (same makes/models/prices) — confirms this is shared seed/demo data, not account-specific or accidental cross-account data
  - Nav badge showed "0" in the instant immediately following registration/redirect, then correctly showed "11" on the next page navigation — consistent with the count being fetched asynchronously after initial page load rather than a data defect

Status:        Pass (also resolves the 2026-07-12 open question about whether pre-populated favorites are intentional — confirmed: yes, consistent seed data)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-FAV-002
Title:         Favorites-count badge updates immediately after removing a favorite, without a page reload
Traceability:  TCOND-19; Risk: R-FUNC-01 (High)
Priority:      Low
Technique:     Use Case Testing (state-change verification)
Preconditions: - User is logged in with pre-seeded favorites
Test data:     n/a

Steps:
  1. Navigate to /favorites
  2. Note the nav favorites-count badge value
  3. Remove one favorite via its remove control (an icon-only button, class `remove-favorite-btn`) and accept the confirm dialog
  4. Without reloading the page, observe the badge again after several seconds
  5. Reload the page and observe the badge once more

Expected result:
  - The badge updates to the new, correct count promptly after removal, without requiring a reload

Actual result observed in this session:
  - Confirm dialog text: "Delete this car from favorites?" — matches the expected confirmation UX
  - The removal itself is correctly persisted: the card disappeared from the list, and a subsequent page reload showed the correct count (10) and 10 remaining remove-controls
  - However, the nav badge stayed at the pre-removal value ("11") for at least several seconds on the same page — it only reflected the correct count ("10") after a full reload

Status:        Fail (confirmed defect D-13)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-PAY-004
Title:         Payments page displays all three subscription plans with correct pricing and an accurate active-subscription banner
Traceability:  TCOND-16; Risk: R-FUNC-01 (High)
Priority:      High
Technique:     Use Case Testing + Checklist-Based Testing (per-plan field check)
Preconditions: - User is logged in with an active trial
Test data:     n/a

Steps:
  1. Navigate to /pagos while authenticated
  2. Observe the three plan cards and the active-subscription banner

Expected result:
  - Daily, Monthly, and Yearly plans each show a price and feature list; an active-subscription banner shows a real expiry date/time matching the account's actual trial

Actual result observed in this session:
  - Daily €2.99, Monthly €11.99 (flagged "MOST POPULAR"), Yearly €99.99 (flagged "BEST VALUE") — all present with feature lists
  - Active-subscription banner correctly reflected the real, dynamically-computed trial expiry timestamp on multiple separately registered accounts
  - Page heading itself localizes correctly on all three locales (EN: "Choose Your Plan", DE: "Wählen Sie Ihren Plan", ES: "Elige tu Plan") — the payments page's own heading/plan-name localization is not defective; only the date format (D-07, pre-existing) and price-unit suffix (D-09, pre-existing) remain unlocalized on DE, both independently re-confirmed present this session. ES is unaffected by either — Spanish date/decimal conventions match what's already displayed.

Status:        Pass, all 3 locale headings independently confirmed (D-07 and D-09 remain open on DE, tracked separately)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-TOS-001
Title:         Terms of Service is reachable without authentication
Traceability:  TCOND-17; Risk: R-ACC-01 (Medium-High)
Priority:      High
Technique:     Use Case Testing (public-page accessibility) + Error Guessing (unauthenticated precondition)
Preconditions: - Browser has no active session
Test data:     n/a

Steps:
  1. In a clean, logged-out browser session, navigate directly to /terms-of-service
  2. Separately, from the public home page footer, click the "Terms of Service" link

Expected result:
  - The Terms of Service page renders directly, without requiring login

Actual result observed in this session:
  - Both paths (direct URL and footer-link click) redirect to /login instead of rendering the page
  - Reproduced on a completely clean browser context (no cookies at all), ruling out a session-state artifact
  - Confirmed on en/es/de locale variants of the URL — same result on all three
  - The page does render correctly once the visitor is authenticated

Status:        Fail (confirmed defect D-12)
Author:        QA walkthrough session   Reviewed by: —
```

```
ID:            TC-SEC-001
Title:         Protected routes correctly redirect unauthenticated visitors to login
Traceability:  TCOND-18; Risk: R-SEC-01 (High)
Priority:      High
Technique:     Error Guessing (unauthenticated precondition against every protected route) + Equivalence Partitioning (locale = en/es/de)
Preconditions: - Browser has no active session
Test data:     Locales: en, es, de

Steps:
  1. In a clean, logged-out session, attempt to navigate directly to each of: /offers, /map, /top-sales, /below-market, /favorites, /pagos
  2. Repeat for all three in-scope locale query parameters

Expected result:
  - Every attempt redirects to /login rather than exposing protected content

Actual result observed in this session:
  - Confirmed for /offers, /map, /top-sales, /below-market, /favorites, and /pagos across en/es/de — full protected-route set now independently confirmed, all correctly redirect to /login
  - Note: on every redirect, the `?_locale=` query parameter is dropped — the destination is always plain `/login` with no locale context, regardless of which locale the visitor was on. This does not currently cause a visible defect only because the login form is already hardcoded to English (D-02), but it is a distinct, separately-worth-tracking behavior: once D-02 is fixed, this locale-drop-on-redirect would surface as its own visible bug. Flagged as a Finding (F-10 in the walkthrough report), not filed as a standalone defect while it remains masked by D-02.

Status:        Pass, full route set independently confirmed (core gating confirmed secure); one related finding flagged (F-10 in the walkthrough report) for future tracking
Author:        QA walkthrough session   Reviewed by: —
```

## 5. Automation Candidates

| Test Case | Automate? | Rationale |
|---|---|---|
| TC-AUTH-003, TC-AUTH-004 | Yes | Core registration/login happy paths — high value, stable, cheap to assert (redirect target + trial badge presence). |
| TC-AUTH-005 | Yes | Error-handling assertions (inline message text, HTML5 validation message) are stable, deterministic locator/text checks. |
| TC-AUTH-006 | Yes | Full click-through-and-redirect behavior is now independently confirmed — a good deterministic regression check (cookie cleared, redirect to home, subsequent protected-route access correctly gated). |
| TC-AUTH-007 | Yes, link-presence only | Assert the OAuth links exist on all 3 locales and point to `/connect/google` — do not attempt to automate the OAuth consent flow itself. |
| TC-STATS-001, TC-STATS-002 | Yes | Stable structural checks (heading, tab count) plus a console-error-count assertion — good regression-suite fit given the resource errors are already reproducible. |
| TC-MARKET-001 | Yes | Same pattern as the existing localization regression tests (TC-HOME-001, TC-BRAND-001) — assert the known Spanish strings are absent under `?_locale=en` and `?_locale=de`. |
| TC-OFFERS-001, TC-MAP-001, TC-TOPSALES-001, TC-NOTIF-001 | Yes | Same 14-minute trial-window fixture dependency as the existing payments tests. Content rendering is now independently confirmed (row counts, headings, marker presence) — good basis for both smoke and light content assertions. |
| TC-FAV-001 | Yes | The seed-data consistency (11 specific cars) is now a confirmed, stable regression marker — worth asserting the count and at least one known car name persist across registrations. |
| TC-FAV-002 | Yes | Deterministic regression gate for the badge-sync defect (D-13) — remove a favorite, assert the badge updates without a reload. |
| TC-PAY-004 | Yes | Extends the existing payments-formatting regression suite across all 3 locale headings; pairs well with the existing D-07/D-09 failure assertions. |
| TC-TOS-001 | Yes | High-value regression gate — simple, deterministic (redirect target check), and guards a compliance-relevant page. |
| TC-SEC-001 | Yes | Security-relevant gating check across the full protected-route set (including `/pagos`) — cheap, deterministic, and exactly the kind of check that should never silently regress. |

## 6. Regression Impact

This session's findings fall into two categories with different regression implications:

**Newly discovered (D-10, D-11, D-12, D-13):** all four sit in previously-untested areas of the site (below-market page, analytics page, terms-of-service routing, favorites badge state sync) rather than shared components already covered by the existing regression suite. Once fixed, TC-MARKET-001, TC-STATS-002, TC-TOS-001, and TC-FAV-002 should be added to the permanent regression suite alongside the existing localization and payments-formatting checks.

**Previously known, re-confirmed still present (D-01, D-02, D-03, D-04, D-05, D-07, D-09):** no new regression-suite entries needed — these already have automated coverage in the project's existing test suite from the 2026-07-12 session. This session's value for these seven was independent re-confirmation that they remain unfixed, not new discovery.

**Not re-verified this session (D-06, D-08):** these two should be re-checked in the next session before being dropped from active tracking — their last independent confirmation is now from the prior session, not this one.

**Coverage completed via chained trial windows:** every item originally flagged as a coverage gap due to the trial-window constraint was closed out using additional freshly registered accounts within the same session, each getting its own fresh 14-minute window — this includes ES-locale payments, DE-locale below-market, the full logout click-through, offers/map/top-sales content verification, the favorites remove interaction (which itself surfaced D-13), and unauthenticated `/pagos` gating. No flow in this session's scope remains untested due to the trial-window constraint.
