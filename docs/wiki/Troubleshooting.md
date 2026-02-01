# 🔧 Troubleshooting Guide

Common issues and their solutions for the Karting Dashboard.

## 🚨 Common Issues

### Backend Issues

#### 1. "Class not found" Error

**Symptoms**: Error message like `Class 'App\Models\Driver' not found`

**Solutions**:
```bash
cd portal/backend
composer dump-autoload
php artisan clear-compiled
php artisan optimize
```

#### 2. Database Connection Failed

**Symptoms**: `SQLSTATE[HY000] [2002] Connection refused`

**Solutions**:
```bash
# Check database is running
mysql -u root -p

# Verify .env database credentials
DB_CONNECTION=mysql
DB_HOST=127.0.0.1  # try localhost if 127.0.0.1 doesn't work
DB_PORT=3306
DB_DATABASE=karting
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Test connection
php artisan tinker
>>> DB::connection()->getPdo();
```

#### 3. Permission Denied Errors

**Symptoms**: `The stream or file "storage/logs/laravel.log" could not be opened`

**Solutions**:
```bash
# Linux/Mac
cd portal/backend
chmod -R 775 storage bootstrap/cache
chown -R $USER:www-data storage bootstrap/cache

# Windows
# Run as administrator and set full permissions on storage/ and bootstrap/cache/
```

#### 4. 500 Internal Server Error

**Solutions**:
```bash
# Enable debug mode temporarily
# In .env: APP_DEBUG=true

# Check error logs
tail -f storage/logs/laravel.log

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Regenerate autoload
composer dump-autoload
```

#### 5. Sanctum Authentication Not Working

**Symptoms**: 401 Unauthorized on API requests

**Solutions**:
```bash
# Check SANCTUM_STATEFUL_DOMAINS in .env
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173

# In frontend .env.local:
VITE_API_BASE_URL=http://localhost:8000

# Check CORS configuration in config/cors.php
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,
```

#### 6. Migration Errors

**Symptoms**: `Base table or view already exists`

**Solutions**:
```bash
# Check migration status
php artisan migrate:status

# Rollback and re-run
php artisan migrate:rollback
php artisan migrate

# Fresh start (WARNING: Deletes all data)
php artisan migrate:fresh --seed
```

### Frontend Issues

#### 1. Module Not Found Errors

**Symptoms**: `Cannot find module '@/components/DriverCard'`

**Solutions**:
```bash
cd portal/frontend

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### 2. API Connection Refused

**Symptoms**: Network errors when calling API

**Solutions**:
```bash
# Check API base URL in .env.local
VITE_API_BASE_URL=http://localhost:8000/api

# Verify backend is running
curl http://localhost:8000/api/health

# Check browser console for CORS errors
# If CORS error, check backend config/cors.php
```

#### 3. Build Failures

**Symptoms**: `npm run build` fails

**Solutions**:
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build

# Check TypeScript errors
npm run type-check

# Check for syntax errors
npm run lint
```

#### 4. Hot Module Replacement Not Working

**Symptoms**: Changes not reflected without refresh

**Solutions**:
```bash
# Restart dev server
npm run dev

# Check vite.config.ts for correct host/port
server: {
  host: 'localhost',
  port: 5173
}

# Clear browser cache (Ctrl+Shift+R)
```

#### 5. Authentication Token Issues

**Symptoms**: Logged out unexpectedly

**Solutions**:
```javascript
// Check token expiration
// Sanctum tokens expire after 24 hours by default

// Clear local storage
localStorage.clear()

// Login again to get new token
```

### Database Issues

#### 1. Slow Queries

**Symptoms**: Queries taking longer than 1 second

**Solutions**:
```sql
-- Add missing indexes
CREATE INDEX idx_lap_time ON laps(lap_time);
CREATE INDEX idx_session_date ON karting_sessions(session_date);

-- Analyze slow queries
SHOW PROCESSLIST;

-- Optimize tables
OPTIMIZE TABLE drivers, tracks, karting_sessions, laps;
```

#### 2. Deadlocks

**Symptoms**: `Deadlock found when trying to get lock`

**Solutions**:
```php
// Use database transactions
DB::transaction(function () {
    // Your queries here
});

// Or retry on deadlock
DB::transaction(function () {
    // Queries
}, 5); // Retry 5 times
```

#### 3. Character Encoding Issues

**Symptoms**: Special characters display as �

**Solutions**:
```sql
-- Check database charset
SHOW VARIABLES LIKE 'character_set%';

-- Should be utf8mb4
ALTER DATABASE karting CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Update tables
ALTER TABLE drivers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Deployment Issues

#### 1. 404 Error on Production

**Symptoms**: Routes work locally but 404 on production

**Solutions**:
```bash
# Ensure .htaccess exists in public/
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>

# Clear route cache
php artisan route:clear
php artisan route:cache

# Check Apache mod_rewrite is enabled
a2enmod rewrite
systemctl restart apache2
```

#### 2. Environment Variables Not Working

**Symptoms**: Config values showing as null

**Solutions**:
```bash
# Clear config cache
php artisan config:clear

