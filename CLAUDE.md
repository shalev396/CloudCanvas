# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CloudCanvas is an interactive AWS Cloud Practitioner study notebook. Users browse AWS services organized by category, read descriptions, and add personal markdown notes. The frontend deploys to Vercel; all database and storage infrastructure lives on AWS managed via CloudFormation.

All infrastructure is managed via `cloudformation.yml` (DynamoDB, S3, CloudFront, IAM role).

## Commands

```bash
npm run dev              # Hot-reload Next.js with .env.development
npm run qa               # Hot-reload Next.js with .env.qa
npm run prod             # Hot-reload Next.js with .env.production
npm run build            # Production build (Turbopack)
npm run start            # Serve production build
npm run lint             # ESLint
npm run deploy:dev       # Deploy CloudFormation stack (dev)
npm run deploy:qa        # Deploy CloudFormation stack (qa)
npm run deploy:prod      # Deploy CloudFormation stack (prod)
npm run test:dev         # Run Postman + Playwright against a `npm run dev` server
npm run test:qa          # Run Postman + Playwright against a `npm run qa` server
```

Tests run against `http://localhost:3000`. Start `npm run <stage>` in one terminal, `npm run test:<stage>` in another. CI uses the same commands — see `.github/workflows/_test-local.yml`.

## Architecture

### Data flow

```
Browser → Vercel (Next.js 15 App Router) → DynamoDB (3 tables) + S3 (icons via CloudFront)
```

### Infrastructure (CloudFormation)

- **3 DynamoDB tables:** `cloudcanvas-services-{stage}`, `cloudcanvas-users-{stage}`, `cloudcanvas-categories-{stage}` (all PAY_PER_REQUEST with PITR)
- **S3 bucket:** `cloudcanvas-images-{stage}` for SVG icons, fronted by CloudFront with OAC
- **CloudFront:** Routes `/images/*` to S3 (cached), everything else to Vercel (uncached)
- **Vercel OIDC:** IAM role assumed via OIDC provider — no static AWS credentials in production

### Key source paths

- `src/lib/dynamodb.ts` — Database layer: `ServicesDb`, `UsersDb`, `CategoriesDb`, `BatchOperations`
- `src/lib/s3.ts` — S3 icon upload/download/list
- `src/lib/service-generator.ts` — Parses AWS architecture icons ZIP filenames into service records
- `src/lib/cached-data.ts` — Next.js `unstable_cache` wrappers (300s TTL, tag-based revalidation)
- `src/lib/auth-server.ts` / `auth-client.ts` — JWT (7-day) + bcrypt auth
- `src/lib/middleware.ts` — `authenticateRequest()` / `requireAdmin()` for API routes
- `src/lib/categories.ts` — Cloud provider definitions (only AWS enabled)
- `src/lib/types.ts` — All TypeScript interfaces (`AwsService`, `User`, `CategoryConfig`, etc.)

### API routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/services` | - | All services grouped by category |
| GET | `/api/services/id/[id]` | - | Single service |
| PUT | `/api/services/id/[id]` | Admin | Update service |
| GET | `/api/services/stats` | - | Service counts |
| GET | `/api/admin/backup` | Admin | Export all services as JSON |
| POST | `/api/admin/restore` | Admin | Restore from backup JSON |
| POST | `/api/admin/seed-icons` | Admin | Process AWS icons ZIP → S3 + DB |
| POST | `/api/admin/clear` | Admin | Delete all services |

### Admin workflow (seed + restore)

1. **Seed from icons:** Upload AWS Architecture Icons ZIP → extracts 64px SVGs → uploads to S3 → creates service/category DB records
2. **Restore from backup:** Upload JSON → compares with current DB → creates/updates/deletes to match backup (handles icon path migration `/aws/` → `/images/aws/`)

### UI stack

- shadcn/ui (new-york style, Radix primitives, Lucide icons)
- Tailwind CSS 4 with CSS variables
- next-themes for dark/light mode
- marked for markdown rendering

## Conventions

- Zero npm audit vulnerabilities — do not introduce vulnerable dependencies
- Do not commit `.env` files or secrets
- Services default to `enabled: false` when created via seed
- Icon paths follow: `/images/aws/Architecture-Service/{CategoryFolder}/{icon}.svg`
- Path alias: `@/*` maps to `./src/*`
