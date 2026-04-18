import { expect, test } from "@playwright/test";
import { openLoginDialog } from "../../helpers/auth";
import { VIEWPORTS } from "../../helpers/viewports";
import { assertNoHorizontalOverflow } from "../../helpers/responsive";

test.describe("login dialog — responsive", () => {
  for (const vp of VIEWPORTS) {
    test(`dialog inputs are visible at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await openLoginDialog(page);
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
