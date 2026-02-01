# 🔒 Security Best Practices

Security guidelines and best practices for the Karting Dashboard.

## 🛡️ Authentication & Authorization

### Laravel Sanctum

The application uses Laravel Sanctum for API authentication:

#### Token Generation
```php
// Generate token with 24-hour expiration
$token = $user->createToken('auth-token', ['*'], now()->addHours(24));
```

#### Token Storage
- **Backend**: Stored in `personal_access_tokens` table
- **Frontend**: Stored in localStorage (consider httpOnly cookies for enhanced security)

#### Best Practices
- ✅ Tokens expire after 24 hours
- ✅ Use HTTPS in production
- ✅ Implement token refresh mechanism
- ⚠️ Consider moving to httpOnly cookies for XSS protection

### Password Security

#### Requirements
```php
// app/Http/Requests/RegisterRequest.php
'password' => [
    'required',
    'string',
    'min:8',
    'regex:/[a-z]/',      // At least one lowercase
    'regex:/[A-Z]/',      // At least one uppercase
    'regex:/[0-9]/',      // At least one number
    'regex:/[@$!%*#?&]/', // At least one special char
    'confirmed'
]
```

#### Password Hashing
- Uses bcrypt with cost factor 10
- Passwords are hashed before storage
- Never log or display passwords

```php
// Hash password
$hashedPassword = Hash::make($password);

// Verify password
Hash::check($plainPassword, $hashedPassword);
```

## 🚪 Rate Limiting

### API Rate Limits

```php
// routes/api.php

// Public routes (login/register)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [RegistrationController::class, 'register']);
});

// Authenticated routes
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // 60 requests per minute
});
```

### Custom Rate Limiting

```php
// app/Providers/RouteServiceProvider.php
RateLimiter::for('uploads', function (Request $request) {
    return Limit::perMinute(10)->by($request->user()->id);
});
```

## 🔐 Input Validation & Sanitization

### Form Request Validation

```php
// app/Http/Requests/StoreDriverRequest.php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:255', 'unique:drivers'],
        'color' => ['required', 'string', 'regex:/^#[0-9A-F]{6}$/i'],
        'is_active' => ['boolean'],
    ];
}
```

### Input Sanitization

```php
// app/Services/InputSanitizer.php
class InputSanitizer
{
    public function sanitize(string $input): string
    {
        // Remove HTML tags
        $cleaned = strip_tags($input);
        
        // Remove special characters
        $cleaned = preg_replace('/[^\p{L}\p{N}\s@._-]/u', '', $cleaned);
        
        // Trim whitespace
        return trim($cleaned);
    }

    public function sanitizeHtml(string $html): string
    {
        // Use HTMLPurifier or similar
        return clean($html);
    }
}
```

### Frontend Validation

```typescript
// composables/useFormValidation.ts
import { z } from 'zod'

const driverSchema = z.object({
  name: z.string().min(2).max(255),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  is_active: z.boolean()
})
```

## 🛡️ CSRF Protection

### Backend

Laravel automatically protects POST, PUT, PATCH, DELETE requests:

```php
// Verify CSRF token middleware
VerifyCsrfToken::class
```

### Frontend

```typescript
// services/axios.ts
axios.defaults.withCredentials = true

// First request to get CSRF cookie
await axios.get('/sanctum/csrf-cookie')

// Subsequent requests include CSRF token automatically
```

## �� SQL Injection Prevention

### Use Eloquent ORM

```php
// ✅ Safe - Parameterized query
Driver::where('name', $name)->first();

// ❌ Dangerous - Raw SQL injection risk
DB::select("SELECT * FROM drivers WHERE name = '$name'");

// ✅ Safe raw query with bindings
DB::select('SELECT * FROM drivers WHERE name = ?', [$name]);
```

### Query Builder

```php
// Always use parameter binding
DB::table('drivers')
    ->where('name', $name)
    ->where('is_active', true)
    ->get();
```

## 🚨 XSS Prevention

### Backend (Blade)

```blade
{{-- ✅ Automatically escaped --}}
{{ $userInput }}

{{-- ⚠️ Unescaped - only for trusted content --}}
{!! $trustedHtml !!}
```

### Frontend (Vue)

```vue
<!-- ✅ Automatically escaped -->
<div>{{ userInput }}</div>

<!-- ⚠️ Use v-html only for trusted content -->
<div v-html="sanitizedHtml"></div>
```

### Content Security Policy

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle($request, Closure $next)
{
    $response = $next($request);
    
    $response->headers->set('Content-Security-Policy', 
        "default-src 'self'; " .
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
        "style-src 'self' 'unsafe-inline'; " .
        "img-src 'self' data: https:; " .
        "font-src 'self' data:;"
    );
    
    return $response;
}
```

## 🔐 Authorization

### Policy-Based Access Control

```php
// app/Policies/DriverPolicy.php
class DriverPolicy
{
    public function update(User $user, Driver $driver): bool
    {
        return $user->id === $driver->user_id || $user->is_admin;
    }

    public function delete(User $user, Driver $driver): bool
    {
        return $user->is_admin;
    }
}
```

### Using Policies

```php
// In controller
$this->authorize('update', $driver);

