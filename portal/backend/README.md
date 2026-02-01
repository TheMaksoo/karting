# 🏎️ Karting Dashboard - Backend API

> Laravel 11 REST API for karting session tracking and analytics

## 📋 Overview

Enterprise-grade backend API built with Laravel 11, providing comprehensive karting session management, lap time analytics, and multi-user support with advanced security features.

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **PHP** | 8.2+ | Runtime |
| **Laravel** | 11.x | Framework |
| **MySQL** | 8.0+ | Database |
| **Redis** | 7.0+ | Caching & Sessions |
| **Sanctum** | 4.x | Authentication |
| **L5-Swagger** | 8.x | API Documentation |
| **PEST** | 2.x | Testing Framework |
| **Laravel Pint** | 1.x | Code Style |
| **Sentry** | 4.x | Error Tracking |

## 📁 Architecture

```
portal/backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/API/          # API Controllers
│   │   ├── Middleware/               # Custom Middleware
│   │   ├── Requests/                 # Form Requests
│   │   └── Resources/                # API Resources
│   ├── Models/                       # Eloquent Models
│   ├── Services/                     # Business Logic
│   │   ├── EmlParser.php             # Email parsing
│   │   ├── TrackDetectorService.php  # Track detection
│   │   ├── SessionCalculatorService.php  # Stats calculations
│   │   └── InputSanitizer.php        # XSS protection
│   ├── Utils/                        # Utility Classes
│   │   └── TimeConverter.php         # Time format conversions
│   └── Providers/                    # Service Providers
├── config/                           # Configuration Files
├── database/
│   ├── migrations/                   # Database Migrations
│   ├── seeders/                      # Database Seeders
│   └── factories/                    # Model Factories
├── routes/
│   ├── api.php                       # API Routes (v1 default)
│   └── api_v1.php                    # API v1 Routes
├── storage/                          # Storage (logs, cache, uploads)
├── tests/
│   ├── Feature/                      # Feature Tests
│   └── Unit/                         # Unit Tests
├── .env.example                      # Environment Template
├── composer.json                     # PHP Dependencies
└── phpunit.xml                       # Test Configuration
```

## 🚀 Quick Start

### Prerequisites

- PHP 8.2+
- Composer 2.x
- MySQL 8.0+
- Redis 7.0+
- Node.js 20+ (for asset compilation)

### Installation

```bash
# Clone repository
git checkout develop
git pull origin develop

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=karting_db
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed

# Generate Swagger documentation
php artisan l5-swagger:generate

# Start development server
php artisan serve
```

Visit: http://localhost:8000/api/documentation for API docs

## 📊 Database Schema

### Core Tables

- **users** - User accounts with authentication
- **drivers** - Karting drivers (can belong to multiple users)
- **tracks** - Karting track locations
- **karting_sessions** - Racing sessions at tracks
- **laps** - Individual lap times for drivers
- **friends** - User friendships for shared drivers
- **user_drivers** - Many-to-many relationship between users and drivers
- **audit_logs** - CRUD operation tracking

### Key Indexes

- `laps.lap_time` - Critical for best lap queries
- `laps.driver_id`, `laps.karting_session_id` - Foreign keys
- `drivers.name`, `drivers.is_active` - Search optimization
- `karting_sessions.session_type`, `karting_sessions.session_date` - Filtering

## 🔒 Security Features

### Authentication
- **Session-based auth** with HttpOnly cookies (XSS-proof)
- **CSRF protection** enabled for state-changing operations
- **Token expiration** configurable (default: 24h)
- **Password policy**: Min 8 chars, uppercase, number, special char

### Rate Limiting
- **IP-based**: 60 req/min per IP
- **User-based**: 120 req/min per authenticated user
- **Login protection**: 5 attempts/min (brute-force protection)

### Input Validation
- **FormRequest classes** for all endpoints
- **InputSanitizer service** for HTML/XSS protection
- **SQL injection protection** via Eloquent ORM
- **File validation** (MIME type, size, content)

