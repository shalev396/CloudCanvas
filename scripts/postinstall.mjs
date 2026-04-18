// Runs after `npm install`. Downloads the Playwright Chromium browser so
// developers don't need a separate `npm run test:install` step.
//
// Skipped on Vercel (production deploys don't run the E2E suite) and when
// SKIP_PLAYWRIGHT_INSTALL=1 is set (CI jobs that manage their own cache).
import { spawnSync } from "child_process";

if (process.env.VERCEL === "1" || process.env.SKIP_PLAYWRIGHT_INSTALL === "1") {
  process.exit(0);
}

const result = spawnSync("playwright", ["install", "chromium"], {
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 0);
