# CloudCanvas Frontend E2E Tests (Playwright)

[← Back to main README](../README.md)

Run these against a local Next.js dev server or the live QA URL. Tests run in Chromium via Playwright and cover **smoke, accessibility, visual, responsive, security**, and **cross-page flows** — the same matrix the Elytra template uses. For backend API tests (Postman), see [postman/README.md](../postman/README.md).

---

## Run Locally

**One-time setup** (from repo root):

```bash
npm install
```

That's it — Chromium downloads automatically via `postinstall`. No separate `test:install` step. See [SETUP.md](../SETUP.md) for env-file setup.

**Before every local dev test run**, start the Next.js server in a separate terminal:

```bash
npm run dev      # http://localhost:3000
```

The server talks to real DynamoDB tables (local dev uses `~/.aws/credentials` against `cloudcanvas-*-dev`).

**Run tests** (from repo root):

```bash
npm run test:react:dev   # vs local dev server (localhost:3000)
npm run test:react:qa    # vs QA URL from .env.qa
```

`test:react:dev` uses `BASE_URL=http://localhost:3000` and `API_BASE_URL=http://localhost:3000/api` by default. `test:react:qa` loads `.env.qa` via `dotenv-cli`, so make sure that file sets `BASE_URL` and optionally `API_BASE_URL` (see [SETUP.md](../SETUP.md#2-env-files)).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run test:react:dev` | Run all E2E tests against the local dev server |
| `npm run test:react:qa` | Run all E2E tests against QA — loads URL + creds from `.env.qa` |
| `npm run seed:test-admin` | Manually seed the QA test admin (only if `/api/dev/reset` is unavailable) |

### URLs and Environment Variables

Tests read these from [`tests/config.ts`](config.ts):

| Variable | Default (local) | Purpose |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:3000` | Frontend URL |
| `API_BASE_URL` | `${BASE_URL}/api` | API base (derived if unset) |
| `TEST_ADMIN_EMAIL` | `qa-admin@cloudcanvas.test` | Admin seeded by global-setup |
| `TEST_ADMIN_PASSWORD` | `qa-admin-password-1234` | Admin password |

In CI ([`.github/workflows/_test-local.yml`](../.github/workflows/_test-local.yml)), these come from repo / environment secrets. For manual QA runs locally, put the same values in `.env.qa` — see [SETUP.md](../SETUP.md#2-env-files).

---

## Global Setup

Before any test runs, [`tests/global-setup.ts`](global-setup.ts) calls `POST /api/dev/reset` to wipe the **users** table and seed a known admin (`TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`). This keeps runs deterministic regardless of prior state.

- `/api/dev/reset` is gated by `ENV === "dev" | "qa"` on the server — prod returns 403 and setup skips with a warning.
- Scope is `users` only; services and categories are left intact so icon and service-detail tests have data to exercise.

---

## Page × Test Category Matrix

| Page | Route | Smoke | Accessibility | Visual | Responsive | Security |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Service detail | `/[category]/[service]` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Login dialog | `/` (dialog) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | `/admin` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Icons (asset check) | `/images/aws/...` | ✓ | — | — | — | — |
| Flows | cross-page | — | — | — | — | — |

Cross-page flows live in [`tests/e2e/flows/critical.spec.ts`](e2e/flows/critical.spec.ts).

---

## Test Categories

- **Smoke** — Page loads, critical elements visible, key routes reachable (`/`, service detail, `/admin` access-denied vs admin controls, login dialog fields, login success/failure).
- **Accessibility** — `@axe-core/playwright` scans every page with `wcag2a / wcag2aa / wcag21a / wcag21aa` tags; authenticated variants where state affects the DOM (`/admin`, login dialog open).
- **Visual** — Page loads at 1440×900 and key landmarks render. No pixel-perfect comparison (add baselines later if visual regressions become a real problem).
- **Responsive** — Key content is visible at 7 viewports (320 → 2560): `mobile_small`, `mobile_mid`, `mobile_large`, `tablet`, `laptop`, `laptop_large`, `desktop`. Tests fail if `document.documentElement.scrollWidth > clientWidth` (horizontal overflow).
- **Security** — Password inputs are masked; no JWT-like strings leak into the visible DOM or `document.cookie`; login `Set-Cookie` does not contain the JWT; unknown routes return 404 without leaking stack traces; admin API rejects missing/invalid bearer tokens.
- **Icons (asset check)** — HEAD-fetches every `iconPath` from `GET /api/services` and asserts 2xx + `content-type: image/*`. Catches broken CloudFront paths, missing S3 objects, and stale icon paths after a restore.
- **Flows (critical.spec.ts)** — Cross-page journeys: login → `/admin` → backup endpoint; anonymous browse → service detail; login → logout clears token and restores Login button; `POST /auth/logout` always returns 200.

---

## Folder Structure

Aligned with `src/app/` routes — each page gets its own folder, and each folder contains one spec per category.

```
tests/
  config.ts              # BASE_URL, API_BASE_URL, timeouts, test admin creds
  global-setup.ts        # Resets users + seeds admin before the suite
  helpers/
    api.ts               # fetchServiceGroups, pickEnabledService, loginAdmin
    auth.ts              # openLoginDialog, loginViaDialog, logoutViaMenu
    viewports.ts         # 7 viewport presets (320 → 2560)
    responsive.ts        # assertNoHorizontalOverflow
  e2e/
    home/                # /
      smoke.spec.ts
      accessibility.spec.ts
      visual.spec.ts
      responsive.spec.ts
      security.spec.ts
    service-detail/      # /[category]/[service]
      smoke.spec.ts
      accessibility.spec.ts
      visual.spec.ts
      responsive.spec.ts
      security.spec.ts
    login/               # Sign-in dialog (launched from /)
      smoke.spec.ts
      accessibility.spec.ts
      visual.spec.ts
      responsive.spec.ts
      security.spec.ts
    admin/               # /admin
      smoke.spec.ts
      accessibility.spec.ts
      visual.spec.ts
      responsive.spec.ts
      security.spec.ts
    icons/               # All service icons resolve
      smoke.spec.ts
    flows/
      critical.spec.ts   # Cross-page: login, admin, anonymous browse, logout
```

---

## Flows (critical.spec.ts)

| Flow | What it tests |
| --- | --- |
| `login → /admin shows controls → backup endpoint returns JSON` | Login via dialog → navigate to `/admin` → verify panel headings → call `GET /api/admin/backup` with the bearer token → assert JSON shape |
| `anonymous flow — browse home → service detail works without login` | Anonymous user lands on `/` → opens a random enabled service's detail page → sees the correct heading |
| `login → logout flow clears token and restores Login button` | Login → token present in `localStorage` → open avatar menu → Log out → token removed → navbar shows `Login` again |
| `logout endpoint returns 200 regardless of auth state` | `POST /api/auth/logout` is intentionally permissive; assert 200 + `{ success: true }` |

---

## Failure Reporting

On any failing test, Playwright writes artifacts to `artifacts/`:

- **`artifacts/report/index.html`** — Full HTML report: every test, every status, grouped by file, with embedded screenshots / traces / videos. Open in a browser.
- **`artifacts/test-results/<test>/`** — Per-test folder containing:
  - `test-failed-*.png` — screenshot at point of failure (`screenshot: "only-on-failure"`)
  - `trace.zip` — Playwright trace for retained failures (`trace: "retain-on-failure"`) — open with `npx playwright show-trace trace.zip` for a timeline with DOM snapshots, network logs, and console output
  - `video.webm` — video of the failed run (`video: "retain-on-failure"`)

In CI, `_test-local.yml` uploads the entire `artifacts/` folder as a workflow artifact on any outcome (`if: always()`), so you can download the HTML report + screenshots + traces from any failed Playwright run. Postman failures are shown in the job log (no separate artifact).

To rerun a single spec: `npx playwright test tests/e2e/admin/smoke.spec.ts`. Add `--headed --debug` to step through the browser interactively.

---

## Coverage Notes

- **Registration** — Globally disabled (`REGISTRATION_ENABLED = false`). Tests assert `POST /api/auth/register` returns 403 and the dialog's "Need an account? Sign up" toggle is hidden.
- **Admin mutations** — `restore`, `seed-icons`, and `clear` are exercised for auth rejection only. Happy-path tests would mutate the DB mid-run, so they're left to manual QA.
- **Theme toggle** — Not under test. Add one if we start theming pages differently (right now both themes share the same DOM).
