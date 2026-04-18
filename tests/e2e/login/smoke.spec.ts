import { expect, test } from "@playwright/test";
import { API_BASE_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "../../config";
import { loginViaDialog, openLoginDialog } from "../../helpers/auth";

test.describe("login dialog — smoke", () => {
  test("dialog opens with email + password fields and Sign In button", async ({
    page,
  }) => {
    await page.goto("/");
    await openLoginDialog(page);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^sign in$/i })
    ).toBeVisible();
  });

  test("signup is hidden — no 'Need an account? Sign up' toggle", async ({
    page,
  }) => {
    await page.goto("/");
    await openLoginDialog(page);
    await expect(
      page.getByRole("button", { name: /need an account\? sign up/i })
    ).toHaveCount(0);
  });

  test("invalid credentials show 'Invalid credentials' alert", async ({
    page,
  }) => {
    await page.goto("/");
    await openLoginDialog(page);
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByRole("alert")).toContainText(/invalid credentials/i);
  });

  test("API rejects bad credentials with 401", async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: "nobody@example.com", password: "wrong" },
    });
    expect(res.status()).toBe(401);
    expect(await res.json()).toMatchObject({
      success: false,
      error: "Invalid credentials",
    });
  });

  test("API rejects signup with 403 (registration disabled)", async ({
    request,
  }) => {
    const res = await request.post(`${API_BASE_URL}/auth/register`, {
      data: { email: "x@y.z", name: "x", password: "passw0rd1" },
    });
    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({
      success: false,
      error: "Registration is disabled",
    });
  });

  test("preset admin can log in and token is stored", async ({ page }) => {
    await page.goto("/");
    await loginViaDialog(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    const token = await page.evaluate(() =>
      localStorage.getItem("cloudcanvas_auth_token")
    );
    expect(token).toBeTruthy();
  });
});
