import { expect, test } from "@playwright/test";
import { NORMAL_TIMEOUT } from "../../config";

test.describe("home page — smoke", () => {
  test("renders heading and stats subheader", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /AWS Services Explorer/i })
    ).toBeVisible({ timeout: NORMAL_TIMEOUT });
    await expect(
      page.getByText(/Currently supports \d+ out of \d+ services/i)
    ).toBeVisible({ timeout: NORMAL_TIMEOUT });
  });

  test("renders at least one category card with a service-count badge", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const badges = page.getByText(/^\d+ services$/);
    await expect(badges.first()).toBeVisible({ timeout: NORMAL_TIMEOUT });
    expect(await badges.count()).toBeGreaterThan(0);
  });

  test("renders the search input", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByPlaceholder(/search services/i)
    ).toBeVisible({ timeout: NORMAL_TIMEOUT });
  });
});
