import { expect, test } from "@playwright/test";
import { openLoginDialog } from "../../helpers/auth";

test.describe("login dialog — visual", () => {
  test("dialog opens at 1440x900 and renders email + password + submit", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await openLoginDialog(page);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^sign in$/i })
    ).toBeVisible();
  });
});
