import { expect, test } from "@playwright/test";
import { NORMAL_TIMEOUT } from "../../config";
import { VIEWPORTS } from "../../helpers/viewports";
import { assertNoHorizontalOverflow } from "../../helpers/responsive";

test.describe("home — responsive", () => {
  for (const vp of VIEWPORTS) {
    test(`renders heading + search at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: /AWS Services Explorer/i })
      ).toBeVisible({ timeout: NORMAL_TIMEOUT });
      await expect(page.getByPlaceholder(/search services/i)).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
