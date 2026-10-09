// Runs Playwright against a deployed stage: `npm run test:live:qa`.
// Env file values never override variables that are already set.
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const stage = process.argv[2];
const envFile = { dev: ".env.development", qa: ".env.qa" }[stage];
if (!envFile) {
  console.error("Usage: node scripts/test-live.mjs <dev|qa> [playwright args]");
  process.exit(1);
}

const envPath = resolve(process.cwd(), envFile);
if (existsSync(envPath)) process.loadEnvFile(envPath);

const domain = (process.env.CUSTOM_DOMAIN ?? "").trim();
if (!process.env.BASE_URL && domain) process.env.BASE_URL = `https://${domain}`;
if (!process.env.BASE_URL) {
  console.error(`BASE_URL or CUSTOM_DOMAIN is required (set it in ${envFile} or the environment).`);
  process.exit(1);
}
process.env.BASE_URL = process.env.BASE_URL.replace(/\/$/, "");
if (!process.env.API_BASE_URL) process.env.API_BASE_URL = `${process.env.BASE_URL}/api`;

const password = (process.env.BASIC_AUTH_PASSWORD ?? "").trim();
if (!password) {
  console.error(`BASIC_AUTH_PASSWORD is required (set it in ${envFile} or the environment).`);
  process.exit(1);
}

console.log(`Testing ${process.env.BASE_URL}`);
const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(3)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, BASIC_AUTH_PASSWORD: password },
});
process.exit(result.status ?? 1);
