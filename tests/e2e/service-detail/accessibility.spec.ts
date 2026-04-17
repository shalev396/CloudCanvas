import { expect, test } from "@playwright/test";
import { pickEnabledService } from "../../helpers/api";
import { a11yScan } from "../../helpers/axe";

test.describe("service detail — accessibility", () => {
  test("no axe-core violations on a known service page", async ({
    page,
    request,
  }) => {
    const service = await pickEnabledService(request);
    test.skip(!service, "no enabled service available");

    await page.goto(`/${service!.category}/${service!.slug}`);
    await page.waitForLoadState("networkidle");
    const results = await a11yScan(page).analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });
});
