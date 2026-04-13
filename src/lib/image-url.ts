// CloudFront serves `/images/*` to S3 in production. Locally there's no
// CloudFront, so rewrite those paths to hit the dev CloudFront directly.
// Paths that don't start with `/images/` (e.g. assets in /public) are
// returned unchanged.

const DEV_CDN_ORIGIN = "https://dev.cloudcanvas.shalev396.com";

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
  return `${DEV_CDN_ORIGIN}${path}`;
}
