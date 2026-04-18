import { expect, test } from "@playwright/test";
import { openLoginDialog } from "../../helpers/auth";
import { a11yScan } from "../../helpers/axe";

test.describe("login dialog — accessibility", () => {
  test("no axe-core violations when login dialog is open", async ({
    page,
  }) => {
    await page.goto("/");
    await openLoginDialog(page);
    const results = await a11yScan(page).analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });

  test("Email and Password inputs are reachable via getByLabel", async ({
    page,
  }) => {
    await page.goto("/");
    await openLoginDialog(page);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
