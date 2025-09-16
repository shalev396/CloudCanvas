# API Routes Documentation

## Authentication Routes

### POST /api/auth/login

**Purpose**: Authenticate user and return JWT token
**Authentication**: None required
**Body**: `{ email: string, password: string }`
**Response**: `{ success: boolean, data?: { token: string, user: object }, error?: string }`

### POST /api/auth/logout

**Purpose**: Logout endpoint (client-side token removal)
**Authentication**: None required
**Response**: `{ success: boolean, message: string }`

## Service Routes

### GET /api/services

**Purpose**: Get all services grouped by category OR get services for a specific category
**Authentication**: None required
**Query Parameters**:

- `category` (optional): Filter by specific category
  **Response**:
- Without category: `{ success: boolean, data: ServicesByCategory[] }`
- With category: `{ success: boolean, data: AwsService[] }`

### GET /api/services/id/[id]

**Purpose**: Get a single service by its ID
**Authentication**: None required
**Parameters**: `id` - service ID
**Response**: `{ success: boolean, data?: AwsService, error?: string }`

### PUT /api/services/id/[id]

**Purpose**: Update a service by its ID
**Authentication**: Admin required
**Parameters**: `id` - service ID
**Body**: Service update data
**Response**: `{ success: boolean, data?: AwsService, error?: string }`

## Route Analysis

### Route Consolidation

- ✅ **Removed**: `/api/services/[slug]` routes (unused)
- ✅ **Kept**: `/api/services/id/[id]` routes (actively used by client)
- **Rationale**: ID-based routes are more direct and don't require slug lookup

### Current Usage Patterns

- **Service Page Rendering**: Uses API call to `/api/services?category=X` then filters by slug
- **Service Updates**: Uses PUT to `/api/services/id/[id]`
- **Individual Service Fetch**: Falls back to direct DB query if API fails

### Issues Identified & Root Cause Analysis

#### Primary Issue: Server Component Self-Fetching

The service page (`[category]/[service]/page.tsx`) makes HTTP requests to its own API routes in server components, which causes several problems:

1. **Base URL Construction Fails in Production**:

   - Development: `http://localhost:3000` ✅
   - Production: Relies on `process.env.VERCEL_URL` which may be undefined → empty string → fetch fails

2. **Next.js App Router Caching**:

   - Server components are aggressively cached
   - No revalidation strategy after updates
   - Stale data served on refresh

3. **Inconsistent Data Flow**:
   - **Save**: `PUT /api/services/id/{id}` (updates by ID)
   - **Fetch**: `GET /api/services?category={category}` + slug filtering
   - **Problem**: Cache invalidation doesn't affect the category-based fetch

#### When User Edits & Saves:

1. Client calls `PUT /api/services/id/{id}` ✅ (works fine)
2. User refreshes page
3. Server component calls `GET /api/services?category={category}`
4. In production: baseUrl is empty → fetch fails → falls back to direct DB ❌
5. OR: fetch succeeds but cache is stale ❌

#### Solution Strategy:

1. ✅ Remove HTTP self-fetching in server components
2. ✅ Use direct database calls in server components
3. ✅ Add proper cache revalidation
4. ✅ Consolidate duplicate routes

#### Implemented Fixes:

1. **Server Component Fix**: Replaced HTTP self-fetching with direct `ServicesDb.getServicesByCategory()` calls
2. **Cache Revalidation**: Added `revalidatePath()` calls after service updates + `revalidate = 60` export
3. **Route Cleanup**: Removed unused `/api/services/[slug]` routes
4. **Cache Headers**: Added appropriate `Cache-Control` headers to API responses
5. **Production Stability**: Eliminated problematic base URL construction that failed in production
