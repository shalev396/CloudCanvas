# CloudCanvas Backend API Tests (Postman)

[← Back to main README](../README.md)

Run these against a local Next.js dev server or the live QA API. API tests use the **Postman CLI** or the Postman desktop app. For frontend E2E tests (Playwright), see [tests/README.md](../tests/README.md).

## Import

1. **Collection**: Import `postman/collections/CloudCanvas API` (V3 folder format).
2. **Environments**: Import `postman/environments/CloudCanvas Local.environment.yaml` and `postman/environments/CloudCanvas QA.environment.yaml`.

## What to Change Before Running

### 1. Environment — Base URL

| File | Variable | Template value | Change to |
| --- | --- | --- | --- |
| `postman/environments/CloudCanvas QA.environment.yaml` | `baseUrl` | `https://qa.cloudcanvas.shalev396.com/api` | `https://qa.yourdomain.com/api` |

For the active environment, `baseUrl` should be:

- **Local**: `http://localhost:3000/api` (run `npm run dev` from repo root first)
- **QA**: Your QA API URL, e.g. `https://qa.yourdomain.com/api`

### 2. Admin Credentials

The collection logs in as a preset admin. Set these in the environment (or via `--env-var` on the CLI):

| Variable | Purpose |
| --- | --- |
| `testAdminEmail` | Admin email (Local defaults to `qa-admin@cloudcanvas.test`) |
| `testAdminPassword` | Admin password (Local defaults to `qa-admin-password-1234`) |

For QA, both are blank in the committed env file — inject them from CI secrets (see `.github/workflows/_test-local.yml`).

### 3. Tokens

`idToken` is set automatically by **Setup / 2. Login** — leave it blank. If you run individual requests out of order, re-run Setup first or paste a token manually.

## CLI Commands

From repo root:

```bash
npm run test:api:dev   # Against http://localhost:3000/api (uses Local env file)
npm run test:api:qa    # Against QA baseUrl from CloudCanvas QA.environment.yaml
```

CI overrides `baseUrl` and admin creds per-run via `--env-var`:

```bash
npx postman collection run "./postman/collections/CloudCanvas API" \
  --environment "./postman/environments/CloudCanvas QA.environment.yaml" \
  --env-var "baseUrl=https://qa.yourdomain.com/api" \
  --env-var "testAdminEmail=..." \
  --env-var "testAdminPassword=..."
```

## Collection Structure

The collection runs sequentially in this order. Request order is set via the `order` field in each YAML and groups ascend: Setup (1000) → Auth (2000) → Services (3000) → Admin (4000).

### 1. Setup (2 requests)

Provisions a known state: resets the users table and seeds a test admin, then logs in and saves `idToken` for the rest of the run.

| Request | Endpoint | Purpose |
| --- | --- | --- |
| 1. Reset Database | `POST /dev/reset` | Scope `users`, seeds admin from `testAdminEmail` / `testAdminPassword`. Requires `ENV` to be `dev` or `qa` on the server — prod returns 403. |
| 2. Login (saves idToken) | `POST /auth/login` | Stores `idToken` in collection + environment variables for later Admin requests. |

### 2. Auth (8 requests)

Endpoint coverage for `/auth/login`, `/auth/logout`, and `/auth/register`:

| Folder | Endpoint | Requests |
| --- | --- | --- |
| **Login** | `POST /auth/login` | 5 (valid credentials, missing email, missing password, unknown email, wrong password) |
| **Logout** | `POST /auth/logout` | 2 (no auth → 200, with bearer → 200 — logout is intentionally permissive today) |
| **Register** | `POST /auth/register` | 1 (registration is globally disabled — always 403) |

### 3. Services (5 requests)

Read-only endpoints plus one auth check:

| Endpoint | Requests |
| --- | --- |
| `GET /services` | 1 (returns grouped services, saves first enabled service into `testServiceId`, `testServiceCategory`, `testServiceSlug`) |
| `GET /services/stats` | 1 (total + available counts) |
| `GET /services/id/{id}` | 2 (valid id from Setup, unknown id → 404) |
| `PUT /services/id/{id}` | 1 (no auth → 401 / 403) |

### 4. Admin (3 requests)

Auth-gated endpoints — uses `idToken` saved by Setup:

| Endpoint | Requests |
| --- | --- |
| `GET /admin/backup` | 2 (admin → 200 with `services[]` array; no auth → 401/403) |
| `POST /admin/clear` | 1 (no auth → 401/403) |

## Total: 18 requests

- Setup: 2
- Auth: 8
- Services: 5
- Admin: 3

The admin seeded in Setup is cleaned up by the **next** run's `POST /dev/reset` (scope: users), so runs are independent.

---

## Response Shape

All responses use a consistent envelope determined by the server, not the HTTP body wrapper:

- **Success**: `{ "success": true, "data": T }`
- **Error**: `{ "success": false, "error": "string" }`

HTTP status codes are the primary signal; tests assert both the code and the body. Only `GET /admin/backup` returns the raw backup JSON (`{ services: [...] }`) without the envelope so that it can be downloaded directly.

## Auth Middleware

All `/admin/*` mutations use `requireAdmin()` from [`src/lib/middleware.ts`](../src/lib/middleware.ts). A missing/invalid bearer token returns 401; a non-admin token returns 403. The tests treat both as acceptable in the `no auth` negative cases (`[401, 403]`) because behavior differs depending on whether the token is missing, malformed, or valid-but-not-admin.

`POST /auth/logout` is intentionally permissive — it exists for parity with future server-side session revocation but today just returns `{ success: true }` regardless of the Authorization header. The two Logout requests document that behavior so a future change is caught by CI.

---

## Coverage Notes

- **`POST /api/admin/restore`** — Requires a multipart JSON upload; no happy-path test yet. Manual-only.
- **`POST /api/admin/seed-icons`** — Same as restore; needs a large AWS-icons ZIP. Manual-only.
- **`POST /api/admin/clear` happy-path** — Only the 401/403 case is covered. A positive test would wipe the services table mid-run, which is intentionally avoided — use `POST /api/dev/reset { scope: "all" }` from the Setup flow if you need a clean services table.
- **`PUT /api/services/id/{id}` happy-path** — Only the 401 case is tested. Add an admin-authed update (with restore) when service edits become business-critical.