// In form request
public function authorize(): bool
{
    return $this->user()->can('create', Driver::class);
}
```

### Middleware

```php
// app/Http/Middleware/AdminMiddleware.php
public function handle(Request $request, Closure $next)
{
    if (!$request->user()->is_admin) {
        abort(403, 'Unauthorized');
    }
    
    return $next($request);
}
```

## 🔒 File Upload Security

### Validation

```php
// app/Http/Requests/UploadRequest.php
public function rules(): array
{
    return [
        'file' => [
            'required',
            'file',
            'mimes:eml,csv,txt',
            'max:10240', // 10MB
        ],
    ];
}
```

### Secure Storage

```php
// Store with unique filename
$path = $request->file('file')->store('uploads', 'private');

// Don't expose original filenames
$safeFilename = uniqid() . '.' . $extension;
```

### Prevent Directory Traversal

```php
// ❌ Dangerous
$file = file_get_contents($_GET['file']);

// ✅ Safe
$allowedFiles = ['file1.txt', 'file2.txt'];
if (in_array($filename, $allowedFiles)) {
    $file = file_get_contents(storage_path('app/' . $filename));
}
```

## 🌐 HTTPS & Secure Headers

### Force HTTPS

```php
// app/Http/Middleware/ForceHttps.php
public function handle(Request $request, Closure $next)
{
    if (!$request->secure() && app()->environment('production')) {
        return redirect()->secure($request->getRequestUri());
    }
    
    return $next($request);
}
```

### Security Headers

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle($request, Closure $next)
{
    $response = $next($request);
    
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-XSS-Protection', '1; mode=block');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    return $response;
}
```

## 🔑 Environment Variables

### Secure Storage

```bash
# Never commit .env file
.env

# Use .env.example as template
cp .env.example .env

# Use strong values
APP_KEY=base64:randomgeneratedkey...
DB_PASSWORD=strongpassword123!
```

### Sensitive Data

```php
// ✅ Use environment variables
'password' => env('DB_PASSWORD'),

// ❌ Don't hardcode
'password' => 'mypassword123',
```

## 📝 Logging & Monitoring

### Log Security Events

```php
// Log authentication attempts
Log::info('User login attempt', [
    'email' => $email,
    'ip' => $request->ip(),
    'timestamp' => now(),
]);

// Log failed logins
Log::warning('Failed login attempt', [
    'email' => $email,
    'ip' => $request->ip(),
]);

// Log admin actions
Log::notice('Admin action', [
    'user_id' => $user->id,
    'action' => 'delete_driver',
    'target_id' => $driverId,
]);
```

### Audit Trail

```php
// Store security-relevant actions
Upload::create([
    'user_id' => auth()->id(),
    'filename' => $filename,
    'uploaded_from_ip' => $request->ip(),
]);

// Track login history
User::update([
    'last_login_at' => now(),
    'last_login_ip' => $request->ip(),
]);
```

## 🔍 Dependency Security

### Keep Dependencies Updated

```bash
# Backend
composer update
composer audit

# Frontend
npm audit
npm audit fix

# Check for vulnerabilities
npm audit --production
```

### Use Lock Files

- `composer.lock` - PHP dependencies
- `package-lock.json` - JavaScript dependencies

Commit both files to ensure consistent versions.

## 🛡️ API Security

### API Versioning

```php
// Future-proof with versioning
Route::prefix('v1')->group(function () {
    // API routes
});
```

### Request Validation

```php
// Always validate input
$validated = $request->validate([
    'email' => 'required|email',
    'password' => 'required|min:8',
]);
```

### Response Filtering

```php
// Don't expose sensitive data
return $user->only(['id', 'name', 'email']);

// Or use API Resources
return new UserResource($user);
```

## 🔐 Database Security

### User Permissions

```sql
-- Create limited user
CREATE USER 'karting_user'@'localhost' IDENTIFIED BY 'password';

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON karting.* TO 'karting_user'@'localhost';

-- Don't grant DROP, ALTER, etc. unless necessary
```

### Backup Security

```bash
# Encrypt backups
mysqldump karting | gpg --encrypt > backup.sql.gpg

# Secure backup storage
chmod 600 backup.sql
```

## 📋 Security Checklist

### Pre-Production

- [ ] APP_DEBUG=false in production
- [ ] Strong APP_KEY generated
- [ ] All secrets in environment variables
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload validation enabled
- [ ] Password requirements enforced
- [ ] Database user has minimal permissions
- [ ] .env file not publicly accessible
- [ ] Dependencies updated and audited
- [ ] Logs configured and monitored

### Ongoing

- [ ] Regular security audits
- [ ] Monitor logs for suspicious activity
- [ ] Keep dependencies updated
- [ ] Review and rotate secrets periodically
- [ ] Test backup and restore procedures
- [ ] Review user permissions
- [ ] Monitor for failed login attempts

## 🚨 Incident Response

### If Security Breach Occurs

1. **Immediately**:
   - Take affected systems offline if necessary
   - Change all passwords and secrets
   - Revoke all active sessions/tokens

2. **Investigate**:
   - Review logs for suspicious activity
   - Identify scope of breach
   - Document findings

3. **Remediate**:
   - Patch vulnerabilities
   - Restore from clean backups if needed
   - Update security measures

4. **Communicate**:
   - Notify affected users
   - Document incident
   - Implement preventive measures

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security](https://laravel.com/docs/security)
- [Vue Security](https://vuejs.org/guide/best-practices/security.html)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)

---

*Last Updated: February 2026*
