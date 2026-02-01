# API Versioning Guide

## Overview

The Karting Dashboard API supports versioning to allow breaking changes while maintaining backward compatibility for existing clients.

## Current Versions

- **Latest (unversioned)**: `/api/*` - Current development version
- **v1**: `/api/v1/*` - Stable production version

## Configuration

### Backend (Laravel)

API versioning is configured in `bootstrap/app.php`:

```php
Route::prefix('api/v1')
    ->middleware('api')
    ->group(base_path('routes/api_v1.php'));
```

Routes are defined in:
- `routes/api.php` - Latest/unversioned API
- `routes/api_v1.php` - Version 1 API

### Frontend (Vue/TypeScript)

API versioning is configured in `frontend/src/config/api.ts`:

```typescript
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  version: 'v1', // Change to use different versions
  useVersioning: true,
}
```

## Usage

### Frontend API Calls

All API calls automatically use the configured version:

```typescript
// Automatically calls /api/v1/drivers
const drivers = await api.getDrivers()

// Automatically calls /api/v1/sessions
const sessions = await api.getSessions()
```

### Direct HTTP Calls

```bash
# Version 1 API
curl http://localhost:8000/api/v1/drivers

# Latest/unversioned API
curl http://localhost:8000/api/drivers
```

## Switching Versions

### Frontend

Update `frontend/src/config/api.ts`:

```typescript
export const API_CONFIG = {
  version: 'v2', // Switch to v2
  // or
  version: '', // Use latest/unversioned
  // or
  useVersioning: false, // Disable versioning
}
```

### Testing Multiple Versions

You can create environment-specific configurations:

```bash
# .env.production
VITE_API_BASE_URL=https://api.karting.com/api
VITE_API_VERSION=v1

# .env.development  
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_VERSION= # Use latest
```

## Adding New Versions

### 1. Create New Route File

```bash
cd portal/backend/routes
cp api_v1.php api_v2.php
```

### 2. Register in Bootstrap

Edit `bootstrap/app.php`:

```php
Route::prefix('api/v2')
    ->middleware('api')
    ->group(base_path('routes/api_v2.php'));
```

### 3. Update API Configuration

Add to `frontend/src/config/api.ts`:

```typescript
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2', // New version
  LATEST: '',
} as const
```

## Version Strategy

### When to Create a New Version

Create a new API version when introducing:
- ✅ Breaking changes to request/response formats
- ✅ Removal of endpoints
- ✅ Changes to authentication mechanisms
- ✅ Major data structure changes

### What Doesn't Require a New Version

- ✅ Adding new endpoints
- ✅ Adding optional fields to responses
- ✅ Adding optional parameters to requests
- ✅ Bug fixes
- ✅ Performance improvements

## Migration Path

### Example: Migrating from Unversioned to v1

1. **Update frontend configuration**:
```typescript
// Before
baseURL: 'http://localhost:8000/api'

// After
baseURL: 'http://localhost:8000/api'
version: 'v1'
useVersioning: true
```

2. **Update environment variables**:
```bash
VITE_API_BASE_URL=http://localhost:8000/api
# Version is now handled by config
```

3. **Test all endpoints**:
```bash
cd portal/frontend
npm run test
```

## Health Checks

Health check endpoints remain unversioned:
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status
- `/api/health/ready` - Readiness probe
- `/api/health/live` - Liveness probe

## Best Practices

1. **Version Headers**: Consider adding version info to response headers:
```php
response()->json($data)->header('X-API-Version', 'v1');
```

2. **Deprecation Warnings**: Add deprecation headers to old versions:
```php
response()->json($data)->header('X-API-Deprecated', 'true')
    ->header('X-API-Sunset-Date', '2026-12-31');
```

3. **Documentation**: Always document breaking changes in CHANGELOG.md

4. **Testing**: Maintain separate test suites for each version

## Current Version Support

| Version | Status | Support Until | Notes |
|---------|--------|---------------|-------|
| Latest  | ✅ Active | - | Development version |
| v1      | ✅ Active | TBD | First stable version |

## Troubleshooting

### Issue: Calls going to wrong version

**Solution**: Check `API_CONFIG.version` in `frontend/src/config/api.ts`

### Issue: 404 on versioned endpoints

**Solution**: Verify route is defined in correct version file (e.g., `routes/api_v1.php`)

### Issue: Mixed version calls

**Solution**: Ensure all API calls use the ApiService class, not direct axios calls

## Examples

### Complete Request Flow

```
1. Frontend: api.getDrivers()
2. Config: version = 'v1', useVersioning = true
3. Interceptor: Adds 'v1/' prefix to URL
4. Request: GET /api/v1/drivers
5. Laravel: Routes to api_v1.php
6. Response: Returns driver data with version headers
```

### Testing Different Versions

```typescript
import { API_CONFIG } from '@/config/api'

// Temporarily switch version for testing
const originalVersion = API_CONFIG.version
API_CONFIG.version = 'v2'

// Test v2 endpoints
await api.getDrivers()

// Restore original version
API_CONFIG.version = originalVersion
```
