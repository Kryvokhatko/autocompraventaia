import type { FullResult, Reporter, TestCase } from "@playwright/test/reporter";
import fs from "fs";
import path from "path";
import { createLogger } from "./logger";

/**
 * Requirements/test-condition coverage reporter.
 *
 * Code coverage (statements/branches of shipped JS) is a DIFFERENT metric
 * from requirements/test-condition coverage, and one must not stand in for
 * the other — a suite can have high statement coverage while an entire
 * manual test case (and the requirement behind it) goes completely
 * unexercised.
 *
 * This reporter cross-references the TC-<AREA>-<NUM> IDs declared as
 * `{ type: 'test-case', description: 'TC-...' }` annotations against
 * helpers/test-case-inventory.json — the manual test-case inventory
 * this suite is expected to cover — and reports which test conditions are
 * automated, which are missing, and the pass/fail status of each. This is
 * the PRIMARY coverage metric for this project; code coverage (if
 * collected at all, see coverage.fixture.ts) is secondary.
 */

interface InventoryEntry {
  id: string;
  title: string;
  risk: string;
  priority: string;
}

/**
 * Readable result of one automated test, derived from Playwright's outcome
 * and the test's expected status:
 *   passed        — passed, as expected
 *   known-defect  — marked test.fail() for an open site defect and failed as
 *                   expected (Playwright counts this as a pass)
 *   fixed?        — marked test.fail() but passed: the defect may be fixed,
 *                   so the marker should be reviewed
 *   failed        — failed unexpectedly
 *   flaky         — failed, then passed on retry
 *   skipped       — skipped or quarantined (test.skip / test.fixme)
 */
type TracedResult = "passed" | "known-defect" | "fixed?" | "failed" | "flaky" | "skipped";

interface TracedRun {
  testTitle: string;
  result: TracedResult;
  outcome: ReturnType<TestCase["outcome"]>;
  attempts: number;
  // Reason given to test.fail() / test.fixme() / test.skip(), e.g. the
  // open defect ID a known-defect test guards.
  note?: string;
}

function toTracedRun(test: TestCase): TracedRun {
  // Not result.status: that is the raw status of an attempt ("failed" for a
  // test.fail() test that failed exactly as expected), not whether the
  // outcome matched what the test declared it expects.
  const outcome = test.outcome();
  const expectsFailure = test.expectedStatus === "failed";
  const result: TracedResult =
    outcome === "skipped" ? "skipped"
    : outcome === "flaky" ? "flaky"
    : outcome === "expected" ? (expectsFailure ? "known-defect" : "passed")
    : expectsFailure ? "fixed?" : "failed";

  const note = test.annotations.find((a) => ["fail", "fixme", "skip"].includes(a.type))?.description;

  return {
    testTitle: test.title,
    result,
    outcome,
    attempts: test.results.length,
    ...(note ? { note } : {}),
  };
}

const INVENTORY_PATH = path.join(__dirname, "test-case-inventory.json");
const OUTPUT_PATH = path.join(process.cwd(), "test-results", "traceability-report.json");

function extractTestCaseIds(test: TestCase): string[] {
  const fromAnnotations = test.annotations
    .filter((a) => a.type === "test-case" && a.description)
    .map((a) => a.description as string);

  // Fall back to scanning the title in case a test forgot the structured
  // annotation — the annotation is still required going forward, this only
  // prevents silent coverage gaps caused by an omission.
  const fromTitle = [...test.title.matchAll(/TC-[A-Z]+-\d+/g)].map((m) => m[0]);

  return [...new Set([...fromAnnotations, ...fromTitle])];
}

class TraceabilityReporter implements Reporter {
  private readonly log = createLogger("TraceabilityReporter");
  // Tests per TC ID. A Set, because onTestEnd fires once per attempt and a
  // retried test must still count once; its outcome is read in onEnd, after
  // all attempts are known.
  private readonly traced = new Map<string, Set<TestCase>>();

  onTestEnd(test: TestCase) {
    for (const id of extractTestCaseIds(test)) {
      const tests = this.traced.get(id) ?? new Set<TestCase>();
      tests.add(test);
      this.traced.set(id, tests);
    }
  }

  onEnd(_result: FullResult) {
    let inventory: InventoryEntry[] = [];
    try {
      inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8")).testCases;
    } catch (err) {
      this.log.warn("No test-case inventory found; skipping traceability report", {
        path: INVENTORY_PATH,
      });
      return;
    }

    const covered = inventory.filter((tc) => this.traced.has(tc.id));
    const missing = inventory.filter((tc) => !this.traced.has(tc.id));
    const coveragePercent = inventory.length
      ? (covered.length / inventory.length) * 100
      : 0;

    const coveredWithRuns = covered.map((tc) => ({
      ...tc,
      runs: [...this.traced.get(tc.id)!].map(toTracedRun),
    }));

    const results: Partial<Record<TracedResult, number>> = {};
    for (const run of coveredWithRuns.flatMap((tc) => tc.runs)) {
      results[run.result] = (results[run.result] ?? 0) + 1;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      metric: "requirements/test-condition coverage (NOT code coverage)",
      totalTestCases: inventory.length,
      automatedTestCases: covered.length,
      coveragePercent: Number(coveragePercent.toFixed(1)),
      results,
      covered: coveredWithRuns,
      missing,
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

    this.log.info(
      `Requirements coverage: ${covered.length}/${inventory.length} test cases automated (${report.coveragePercent}%)`,
      results
    );
    if (results["fixed?"]) {
      this.log.warn("A test marked test.fail() passed — its defect may be fixed; review the marker (result \"fixed?\")");
    }
    if (missing.length > 0) {
      this.log.warn(
        `Missing automation for: ${missing.map((tc) => `${tc.id} (${tc.priority})`).join(", ")}`
      );
    }
  }
}

export default TraceabilityReporter;
