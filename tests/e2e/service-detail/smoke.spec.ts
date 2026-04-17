import { expect, test } from "@playwright/test";
import { NORMAL_TIMEOUT } from "../../config";
import { pickEnabledService } from "../../helpers/api";

test.describe("service detail — smoke", () => {
  test("renders heading, overview, and related services for a known service", async ({
    page,
    request,
  }) => {
    const service = await pickEnabledService(request);
    test.skip(!service, "no enabled service available in this environment");

    await page.goto(`/${service!.category}/${service!.slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: service!.name })
    ).toBeVisible({ timeout: NORMAL_TIMEOUT });
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Overview" }).first()
    ).toBeVisible();
    await expect(
      page
        .locator('[data-slot="card-title"]', { hasText: "Related Services" })
        .first()
    ).toBeVisible();
  });

  test("unknown service returns 404", async ({ page }) => {
    const res = await page.goto("/aws/this-service-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });
});
