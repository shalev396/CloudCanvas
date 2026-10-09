// CloudFront serves `/images/*` to S3 in production. Locally there's no
// CloudFront, so rewrite those paths to hit the prod CDN directly (dev/qa
// require basic auth).
// Paths that don't start with `/images/` (e.g. assets in /public) are
// returned unchanged.

export const LOCAL_IMAGES_ORIGIN = "https://cloudcanvas.shalev396.com";

function isLocalhost(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }
  // SSR: match localhost when running `next dev`, so the first paint
  // uses the same URL the client will use (no hydration mismatch).
  return process.env.NODE_ENV === "development";
}

export function resolveImageUrl(path?: string | null): string {
  if (!path) return "";
  if (!path.startsWith("/images/")) return path;
  if (!isLocalhost()) return path;
  return `${LOCAL_IMAGES_ORIGIN}${path}`;
}
