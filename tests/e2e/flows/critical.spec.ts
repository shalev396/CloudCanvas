import { expect, test } from "@playwright/test";
import {
  API_BASE_URL,
  NORMAL_TIMEOUT,
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
} from "../../config";
import { fetchServiceGroups, loginAdmin } from "../../helpers/api";
import { loginViaDialog, logoutViaMenu } from "../../helpers/auth";

test.describe("critical flow — admin browses, logs in, downloads backup", () => {
  test("login → /admin shows controls → backup endpoint returns JSON", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /admin panel/i })
    ).toBeVisible();

    const token = await loginAdmin(
      request,
      TEST_ADMIN_EMAIL,
      TEST_ADMIN_PASSWORD
    );
    const res = await request.get(`${API_BASE_URL}/admin/backup`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("services");
    expect(Array.isArray(body.services)).toBe(true);
  });

  test("anonymous flow — browse home → service detail works without login", async ({
    page,
    request,
  }) => {
    const groups = await fetchServiceGroups(request);
    const first = groups
      .flatMap((g) => g.services)
      .find((s) => s.enabled);
    test.skip(!first, "no enabled service available");

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /AWS Services Explorer/i })
    ).toBeVisible();
    await page.goto(`/${first!.category}/${first!.slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: first!.name })
    ).toBeVisible();
  });

  test("login → logout flow clears token and restores Login button", async ({
    page,
  }) => {
    await page.goto("/");
    await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    const tokenAfterLogin = await page.evaluate(() =>
      localStorage.getItem("cloudcanvas_auth_token")
    );
    expect(tokenAfterLogin).toBeTruthy();

    await logoutViaMenu(page);

    const tokenAfterLogout = await page.evaluate(() =>
      localStorage.getItem("cloudcanvas_auth_token")
    );
    expect(tokenAfterLogout).toBeNull();
    await expect(
      page.getByRole("button", { name: /^login$/i })
    ).toBeVisible({ timeout: NORMAL_TIMEOUT });
  });

  test("logout endpoint returns 200 regardless of auth state", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE_URL}/auth/logout`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ success: true });
  });
});
