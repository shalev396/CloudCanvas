import { expect, test } from "@playwright/test";
import { NORMAL_TIMEOUT } from "../../config";

test.describe("home — visual", () => {
  test("loads at 1440x900 and renders key landmarks", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /AWS Services Explorer/i })
    ).toBeVisible({ timeout: NORMAL_TIMEOUT });
    await expect(page.locator("header")).toBeVisible();
    expect(page.url()).toMatch(/\/$/);
  });
});
