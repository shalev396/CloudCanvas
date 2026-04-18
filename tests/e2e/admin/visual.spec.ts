import { expect, test } from "@playwright/test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../../config";
import { loginViaDialog } from "../../helpers/auth";

test.describe("admin — visual", () => {
  test("admin panel loads at 1440x900 with all four control cards", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: /admin panel/i })
    ).toBeVisible();
    for (const name of [
      /download backup/i,
      /restore from backup/i,
      /seed services from icons/i,
      /clear all services/i,
    ]) {
      await expect(page.getByRole("button", { name })).toBeVisible();
    }
  });
});
