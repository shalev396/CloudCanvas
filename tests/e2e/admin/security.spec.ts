import { expect, test } from "@playwright/test";
import { API_BASE_URL } from "../../config";

test.describe("admin — security", () => {
  test("anonymous /admin shows Access Denied, not the panel", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /access denied/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /admin panel/i })
    ).toHaveCount(0);
  });

  test("anonymous backup API returns 401 or 403", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/backup`);
    expect([401, 403]).toContain(res.status());
  });

  test("anonymous clear API returns 401 or 403", async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/admin/clear`);
    expect([401, 403]).toContain(res.status());
  });

  test("bogus bearer token is rejected on backup", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/admin/backup`, {
      headers: { Authorization: "Bearer not-a-real-token" },
    });
    expect([401, 403]).toContain(res.status());
  });
});