### Headers
- **CSP** (Content Security Policy) with reporting
- **HSTS** (Strict-Transport-Security)
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login           # Login with email/password
POST   /api/auth/register        # Register new user
POST   /api/auth/logout          # Logout (invalidate session)
GET    /api/auth/me              # Get current user
POST   /api/auth/change-password # Change password
```

### Drivers
```
GET    /api/drivers              # List drivers (paginated)
POST   /api/drivers              # Create driver
GET    /api/drivers/{id}         # Get driver details
PUT    /api/drivers/{id}         # Update driver
DELETE /api/drivers/{id}         # Soft delete driver
GET    /api/stats/drivers        # Driver statistics (cached)
```

### Tracks
```
GET    /api/tracks               # List tracks (paginated)
POST   /api/tracks               # Create track
GET    /api/tracks/{id}          # Get track details
PUT    /api/tracks/{id}          # Update track
DELETE /api/tracks/{id}          # Soft delete track
GET    /api/stats/tracks         # Track statistics (cached)
```

### Sessions
```
GET    /api/sessions             # List sessions
POST   /api/sessions             # Create session
GET    /api/sessions/{id}        # Get session details
PUT    /api/sessions/{id}        # Update session
DELETE /api/sessions/{id}        # Delete session
GET    /api/sessions/{id}/laps   # Get session laps
GET    /api/sessions/{id}/stats  # Session statistics (cached)
```

### Laps
```
GET    /api/laps                 # List laps
POST   /api/laps                 # Create lap
GET    /api/laps/{id}            # Get lap details
PUT    /api/laps/{id}            # Update lap
DELETE /api/laps/{id}            # Delete lap
```

### Analytics
```
GET    /api/stats/overview                  # System overview
GET    /api/stats/driver-activity-over-time # Driver activity chart
GET    /api/stats/driver-track-heatmap      # Driver/track heatmap
GET    /api/stats/trophy-case               # Achievements
GET    /api/stats/database-metrics          # Database stats
```

### Health Checks
```
GET    /api/health          # Basic health status
GET    /api/health/detailed # Full component status
GET    /api/health/ready    # Kubernetes readiness
GET    /api/health/live     # Kubernetes liveness
```

### Query Parameters

**Pagination** (drivers, tracks, sessions):
- `?page=1` - Page number
- `?per_page=50` - Items per page (max 100)

**Filtering** (drivers):
- `?search=john` - Search by name/nickname/email
- `?active_only=true` - Only active drivers

**Filtering** (tracks):
- `?search=spa` - Search by name/city/country
- `?country=Belgium` - Filter by country

## 🧪 Testing

### Run All Tests
```bash
composer test
```

### Run Specific Test Suite
```bash
php artisan test --filter=DriverController
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit
```

### Generate Coverage Report
```bash
composer test:coverage
```

### Current Test Stats
- **Total Tests**: 554 ✅
- **Coverage**: ~85%
- **Test Types**: Feature, Unit, Integration

## 🎨 Code Quality

### Linting
```bash
# Check style issues
vendor/bin/pint --test

# Fix style issues
vendor/bin/pint
```

### Static Analysis
```bash
# PHPStan
vendor/bin/phpstan analyse

# Psalm
vendor/bin/psalm
```

### Pre-commit Checklist
```bash
vendor/bin/pint              # Fix code style
composer test                # Run tests
php artisan l5-swagger:generate  # Update API docs
```

## 📦 Services & Utilities

### EmlParser
Parses karting session emails (EML files) and extracts lap times, drivers, and session metadata.

```php
use App\Services\EmlParser;

$parser = new EmlParser($emlFilePath);
$data = $parser->parse();
```

### TrackDetectorService
Automatically detects karting tracks from email content using pattern matching.

```php
use App\Services\TrackDetectorService;

$detector = new TrackDetectorService();
$track = $detector->detectFromSubject($subject);
```

### SessionCalculatorService
Calculates statistics and analytics for sessions.

```php
use App\Services\SessionCalculatorService;

