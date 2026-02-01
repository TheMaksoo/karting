# ADR-003: Use Laravel Sanctum for Authentication

## Status

**Accepted**

## Date

2024-01-20

## Context

The Karting Dashboard needs authentication for:

- User login/logout
- API authentication for SPA
- Token-based authentication for potential mobile apps
- Rate limiting per user
- Session management

We needed to choose between various authentication strategies.

## Decision

We chose **Laravel Sanctum** for SPA authentication with token-based API access.

### Implementation Details

```php
// Token expiration: 24 hours
'expiration' => 60 * 24,

// Rate limiting on login
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // API routes
});
```

### Reasons

1. **SPA Authentication**: Sanctum provides cookie-based authentication for SPAs on the same domain, solving CSRF issues elegantly.

2. **API Tokens**: Simple token-based authentication for mobile apps or third-party integrations.

3. **Laravel Integration**: First-party package, well-maintained, follows Laravel conventions.

4. **Lightweight**: No OAuth complexity when not needed, simpler than Passport.

5. **Security Features**:
   - Token abilities (permissions)
   - Token expiration
   - Token revocation
   - Rate limiting integration

## Alternatives Considered

### Option 1: Laravel Passport
- **Pros**: Full OAuth2 implementation, good for third-party apps
- **Cons**: Overkill for SPA, more complex setup, larger footprint

### Option 2: JWT (tymon/jwt-auth)
- **Pros**: Stateless, industry standard
- **Cons**: Token revocation complexity, not officially maintained by Laravel

### Option 3: Session-only Authentication
- **Pros**: Simple, built into Laravel
- **Cons**: No API token support, doesn't scale for mobile apps

## Consequences

### Positive
- Simple SPA authentication with cookies
- API tokens for future mobile app
- Built-in CSRF protection
- Easy token management (create, revoke, list)
- Works with Laravel's rate limiting

### Negative
- Cookies require same-domain or subdomain for SPA
- Tokens stored in database (not stateless)
- Limited OAuth2 support if needed later

### Neutral
- Requires `sanctum` middleware on API routes
- Token abilities need manual implementation for fine-grained permissions

## Security Configuration

```php
// config/sanctum.php
'expiration' => 60 * 24, // 24 hours

// Password requirements (AppServiceProvider)
Password::defaults(function () {
    return Password::min(8)
        ->mixedCase()
        ->numbers()
        ->symbols();
});

// Brute-force protection
'throttle:5,1' // 5 attempts per minute on login
```

## References

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [SPA Authentication](https://laravel.com/docs/sanctum#spa-authentication)
- [API Token Authentication](https://laravel.com/docs/sanctum#api-token-authentication)
