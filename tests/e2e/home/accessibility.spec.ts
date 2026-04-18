import { expect, test } from "@playwright/test";
import { a11yScan } from "../../helpers/axe";

test.describe("home page — accessibility", () => {
  test("no axe-core violations on /", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const results = await a11yScan(page).analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });
});