$calculator = new SessionCalculatorService();
$stats = $calculator->calculateSessionStats($session);
```

### TimeConverter
Utility for time format conversions.

```php
use App\Utils\TimeConverter;

// Convert to seconds
$seconds = TimeConverter::toSeconds('1:23.456'); // 83.456

// Format to display
$formatted = TimeConverter::format(83.456); // "1:23.456"

// Calculate difference
$diff = TimeConverter::formatDifference(83.456, 80.0); // "+3.456"
```

## 🚀 Performance Optimization

### Caching Strategy

**Stats Endpoints** (5 min cache):
- `/api/stats/drivers`
- `/api/stats/tracks`
- `/api/sessions/{id}/stats`
- `/api/stats/driver-activity-over-time`

**Cache Keys**:
```php
Cache::remember('driver_stats_' . $userId, 300, function() { ... });
Cache::remember('session_stats_' . $sessionId, 300, function() { ... });
```

### N+1 Query Prevention

Use `with()` and `withCount()` eager loading:
```php
Driver::with('laps.kartingSession')
    ->withCount('laps')
    ->get();
```

### Database Optimization
- Indexes on all foreign keys
- Composite indexes for common queries
- Soft deletes for data retention
- Query result caching

## 🔧 Configuration

### Environment Variables

```bash
# Application
APP_NAME="Karting Dashboard"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=karting_db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Sanctum
SANCTUM_STATEFUL_DOMAINS=your-domain.com,localhost:5173
SESSION_LIFETIME=120

# Security
CORS_ALLOWED_ORIGINS=https://your-domain.com
CSP_REPORT_URI=https://your-domain.com/api/csp-report

# Sentry
SENTRY_LARAVEL_DSN=your-sentry-dsn
SENTRY_TRACES_SAMPLE_RATE=0.1

# Logging
LOG_CHANNEL=json
LOG_LEVEL=info
DB_LOG_SLOW_QUERIES=true
DB_SLOW_QUERY_THRESHOLD=1000
```

## 📊 Monitoring & Logging

### Structured JSON Logging
```json
{
  "level": "info",
  "message": "User logged in",
  "user_id": 123,
  "request_id": "abc-123-def",
  "trace_id": "xyz-789",
  "url": "/api/auth/login",
  "method": "POST",
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2026-02-01T12:00:00Z"
}
```

### Slow Query Logging
Automatically logs queries exceeding threshold (default: 1s):
```
[2026-02-01 12:00:00] Slow query detected (1.234s): 
SELECT * FROM laps WHERE ...
```

### Audit Logging
All CRUD operations logged with user context:
```
[AUDIT] User #123 created Driver #456
[AUDIT] User #123 updated Session #789
[AUDIT] User #123 deleted Lap #012
```

## 🐛 Error Tracking

### Sentry Integration
- Automatic exception reporting
- User context breadcrumbs
- Performance monitoring
- Release tracking

### Error Response Format
```json
{
  "message": "Resource not found",
  "errors": {
    "driver": ["Driver with ID 123 not found"]
  },
  "trace_id": "abc-123-def"
}
```

## 📚 API Documentation

Interactive Swagger/OpenAPI documentation available at:
```
http://localhost:8000/api/documentation
```

Generate/update docs:
```bash
php artisan l5-swagger:generate
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) and [BRANCH_PROTECTION.md](../../BRANCH_PROTECTION.md) for development workflow.

### Development Workflow
1. Create feature branch from `develop`
2. Make changes with tests
3. Run `vendor/bin/pint` and `composer test`
4. Push and create PR to `develop`
5. Wait for CI/CD checks
6. Request code review
7. Merge after approval

## 📄 License

See [LICENSE](../../LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Project Docs](../../README.md)
- **API Docs**: http://localhost:8000/api/documentation
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

**Last Updated**: February 1, 2026  
**Version**: 1.0.0  
**Maintained by**: Karting Dashboard Team
