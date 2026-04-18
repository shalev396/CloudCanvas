import { expect, test } from "@playwright/test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../../config";
import { loginViaDialog } from "../../helpers/auth";

test.describe("admin gating — smoke", () => {
  test("anonymous user sees Access Denied at /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /access denied/i })
    ).toBeVisible();
    await expect(
      page.getByText(
        /must be logged in as an administrator to access this page/i
      )
    ).toBeVisible();
  });

  test("admin user sees backup / restore / seed / clear controls", async ({
    page,
  }) => {
    await page.goto("/");
    await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /admin panel/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /download backup/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /restore from backup/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /seed services from icons/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /clear all services/i })
    ).toBeVisible();
  });
});