# Verify .env file exists and is readable
ls -la .env

# Regenerate config cache
php artisan config:cache

# Check values
php artisan tinker
>>> config('app.name')
```

#### 3. Assets Not Loading

**Symptoms**: CSS/JS not found (404)

**Solutions**:
```bash
# Rebuild frontend
cd portal/frontend
npm run build

# Ensure dist/ folder is deployed
ls -la dist/

# Check asset paths in index.html
# Should be relative paths, not absolute

# Clear browser cache (Ctrl+Shift+R)
```

### Testing Issues

#### 1. Tests Failing Locally

**Symptoms**: Tests pass in CI but fail locally

**Solutions**:
```bash
# Use correct environment
cp .env.example .env.testing

# In .env.testing:
DB_CONNECTION=sqlite
DB_DATABASE=:memory:

# Clear test database
php artisan migrate:fresh --env=testing

# Run tests
php artisan test
```

#### 2. Test Database Conflicts

**Symptoms**: `Base table or view already exists` in tests

**Solutions**:
```bash
# Use in-memory SQLite for tests
# In .env.testing:
DB_CONNECTION=sqlite
DB_DATABASE=:memory:

# Or use separate test database
DB_DATABASE=karting_test

# Run migrations before tests
php artisan migrate:fresh --env=testing
```

## 🐛 Debugging Tools

### Backend Debugging

#### Laravel Telescope
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```
Access at: `http://localhost:8000/telescope`

#### Laravel Debugbar
```bash
composer require barryvdh/laravel-debugbar --dev
```
Automatically shows debug info at bottom of page in development.

#### Query Logging
```php
// Enable query log
DB::enableQueryLog();

// Your queries here

// Get queries
$queries = DB::getQueryLog();
dd($queries);
```

### Frontend Debugging

#### Vue DevTools
Install browser extension for:
- Component tree inspection
- Pinia state debugging
- Performance profiling

#### Network Tab
Check browser Network tab for:
- API request/response
- HTTP status codes
- Request headers
- Response timing

#### Console Debugging
```javascript
// Log to console
console.log('Debug:', variable)

// Debug Pinia store
const driverStore = useDriverStore()
console.log('Store state:', driverStore.$state)

// Debug reactive refs
import { toRaw } from 'vue'
console.log('Raw data:', toRaw(reactiveObject))
```

## 📊 Performance Issues

### Slow Page Load

**Diagnosis**:
```bash
# Check database query performance
php artisan telescope:install  # if not installed
# Access /telescope and check "Queries" tab

# Profile frontend
npm run build -- --mode analyze
```

**Solutions**:
- Add database indexes
- Enable query caching
- Use eager loading: `Model::with('relation')`
- Implement Redis caching
- Optimize images and assets
- Enable HTTP/2 and compression

### High Memory Usage

**Solutions**:
```php
// Process large datasets in chunks
DB::table('laps')->chunk(1000, function ($laps) {
    // Process $laps
});

// Use lazy collections
User::lazy()->each(function ($user) {
    // Process one at a time
});
```

### API Rate Limiting

**Symptoms**: 429 Too Many Requests

**Solutions**:
```php
// Adjust rate limits in routes/api.php
Route::middleware('throttle:100,1')->group(function () {
    // Higher limit for these routes
});

// Or in .env:
THROTTLE_RATE_LIMIT=100
```

## 🔒 Security Issues

### CSRF Token Mismatch

**Symptoms**: 419 Page Expired

**Solutions**:
```javascript
// Ensure CSRF token is sent
// In axios config:
axios.defaults.withCredentials = true

// Check CSRF cookie
document.cookie  // Should see XSRF-TOKEN
```

### XSS Vulnerabilities

**Solutions**:
```php
// Always escape output
{{ $variable }}  // Automatically escaped

// For HTML content, sanitize first
{!! clean($html) !!}  // Use HTMLPurifier or similar
```

## 📱 Mobile/Responsive Issues

### Layout Breaking on Mobile

**Solutions**:
```css
/* Use responsive units */
width: 100%;
max-width: 1200px;
padding: 1rem;

/* Use media queries */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

/* Use mobile-first approach */
```

### Touch Events Not Working

**Solutions**:
```javascript
// Use both click and touch events
@click="handler"
@touchstart="handler"

// Or use PointerEvents
@pointerdown="handler"
```

## 📞 Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Search GitHub issues
3. Check Laravel/Vue documentation
4. Review error logs
5. Try debugging tools

### Where to Get Help

- **GitHub Issues**: [Create an issue](https://github.com/TheMaksoo/karting/issues/new)
- **Stack Overflow**: Tag with `laravel`, `vue.js`, `typescript`
- **Laravel Discord**: https://discord.gg/laravel
- **Vue Discord**: https://discord.com/invite/vue

### Information to Include

When asking for help, provide:
- Error message (full stack trace)
- Steps to reproduce
- Expected behavior vs actual behavior
- Environment details (OS, PHP version, Node version)
- Relevant code snippets
- Screenshots if applicable

## 📚 Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Issues](https://github.com/TheMaksoo/karting/issues)

---

*Last Updated: February 2026*
