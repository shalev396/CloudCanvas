import { expect, test } from "@playwright/test";

test.describe("home — security", () => {
  test("no JWT-like token strings visible in rendered DOM (anonymous)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/);
  });

  test("no cloudcanvas_auth_token in localStorage for anonymous visitor", async ({
    page,
  }) => {
    await page.goto("/");
    const token = await page.evaluate(() =>
      localStorage.getItem("cloudcanvas_auth_token")
    );
    expect(token).toBeNull();
  });
});
