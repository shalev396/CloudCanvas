import { expect, test } from "@playwright/test";
import { NORMAL_TIMEOUT } from "../../config";
import { pickEnabledService } from "../../helpers/api";
import { VIEWPORTS } from "../../helpers/viewports";
import { assertNoHorizontalOverflow } from "../../helpers/responsive";

test.describe("service detail — responsive", () => {
  for (const vp of VIEWPORTS) {
    test(`heading is visible at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
      request,
    }) => {
      const service = await pickEnabledService(request);
      test.skip(!service, "no enabled service available");
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${service!.category}/${service!.slug}`);
      await expect(
        page.getByRole("heading", { level: 1, name: service!.name })
      ).toBeVisible({ timeout: NORMAL_TIMEOUT });
      await assertNoHorizontalOverflow(page);
    });
  }
});
