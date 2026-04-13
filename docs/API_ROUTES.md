# API Routes

All routes live under `src/app/api/`. Auth is JWT (Bearer) via `authenticateRequest()` / `requireAdmin()` in `src/lib/middleware.ts`.

## Authentication

### `POST /api/auth/login`

- **Auth**: none
- **Body**: `{ email, password }`
- **Response**: `{ success, data?: { token, user }, error? }`

### `POST /api/auth/register`

- **Auth**: none (gated by `REGISTRATION_ENABLED` feature flag)
- **Body**: `{ email, name, password }`
- **Response**: `{ success, data?: { token, user }, error? }`

### `POST /api/auth/logout`

- **Auth**: none (client-side token removal)
- **Response**: `{ success, message }`

## Services

### `GET /api/services`

- **Auth**: none
- **Query**: `category` (optional) — filter to a single category
- **Response**:
  - Without `category`: `{ success, data: ServicesByCategory[] }`
  - With `category`: `{ success, data: AwsService[] }`
- Backed by `cached-data.ts` (`unstable_cache`, 300s TTL, tag-based revalidation).

### `GET /api/services/id/[id]`

- **Auth**: none
- **Response**: `{ success, data?: AwsService, error? }`

### `PUT /api/services/id/[id]`

- **Auth**: Admin
- **Body**: partial `AwsService` update (includes `markdownContent`)
- **Response**: `{ success, data?: AwsService, error? }`
- Calls `revalidatePath()` after update.

### `GET /api/services/stats`

- **Auth**: none
- **Response**: `{ success, data: { totalServices, availableServices } }`

## Admin

All admin routes require a valid JWT with `isAdmin: true`.

### `GET /api/admin/backup`

Export all services as JSON for download.

### `POST /api/admin/restore`

Upload a backup JSON. Diffs against the current DB and creates/updates/deletes services to match. Handles icon path migration (`/aws/` → `/images/aws/`).

### `POST /api/admin/seed-icons`

Upload the AWS Architecture Icons ZIP. Extracts 64px SVGs, uploads to S3, and creates service + category rows (new services default to `enabled: false`).

### `POST /api/admin/clear`

Delete all services from DynamoDB.

## Conventions

- Responses follow `{ success: boolean, data?: T, error?: string }`.
- Read endpoints set `Cache-Control` headers; mutations call `revalidatePath()` / `revalidateTag()`.
- Server components call `ServicesDb` directly — they do not HTTP-fetch internal API routes.
