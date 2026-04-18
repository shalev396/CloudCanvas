import { expect, test } from "@playwright/test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../../config";
import { injectToken } from "../../helpers/auth";
import { loginAdmin } from "../../helpers/api";
import { VIEWPORTS } from "../../helpers/viewports";
import { assertNoHorizontalOverflow } from "../../helpers/responsive";

// Auth is set up via API + localStorage so every viewport test starts from a
// known logged-in state. The login dialog's own responsive behavior is
// covered by tests/e2e/login/responsive.spec.ts — this suite only verifies
// that the admin panel itself renders correctly at each viewport.
test.describe("admin — responsive", () => {
  for (const vp of VIEWPORTS) {
    test(`admin panel heading visible at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
      request,
    }) => {
      const token = await loginAdmin(request, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
      await injectToken(page, token);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/admin");
      await expect(
        page.getByRole("heading", { name: /admin panel/i })
      ).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
