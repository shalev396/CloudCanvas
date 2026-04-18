import { expect, test } from "@playwright/test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../../config";
import { loginViaDialog } from "../../helpers/auth";
import { VIEWPORTS } from "../../helpers/viewports";
import { assertNoHorizontalOverflow } from "../../helpers/responsive";

test.describe("admin — responsive", () => {
  for (const vp of VIEWPORTS) {
    test(`admin panel heading visible at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
      await page.goto("/admin");
      await expect(
        page.getByRole("heading", { name: /admin panel/i })
      ).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
