# autocompraventaia

Playwright end-to-end, visual, and security-gating test automation for [autocompraventaia.es](https://autocompraventaia.es/), a car marketplace/analytics site with English, Spanish, and German locales.

## Tech stack

- [Playwright Test](https://playwright.dev/) + TypeScript
- [@faker-js/faker](https://fakerjs.dev/) for disposable test-account data

## Getting started

```bash
npm install
npx playwright install --with-deps   # first time only, installs browser binaries
npx playwright test
```

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

## Browser & device coverage

Chromium, Firefox, WebKit, plus Pixel 5 and iPhone 12 emulation — all depend on a `setup` project that registers one disposable trial account and persists `storageState` for reuse across every project in the run (see [Authentication](#authentication) below).

## Authentication

The site grants a 14-minute free-access trial per registered account. `tests/setup/auth.setup.ts` registers a single disposable account once per run and saves its session to `playwright/.auth/trial-session.json`; specs needing an authenticated session opt in via:

```ts
test.use({ storageState: "playwright/.auth/trial-session.json" });
```

A few specs (e.g. favorites) register their own fresh account inline instead of using the shared session, when a test needs to mutate state or verify a pristine account — see the comment at the top of those files for why.

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

`.github/workflows/playwright.yml` runs the full suite on every push/PR to `main`/`master` and uploads the HTML report, traceability report, and JS coverage (if collected) as build artifacts.

## Test artifacts

`TestArtifacts/` holds dated exploratory-walkthrough reports and formalized test-case documents (Markdown + a self-contained HTML rendering of each) that this suite's automated coverage is derived from.
