import { expect, test } from "@playwright/test";
import { BASE_URL } from "../../config";
import { fetchServiceGroups } from "../../helpers/api";

// Locally we don't host /images/* from the Next.js public folder; they live
// behind the stage's CloudFront distribution. CUSTOM_DOMAIN is injected by
// _test-local.yml from the selected GitHub environment's secrets, so dev/qa
// each hit their own CDN.
const CDN_ORIGIN = process.env.CUSTOM_DOMAIN
  ? `https://${process.env.CUSTOM_DOMAIN}`
  : "";

function isLocalBase(base: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(base);
}
function resolveIconUrl(iconPath: string, base: string): string {
  if (iconPath.startsWith("http")) return iconPath;
  if (iconPath.startsWith("/images/") && isLocalBase(base)) {
    if (!CDN_ORIGIN) {
      throw new Error(
        "CUSTOM_DOMAIN env var is required to resolve /images/* when testing against localhost"
      );
    }
    return `${CDN_ORIGIN}${iconPath}`;
  }
  return `${base}${iconPath}`;
}

test.describe("icons — smoke", () => {
  test("every service icon resolves with image content-type", async ({
    request,
  }) => {
    test.setTimeout(180_000);
    const groups = await fetchServiceGroups(request);
    const services = groups.flatMap((g) => g.services ?? []);
    expect(services.length).toBeGreaterThan(0);

    const checkOne = async (
      service: (typeof services)[number]
    ): Promise<string | null> => {
      if (!service.iconPath) return `${service.name}: missing iconPath`;
      const url = resolveIconUrl(service.iconPath, BASE_URL);
      const res = await request.fetch(url, { method: "HEAD" });
      if (!res.ok()) return `${service.name} (${url}): HTTP ${res.status()}`;
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.startsWith("image/")) {
        return `${service.name} (${url}): content-type ${ct || "<none>"}`;
      }
      return null;
    };

    const CONCURRENCY = 20;
    const failures: string[] = [];
    for (let i = 0; i < services.length; i += CONCURRENCY) {
      const batch = services.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(checkOne));
      for (const r of results) if (r) failures.push(r);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
});
