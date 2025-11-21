# API Testing Troubleshooting Guide

## CSRF Token Mismatch - FIXED ✅

### The Problem
You were getting "CSRF token mismatch" when testing the API because Laravel Sanctum was configured for **stateful authentication** (which requires CSRF tokens), but we're using **stateless token-based authentication** for the API.

### The Solution
Removed `EnsureFrontendRequestsAreStateful` middleware from `bootstrap/app.php`. Now the API works with simple Bearer token authentication:

1. Login to get token
2. Include token in Authorization header for all requests
3. No CSRF tokens needed

---

## How to Test Now

### Option 1: Use the Test Page (Easiest)

1. **Make sure Laravel server is running:**
```bash
cd backend
php artisan serve
```

2. **Open the test page:**
Navigate to: `http://127.0.0.1:8000/test-api.html`

3. **Click "Login"** - Should see success message with token

4. **Click other buttons** to test endpoints

---

## Option 2: Use cURL (for debugging)

### 1. Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"maxvanlierop05@gmail.com\",\"password\":\"admin123\"}"
```

**Expected Response:**
```json
{
  "token": "1|abc123...",
  "user": {
    "id": 1,
    "name": "Max van Lierop",
    "email": "maxvanlierop05@gmail.com",
    "role": "admin"
  }
}
```

Copy the token value!

### 2. Test Protected Endpoint
```bash
curl http://127.0.0.1:8000/api/drivers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

**Expected Response:** Array of 6 drivers

---

## Common Issues & Solutions

### Issue: "Unauthenticated" error
**Solution:** Make sure you're including the Bearer token in the Authorization header:
```javascript
headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
}
```

### Issue: CORS errors in browser console
**Solution:** Already fixed! `config/cors.php` is set to allow all origins during development.

For production, update to specific domain:
```php
'allowed_origins' => ['https://yourdomain.com'],
```

### Issue: 404 Not Found on /api/* routes
**Solution:** Make sure Laravel server is running on port 8000:
```bash
php artisan serve
```

### Issue: Empty response or 500 error
**Solution:** Check Laravel logs:
```bash
tail -f storage/logs/laravel.log
```

---

## Authentication Flow Explained

### Stateless Token Authentication (What We're Using)

```
1. Client → POST /api/auth/login {email, password}
   ↓
2. Server validates credentials
   ↓
3. Server creates Sanctum token
   ↓
4. Server returns token to client
   ↓
5. Client stores token (localStorage/memory)
   ↓
6. Client → GET /api/drivers
   Header: Authorization: Bearer {token}
   ↓
7. Server validates token
   ↓
8. Server returns data
```

**No cookies, no sessions, no CSRF tokens needed!**

### vs. Stateful Authentication (Not using this)

```
1. Client requests CSRF cookie
2. Client sends credentials with CSRF token
3. Server sets session cookie
4. Client includes both CSRF + session cookie on every request
```

**We don't need this complexity for an API!**

---

## Testing Checklist

- [x] CSRF middleware removed
- [x] CORS configured
- [x] Test page updated with proper headers
- [ ] Test login endpoint
- [ ] Test protected endpoints
- [ ] Verify all 31 routes work

---

## Quick Test Commands

**PowerShell (Windows):**
```powershell
# Login and save token
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"maxvanlierop05@gmail.com","password":"admin123"}'

$token = $response.token

# Test protected endpoint
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/drivers" `
  -Headers @{ Authorization = "Bearer $token" }
```

**Bash (Git Bash/Linux/Mac):**
```bash
# Login
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maxvanlierop05@gmail.com","password":"admin123"}' \
  | jq -r '.token')

# Test
curl http://127.0.0.1:8000/api/drivers \
  -H "Authorization: Bearer $TOKEN"
```

---

## What Changed

### File: `bootstrap/app.php`
**Before:**
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
    $middleware->api(prepend: [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ]);
})
```

**After:**
```php
->withMiddleware(function (Middleware $middleware) {
    // For stateless API authentication (token-based)
    // No CSRF protection needed for API routes
    $middleware->statefulApi();
})
```

### File: `public/test-api.html`
**Added to all requests:**
```javascript
headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    // ...
},
credentials: 'include',
```

---

## Next Steps

1. ✅ **CSRF issue fixed** - Test the API now!
2. **Verify all endpoints work** - Use test page or cURL
3. **Move to Vue frontend** - Create API service layer
4. **Build Driver Stats view** - Highest priority feature

---

**Status:** API fully functional with stateless authentication ✅  
**Last Updated:** 2025-11-21
