import { Page, expect } from "@playwright/test";
import { NORMAL_TIMEOUT } from "../config";

export async function openLoginDialog(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^login$/i }).first().click();
  await expect(
    page.getByRole("dialog", { name: /sign in to cloud canvas/i })
  ).toBeVisible({ timeout: NORMAL_TIMEOUT });
}

export async function loginViaDialog(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await openLoginDialog(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(
    page.getByRole("dialog", { name: /sign in to cloud canvas/i })
  ).toBeHidden({ timeout: NORMAL_TIMEOUT });
}

export async function logoutViaMenu(page: Page): Promise<void> {
  await page.locator("header button.rounded-full").first().click();
  await page.getByRole("menuitem", { name: /log out/i }).click();
  await expect(
    page.getByRole("button", { name: /^login$/i })
  ).toBeVisible({ timeout: NORMAL_TIMEOUT });
}

export async function injectToken(page: Page, token: string): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem("cloudcanvas_auth_token", t);
  }, token);
}

export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() =>
    localStorage.removeItem("cloudcanvas_auth_token")
  );
}
