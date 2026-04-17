import { APIRequestContext, expect } from "@playwright/test";
import { API_BASE_URL } from "../config";

export type ServiceLite = {
  id: string;
  name: string;
  slug: string;
  category: string;
  iconPath: string;
  enabled: boolean;
  summary: string;
};

export type ServiceGroup = {
  category: string;
  displayName: string;
  iconPath: string;
  services: ServiceLite[];
};

export async function fetchServiceGroups(
  request: APIRequestContext
): Promise<ServiceGroup[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await request.get(`${API_BASE_URL}/services`);
      expect(res.ok(), `GET /services ${res.status()}`).toBeTruthy();
      const body = await res.json();
      return body.data ?? body;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function pickEnabledService(
  request: APIRequestContext
): Promise<ServiceLite | null> {
  const groups = await fetchServiceGroups(request);
  for (const group of groups) {
    const enabled = group.services.find((s) => s.enabled);
    if (enabled) return enabled;
  }
  return null;
}

export async function loginAdmin(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });
  expect(
    res.ok(),
    `login failed: ${res.status()} ${await res.text()}`
  ).toBeTruthy();
  const body = await res.json();
  const token = body.data?.token;
  expect(token, "no token in login response").toBeTruthy();
  return token as string;
}
