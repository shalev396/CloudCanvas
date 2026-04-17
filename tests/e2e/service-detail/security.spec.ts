import { expect, test } from "@playwright/test";
import { pickEnabledService } from "../../helpers/api";

test.describe("service detail — security", () => {
  test("unknown service returns 404 (not-found fallback)", async ({ page }) => {
    const res = await page.goto("/aws/this-service-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  });

  test("no JWT-like token strings visible in rendered DOM", async ({
    page,
    request,
  }) => {
    const service = await pickEnabledService(request);
    test.skip(!service, "no enabled service available");
    await page.goto(`/${service!.category}/${service!.slug}`);
    await page.waitForLoadState("networkidle");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/);
  });
});
