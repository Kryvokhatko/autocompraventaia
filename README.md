# autocompraventaia

Playwright end-to-end, visual, and security-gating test automation for [autocompraventaia.es](https://autocompraventaia.es/), a car marketplace/analytics site with English, Spanish, and German locales.

## Tech stack

- [Playwright Test](https://playwright.dev/) + TypeScript
- [@faker-js/faker](https://fakerjs.dev/) for disposable test-account data

## Getting started

```bash
npm install
npx playwright install --with-deps chromium   # first time only, installs the browser
cp .env.example .env                           # then fill in the test account credentials
npx playwright test
```

`.env` is git-ignored. It holds the shared test account (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`) and, optionally, `BASE_URL` to point the suite at another environment (defaults to the live site).

## Scripts

| Command | Description |
|---|---|
| `npm test` | Run the full suite headlessly |
| `npm run test:headed` | Run with visible browsers |
| `npm run test:ui` | Run in Playwright's UI mode |
| `npm run report` | Open the last HTML report |

Common filtered runs:

```bash
npx playwright test --project=chromium          # single browser
npx playwright test --grep "@critical"           # by priority tag
npx playwright test --grep "@regression"         # regression suite only
npx playwright test tests/e2e/auth-flows.spec.ts # single file
```

## Project structure

```
pages/          # Page Objects — one class per page
components/     # Shared UI pieces reused across pages (navbar, etc.)
fixtures/       # Wires Page Objects into the `test` object; optional JS-coverage collection
helpers/        # Logger, disposable test-data factory, traceability reporter, manual test-case inventory
tests/
├── e2e/         # Functional specs
├── visual/      # Screenshot-diff specs
└── setup/       # Auth bootstrap (registers one disposable trial account, shared across projects)
TestArtifacts/  # Exploratory walkthrough reports and formalized test-case documents
```

`tests/` contains only spec files — Page Objects, fixtures, and other support code live outside it by design, so `testDir` globs can't accidentally pick up non-test code.

## Browser coverage

Desktop Chromium. The `chromium` project depends on a `setup` project that signs in once per run (see [Authentication](#authentication) below).

## Authentication

Two kinds of account, chosen by what a test does:

| Test does | Account | Why |
|---|---|---|
| Read-only checks on signed-in pages (dashboard, analytics, payments, Stripe Checkout) | **Shared paid account**, signed in once by `tests/setup/auth.setup.ts` | No trial limit; one sign-in per run |
| Registers, logs in/out, or edits favorites | **Disposable account** registered inside the test (`helpers/test-data.ts`) | Never modifies the shared account; always starts from the same seed data |

A newly registered account only gets a ~60-second free trial before every dashboard page redirects to `/pagos` — enough for one short test, not for a run — which is why the shared session comes from a paid account.

`auth.setup.ts` reads the credentials from the environment (`helpers/test-user.ts`), signs in, checks the subscription is still active (warning when under 14 days remain), and saves the session to `playwright/.auth/user.json`. Specs opt in with:

```ts
import { AUTH_FILE } from "../../helpers/test-user";
test.use({ storageState: AUTH_FILE });
```

The credentials never appear in test output: the setup step records no trace/screenshot/video, and `LoginPage.loginWithSecretCredentials` writes them into the form directly, because Playwright names `fill()` steps after the typed value and those names are stored in the HTML report that CI publishes as an artifact.

Page Objects navigate through `BasePage.open()`, which fails with a clear message if the site redirects away from the requested page (expired trial, missing session) — so a test can never pass by asserting on the redirect target instead.

## Known site defects

Tests guarding a still-open site defect assert the **correct** behavior and are marked `test.fail(true, "Open defect D-xx: …")`. The suite stays green while the defect exists, and Playwright reports the test as an unexpected pass the day the defect is fixed — the cue to remove the marker. Currently open: D-01, D-04/D-05, D-07, D-08, D-09, D-10, D-11, D-12, D-13.

An **intermittent** defect can't use `test.fail()` — the test would flip between pass and fail — so its test is quarantined with `test.fixme(true, "Quarantined — open defect D-xx …")` instead: skipped and visibly flagged in the report until the defect is fixed. Currently quarantined: D-14 (logout sometimes leaves the session active).

## Screenshot baselines

`tests/visual` compares against committed baselines per platform: `*-chromium-win32.png` for local Windows runs and `*-chromium-linux.png` for CI. Regenerate after an intended UI change with `npx playwright test tests/visual --no-deps --update-snapshots` locally, and for Linux inside the matching Playwright image:

```bash
docker run --rm -v "$PWD:/work" -w /work --ipc=host mcr.microsoft.com/playwright:v1.61.1-noble \
  npx playwright test tests/visual --no-deps --update-snapshots
```

## Tagging convention

Every test carries a priority tag derived from its risk level, plus `@regression` where applicable:

| Tag | Meaning |
|---|---|
| `@critical` / `@p0` | High priority |
| `@p1` | Medium priority |
| `@p2` | Low priority |
| `@regression` | Guards a confirmed defect or shared/global component — belongs in the permanent regression suite |
| `@visual` | Screenshot-diff check, not tied to a specific manual test case |

Tags live in Playwright's structured `{ tag: [...] }` option, never inline in the test title.

## Traceability reporting

Every automated test embeds its manual test-case ID (`TC-<AREA>-<NUM>`) in both its title and a structured annotation. `helpers/traceability-reporter.ts` cross-references these against `helpers/test-case-inventory.json` after each run and writes `test-results/traceability-report.json`, showing which manual test cases are automated, which are missing, and their pass/fail status. This is a **requirements/test-condition coverage** metric — separate from and not a substitute for code coverage (see `fixtures/coverage.fixture.ts` for the optional, secondary JS-coverage collector).

## CI

`.github/workflows/playwright.yml` runs the suite on every pull request and push to `main`/`master`, nightly at 05:00 UTC (the site under test changes independently of this repo), and on demand from the Actions tab. A newer push to the same branch cancels the older run.

- **Secrets** (Settings → Secrets and variables → Actions): `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`. Optional repository variable `BASE_URL`.
- **On CI** the config uses 4 workers, 2 retries (a test passing only on retry is reported as flaky), traces on the first retry, screenshots on failure, a 20-minute global timeout (below the 30-minute job timeout, so reports are always written), and the `github` reporter for inline PR annotations.
- **Artifacts**: HTML report (with traces), traceability report, and JS coverage if collected.

## Test artifacts

`TestArtifacts/` holds dated exploratory-walkthrough reports and formalized test-case documents (Markdown + a self-contained HTML rendering of each) that this suite's automated coverage is derived from.
