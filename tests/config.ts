/**
 * E2E test configuration — timeouts and shared constants.
 */

export const SHORT_TIMEOUT = 5_000;
export const NORMAL_TIMEOUT = 15_000;
export const LONG_TIMEOUT = 30_000;

export const TEST_ADMIN_EMAIL = "qa-admin@cloudcanvas.test";
export const TEST_ADMIN_PASSWORD = "qa-admin-password-1234";

export const BASE_URL = (
  process.env.BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
export const API_BASE_URL = (
  process.env.API_BASE_URL ?? `${BASE_URL}/api`
).replace(/\/$/, "");
