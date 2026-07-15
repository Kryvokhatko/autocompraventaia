import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
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
 * tests/helpers/test-case-inventory.json — the manual test-case inventory
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

interface TracedResult {
  id: string;
  status: TestResult["status"];
  testTitle: string;
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
  private readonly traced = new Map<string, TracedResult[]>();

  onTestEnd(test: TestCase, result: TestResult) {
    for (const id of extractTestCaseIds(test)) {
      const list = this.traced.get(id) ?? [];
      list.push({ id, status: result.status, testTitle: test.title });
      this.traced.set(id, list);
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

    const report = {
      generatedAt: new Date().toISOString(),
      metric: "requirements/test-condition coverage (NOT code coverage)",
      totalTestCases: inventory.length,
      automatedTestCases: covered.length,
      coveragePercent: Number(coveragePercent.toFixed(1)),
      covered: covered.map((tc) => ({
        ...tc,
        runs: this.traced.get(tc.id),
      })),
      missing,
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

    this.log.info(
      `Requirements coverage: ${covered.length}/${inventory.length} test cases automated (${report.coveragePercent}%)`
    );
    if (missing.length > 0) {
      this.log.warn(
        `Missing automation for: ${missing.map((tc) => `${tc.id} (${tc.priority})`).join(", ")}`
      );
    }
  }
}

export default TraceabilityReporter;
