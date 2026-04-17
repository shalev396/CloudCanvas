import { request } from "@playwright/test";
import {
  API_BASE_URL,
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
} from "./config";

/**
 * Wipes the users table and seeds a known admin so every test run starts
 * from a known state. Skips silently if /api/dev/reset is not available
 * (e.g. when pointed at prod, which returns 403 by design).
 */
export default async function globalSetup() {
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${API_BASE_URL}/dev/reset`, {
      data: {
        scope: "users",
        admin: {
          email: TEST_ADMIN_EMAIL,
          password: TEST_ADMIN_PASSWORD,
          name: "QA Test Admin",
        },
      },
    });
    if (res.status() === 403) {
      console.warn(
        `[global-setup] /dev/reset returned 403 — environment does not allow reset. Continuing without seeding.`
      );
      return;
    }
    if (!res.ok()) {
      throw new Error(
        `[global-setup] /dev/reset failed ${res.status()}: ${await res.text()}`
      );
    }
    const body = await res.json();
    console.log(
      `[global-setup] reset ok — deletedUsers=${body.data?.deletedUsers}, admin=${body.data?.createdAdmin?.email}`
    );
  } finally {
    await ctx.dispose();
  }
}
