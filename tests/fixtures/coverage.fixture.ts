import { test as base } from "@playwright/test";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createLogger } from "../helpers/logger";

/**
 * Optional V8 JS coverage collection — SECONDARY metric only.
 *
 * This measures how much of the shipped, minified bundle was executed
 * during a run — useful as a rough signal that pages actually loaded and
 * ran their JS, but it is not statement/branch coverage of maintained
 * source code. The primary coverage metric for this project is
 * requirements/test-condition coverage — see helpers/traceability-reporter.ts.
 *
 * Opt-in via COLLECT_JS_COVERAGE=1 (off by default — adds overhead and this
 * suite runs against a live site where every extra second matters given the
 * 14-minute trial window on authenticated tests).
 */

const log = createLogger("CoverageFixture");
const ENABLED = process.env.COLLECT_JS_COVERAGE === "1";
const COVERAGE_DIR = path.join(process.cwd(), "coverage");

export const test = base.extend<{}, { collectShippedBundleCoverage: void }>({
  collectShippedBundleCoverage: [
    async ({ browser, browserName }, use) => {
      if (!ENABLED || browserName !== "chromium") {
        // V8 coverage API is Chromium-only.
        await use();
        return;
      }

      const context = await browser.newContext();
      const page = await context.newPage();
      await page.coverage.startJSCoverage({ resetOnNavigation: false });

      await use();

      const jsCoverage = await page.coverage.stopJSCoverage();
      fs.mkdirSync(COVERAGE_DIR, { recursive: true });
      const outFile = path.join(COVERAGE_DIR, `shipped-bundle-${randomUUID()}.json`);
      fs.writeFileSync(outFile, JSON.stringify(jsCoverage));
      log.debug("Wrote shipped-bundle coverage snapshot", { outFile });

      await context.close();
    },
    { scope: "worker", auto: ENABLED },
  ],
});

export { expect } from "@playwright/test";
