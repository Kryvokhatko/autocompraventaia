# Formalized Test Cases — Favorites-Count API (autocompraventaia.es)

Test basis: observed behavior of `GET /api/favorites/count`, the endpoint the navbar favorites badge reads, exercised directly over HTTP. These cases extend TC-API-001 (in `i18n_test_cases_2026-07-12.md`), which covers the same defect from the browser side (the console error a signed-out page load produces).

## 1. Summary

The endpoint's behavior depends on two inputs: whether the request carries a signed-in session, and whether it asks for JSON (`Accept: application/json`). Those form three equivalence partitions, one test case each.

| Request | Observed response |
|---|---|
| Signed in | `200`, `application/json`, body `{"count": <number>}` |
| Signed out, default headers (what the site's own `fetch()` sends) | `302` redirect to `/login`, an HTML page |
| Signed out, `Accept: application/json` | `401`, body `Authentication required`, served as `text/html` |

The second row is the root cause of D-01: the page's `fetch('/api/favorites/count')` sends no `Accept` header, follows the redirect, receives the login page with a successful status, and fails when parsing it as JSON.

## 2. Risks and Traceability

R-API-01 (from the 2026-07-12 document) applies: *client throws on an unauthenticated API response → console noise, possible downstream JavaScript state issues.*

## 3. Test Conditions

| Condition ID | Condition | Traces to |
|---|---|---|
| TCOND-31 | A signed-in request for the favorites count must return the count as JSON, consistent with the count shown on the navbar badge | R-API-01 |
| TCOND-32 | A signed-out request must be rejected with an authentication error, not redirected to an HTML page | D-01, R-API-01 |
| TCOND-33 | A signed-out request that asks for JSON must receive its authentication error as JSON | D-01, R-API-01 |

## 4. Test Cases

```
ID:            TC-API-002
Title:         Signed-in favorites-count API request returns the count as JSON, matching the navbar badge
Traceability:  TCOND-31; Risk: R-API-01
Priority:      Medium
Technique:     Equivalence Partitioning (partition: signed in)
Preconditions: - A signed-in session for an account with an active subscription
Test data:     The shared test account

Steps:
  1. Send GET /api/favorites/count with the signed-in session, without following redirects
  2. Open /offers in a browser with the same session and read the navbar favorites badge

Expected result:
  - Status 200, Content-Type application/json
  - Body is exactly {"count": <number>}, with count >= 0
  - The navbar badge shows the same number

Actual result:
  - As expected (count 10 for the shared test account, matching the badge)

Status:        Pass
Automated:     tests/api/favorites-count.api.spec.ts
```

```
ID:            TC-API-003
Title:         Signed-out favorites-count API request is rejected with 401, not redirected to the HTML login page
Traceability:  TCOND-32; Defect: D-01; Risk: R-API-01
Priority:      Medium
Technique:     Equivalence Partitioning (partition: signed out, default headers)
Preconditions: - No session
Test data:     n/a

Steps:
  1. Send GET /api/favorites/count with no session and default headers, without following redirects

Expected result:
  - Status 401 (an authentication error the caller can distinguish from data)

Actual result:
  - Status 302 with Location: /login — following it yields the HTML login page with status 200

Status:        Fail (open defect D-01) — automated as an expected failure
Automated:     tests/api/favorites-count.api.spec.ts
```

```
ID:            TC-API-004
Title:         Signed-out favorites-count API request asking for JSON gets a JSON 401 error
Traceability:  TCOND-33; Defect: D-01; Risk: R-API-01
Priority:      Low
Technique:     Equivalence Partitioning (partition: signed out, Accept: application/json)
Preconditions: - No session
Test data:     n/a

Steps:
  1. Send GET /api/favorites/count with no session and Accept: application/json, without following redirects

Expected result:
  - Status 401
  - Content-Type application/json, with a JSON error body

Actual result:
  - Status 401, but the body is the plain text "Authentication required" served as text/html

Status:        Fail (open defect D-01) — automated as an expected failure
Automated:     tests/api/favorites-count.api.spec.ts
```
