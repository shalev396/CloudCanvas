import { expect, test } from "@playwright/test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../../config";
import { loginViaDialog } from "../../helpers/auth";
import { a11yScan } from "../../helpers/axe";

test.describe("admin — accessibility", () => {
  test("no axe-core violations on /admin (anonymous)", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const results = await a11yScan(page).analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });

  test("no axe-core violations on /admin (authenticated)", async ({ page }) => {
    await page.goto("/");
    await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const results = await a11yScan(page).analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });
});
