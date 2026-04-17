import { expect, test } from "@playwright/test";
import { NORMAL_TIMEOUT } from "../../config";
import { pickEnabledService } from "../../helpers/api";

test.describe("service detail — visual", () => {
  test("loads at 1440x900 and shows heading + overview", async ({
    page,
    request,
  }) => {
    const service = await pickEnabledService(request);
    test.skip(!service, "no enabled service available");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${service!.category}/${service!.slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: service!.name })
    ).toBeVisible({ timeout: NORMAL_TIMEOUT });
    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();
  });
});
