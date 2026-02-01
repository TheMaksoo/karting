# ADR-008: API Versioning Strategy

## Status

**Accepted**

## Date

2025-01-10

## Context

As the Karting Dashboard API evolves, we need a strategy for:

- Making breaking changes without disrupting existing clients
- Supporting multiple API versions simultaneously
- Clear deprecation paths
- Mobile app compatibility (future)

## Decision

We implement **URL-based API versioning** with backward-compatible defaults.

### Implementation

```php
// routes/api.php

// Current version (v1) - default
Route::prefix('v1')->group(function () {
    Route::apiResource('drivers', DriverController::class);
    Route::apiResource('tracks', TrackController::class);
    // ...
});

// Unversioned routes redirect to latest (backward compatibility)
Route::get('/drivers', function () {
    return redirect('/api/v1/drivers');
});

// Future v2
Route::prefix('v2')->group(function () {
    // New endpoints with breaking changes
});
```

### Versioning Rules

1. **Non-breaking changes** (no version bump):
   - Adding new optional fields to responses
   - Adding new endpoints
   - Adding new optional query parameters
   - Performance improvements

2. **Breaking changes** (require version bump):
   - Removing fields from responses
   - Changing field types
   - Changing authentication methods
   - Removing endpoints
   - Changing required parameters

### Deprecation Process

```
1. Announce deprecation (3 months notice)
2. Add `Deprecation` header to responses
3. Log usage of deprecated endpoints
4. Remove in next major version
```

### Reasons

1. **URL-based**: Clear, visible versioning in URLs. Easy to test and document.

2. **Backward Compatible**: Unversioned endpoints work (redirect to latest).

3. **Simple**: No header negotiation complexity.

4. **Mobile Friendly**: Apps can pin to specific version.

## Alternatives Considered

### Option 1: Header-based Versioning
```
Accept: application/vnd.karting.v1+json
```
- **Pros**: Clean URLs, REST purist approach
- **Cons**: Harder to test, less visible, curl complexity

### Option 2: Query Parameter
```
/api/drivers?version=1
```
- **Pros**: Easy to add to existing URLs
- **Cons**: Can be forgotten, caching issues

### Option 3: No Versioning
- **Pros**: Simple, less maintenance
- **Cons**: Breaking changes break all clients

## Consequences

### Positive
- Clear version in every request
- Easy to route to different controllers
- Swagger docs per version
- Mobile apps can use stable version

### Negative
- URL pollution (`/api/v1/...`)
- Need to maintain multiple versions
- Code duplication between versions

### Neutral
- Semantic versioning for API (v1, v2)
- Deprecation headers for sunset endpoints

## API Response Headers

```http
HTTP/1.1 200 OK
X-API-Version: 1.0
Deprecation: Sun, 01 Jan 2027 00:00:00 GMT  # If deprecated
Sunset: Sun, 01 Jul 2027 00:00:00 GMT       # Removal date
Link: </api/v2/drivers>; rel="successor-version"
```

## References

- [API Versioning Best Practices](https://www.baeldung.com/rest-versioning)
- [Microsoft REST Guidelines](https://github.com/microsoft/api-guidelines)
- [Stripe API Versioning](https://stripe.com/docs/api/versioning)
