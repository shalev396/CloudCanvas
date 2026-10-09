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

/**
 * Basic-auth credentials for deployed dev/qa. Only when BASIC_AUTH_PASSWORD
 * is set and BASE_URL is not localhost; username is the hostname.
 */
export function gateHttpCredentials() {
  const password = (process.env.BASIC_AUTH_PASSWORD ?? "").trim();
  if (!password || !process.env.BASE_URL) return undefined;
  const { hostname, origin } = new URL(BASE_URL);
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return undefined;
  }
  return {
    username: hostname,
    password,
    origin,
    send: "unauthorized" as const,
  };
}
