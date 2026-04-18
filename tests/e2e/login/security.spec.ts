import { expect, test } from "@playwright/test";
import { API_BASE_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../../config";
import { loginViaDialog } from "../../helpers/auth";

test.describe("login — security", () => {
  test("password field uses type=password (masked)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^login$/i }).first().click();
    const input = page.getByLabel("Password");
    await expect(input).toBeVisible();
    expect(await input.getAttribute("type")).toBe("password");
  });

  test("token is not exposed in document.cookie after login", async ({ page }) => {
    await page.goto("/");
    await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toMatch(/cloudcanvas_auth_token/);
    expect(cookies).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/);
  });

  test("Set-Cookie on login response does not include the JWT", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const setCookie =
      res.headers()["set-cookie"] ?? res.headers()["Set-Cookie"] ?? "";
    expect(setCookie).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/);
  });
});
