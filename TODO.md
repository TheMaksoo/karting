# 🏎️ Karting Dashboard - Improvement TODO List

> Last updated: February 1, 2026
> Status: **87 improvements identified** across 10 categories  
> **61 completed** ✅ | **26 remaining**

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| 🔐 Security | 9 | Critical |
| ⚡ Performance | 12 | High |
| 🏗️ Missing API Features | 7 | High |
| 📝 Code Quality | 15 | Medium |
| 📚 Documentation | 8 | Medium |
| 🎨 Frontend/UX | 14 | Medium |
| 🗄️ Database | 6 | Medium |
| 📊 Logging/Monitoring | 5 | Low |
| ✅ Validation | 5 | Medium |
| 🧪 Testing | 6 | Low |

---

## 🔴 Critical Priority (Do First)

### Security
- [x] **Implement API rate limiting** - Add `throttle:60,1` middleware to routes/api.php ✅
- [x] **Add brute-force protection on login** - Use `throttle:5,1` on login route ✅
- [x] **Set Sanctum token expiration** - Configure 24h expiration in `config/sanctum.php` ✅
- [x] **Strengthen password policy** - Require uppercase, number, special char ✅

### Performance
- [x] **Add database index on `laps.lap_time`** - Critical for sorting/best lap queries ✅
- [x] **Add caching to stats endpoints** - `/api/drivers/stats`, `/api/tracks/stats` ✅

---

## 🟠 High Priority

### Security
- [x] Add input sanitization for HTML/XSS in EML upload controller ✅ (InputSanitizer service)
- [ ] Consider moving token storage from localStorage to httpOnly cookies

### Performance
- [x] Add index on `karting_sessions.session_type` ✅
- [x] Add index on `drivers.name` ✅
- [x] Add index on `drivers.is_active` ✅
- [x] Fix N+1 queries in `DriverController@stats` ✅
- [x] Fix N+1 queries in `TrackController@stats` ✅
- [ ] Implement response caching on `/api/sessions/{id}/stats`

### API Features
- [x] Add rate limiting middleware to all API routes ✅
- [x] Add soft deletes to Driver, Track, Session models ✅
- [x] Create FormRequest classes for all controller validations ✅
- [x] Add API versioning (`/api/v1/`) for future compatibility ✅

### Code Quality
- [x] **Split EmlUploadController** - Created services: ✅
  - `EmlParser` service
  - `TrackDetectorService`  
  - `SessionCalculatorService`
  - `InputSanitizer`
- [ ] Split `DriverDetailedView.vue` (1521 lines) into smaller components
- [ ] Split `EmlUploadView.vue` (1335 lines) - extract FileDropzone, BatchProgress
- [x] Split `api.ts` by domain (AuthApi, DriversApi, TracksApi etc.) ✅
- [x] Move stats logic to service classes (SessionCalculatorService) ✅
- [ ] Extract TimeConverter utility for shared time parsing logic

### Documentation
- [x] Add OpenAPI/Swagger API documentation using L5-Swagger ✅
- [ ] Write project-specific backend README
- [ ] Add detailed production deployment guide

---

## 🟡 Medium Priority

### Security
- [x] Add HTTPS enforcement in production ✅
- [x] Add Content-Security-Policy headers via middleware ✅
- [x] Add frontend input validation with Zod ✅ (useFormValidation composable)

### Database
- [x] Add `deleted_at` column for soft deletes on all main tables ✅
- [x] Add `last_login_at` and `last_login_ip` to users table ✅
- [x] Add `uploaded_from` IP address to uploads table ✅ (migration created)
- [x] Add SoftDeletes trait to all models ✅
- [x] Add model scopes: `scopeBestLaps()`, `scopeActive()` ✅
- [x] Define `$with` property on KartingSession for eager loading ✅

### Frontend UX
- [x] Create `ErrorBoundary.vue` component for Vue error handling ✅
- [x] Add toast notifications (vue-toastification) for user feedback ✅
- [x] Add skeleton loaders for all data loading states ✅
- [x] Add ARIA labels to all interactive elements ✅ (AccessibleDropdown)
- [x] Add "Skip to content" link for accessibility ✅ (SkipLink.vue)
- [ ] Verify color contrast ratios ≥ 4.5:1
- [x] Add visible focus indicators to all focusable elements ✅
- [ ] Ensure all form inputs have associated labels
- [x] Add keyboard navigation to modals and dropdowns ✅ (useKeyboardNavigation)
- [x] Add debounced search to filter inputs ✅
- [x] Add optimistic updates to UI before API confirmation ✅ (useOptimisticUpdate)

### Validation
- [x] Validate `session_type` against enum in KartingSessionController ✅
- [x] Validate `color` as hex format in DriverController ✅
- [x] Add min/max bounds to `latitude`, `longitude`, `length` in TrackController ✅
- [x] Add reasonable bounds (1-600 seconds) to `lap_time` in LapController ✅
- [x] Add file content validation beyond MIME type in EmlUploadController ✅

### Code Quality (Python)
- [ ] Split `process_karting_sessions.py` (1358 lines) into modules
- [ ] Move hardcoded track names to `config.py`
- [ ] Move driver aliases to database or external config
- [ ] Add Python type hints throughout

### Documentation
- [ ] Document all custom environment variables
- [ ] Add PHPDoc/JSDoc to all public methods
- [ ] Create Architecture Decision Records (ADR)
- [x] Add CONTRIBUTING.md ✅
- [x] Add CHANGELOG.md ✅

---

## 🟢 Nice to Have (Lower Priority)

### API Features
- [x] Add response compression (gzip via middleware) ✅ (CompressResponseMiddleware)
- [ ] Add pagination to `/api/drivers` and `/api/tracks` for large datasets

### Frontend
- [x] Add dark/light mode toggle ✅ (ThemeToggle.vue, useDarkMode)
- [ ] Add service worker for offline support
- [ ] Consider infinite scroll for large lists
- [ ] Remove/merge duplicate StatsView.vue functionality

### Logging & Monitoring
- [x] Add `LogRequestsMiddleware` for request logging ✅
- [ ] Log slow queries (>1s)
- [ ] Integrate Sentry or Bugsnag for error tracking
- [ ] Remove debug emoji logs from TrophyCaseView
- [x] Add audit logging for user CRUD actions ✅ (AuditMiddleware)

### Testing
- [x] Add EmlUploadController tests ✅
- [x] Add SessionAnalyticsController tests ✅
- [ ] Add batch upload edge case tests
- [x] Add rate limiting tests ✅
- [x] Add caching tests ✅
- [ ] Add frontend component tests
- [ ] Add Cypress E2E tests
- [ ] Expand Python test coverage

---

## ✅ Recently Completed

- [x] Install & configure PEST testing framework
- [x] Add health check endpoints (`/api/health/*`)
- [x] Update CI/CD pipeline with PEST, linting, and deploy stage
- [x] Add EditorConfig for consistent formatting
- [x] Add ESLint & Prettier for frontend
- [x] Add Laravel Pint configuration for backend
- [x] Update .env.example with all project-specific variables
- [x] Add comprehensive backend tests (PHPUnit/PEST)
- [x] Add frontend tests (Vitest)
- [x] Add Python tests (pytest)
- [x] Configure SonarQube integration
- [x] Fix security issues (hardcoded credentials, CORS, absolute paths)
- [x] Remove dead/duplicate code
- [x] Implement API rate limiting on all routes
- [x] Add brute-force protection on login (throttle:5,1)
- [x] Set Sanctum token expiration (24 hours)
- [x] Strengthen password policy (uppercase, number, special char)
- [x] Add database indexes (lap_time, session_type, driver name, is_active)
- [x] Add caching to stats endpoints (5 minute cache)
- [x] Fix N+1 queries in DriverController@stats and TrackController@stats
- [x] Add soft deletes to Driver, Track, Session models
- [x] Create FormRequest classes (StoreDriver, UpdateDriver, StoreSession, StoreLap)
- [x] Add model scopes (scopeBestLaps, scopeActive)
- [x] Add HTTPS enforcement in production
- [x] Add Content-Security-Policy headers via middleware
- [x] Add toast notifications (vue-toastification)
- [x] Configure SonarCloud + Codecov integration
- [x] Fix Laravel Pint style issues (78 files)
- [x] Update ESLint config for flat config format
- [x] Fix frontend api.spec.ts tests
- [x] Create ErrorBoundary.vue component with global error handling
- [x] Add SkeletonLoader, SkeletonCard, SkeletonTable components
- [x] Add global Vue error handler in main.ts
- [x] Fix router guard to check parent route auth meta (security fix)
- [x] Add OpenAPI/Swagger documentation with L5-Swagger
- [x] Create InputSanitizer service for XSS protection
- [x] Create TrackDetectorService for track detection
- [x] Create SessionCalculatorService for stats calculations
- [x] Create LogRequestsMiddleware for request logging
- [x] Create CompressResponseMiddleware for gzip compression
- [x] Create AuditMiddleware for CRUD action logging
- [x] Split api.ts into modular domain files (auth, drivers, tracks, etc.)
- [x] Add useFormValidation composable with Zod
- [x] Add useDarkMode composable and ThemeToggle component
- [x] Add useKeyboardNavigation composable
- [x] Add useOptimisticUpdate composable
- [x] Add SkipLink.vue accessibility component
- [x] Add AccessibleDropdown.vue component
- [x] Add CONTRIBUTING.md documentation
- [x] Add CHANGELOG.md documentation
- [x] Add RateLimitingTest.php
- [x] Add CachingTest.php
- [x] Add InputSanitizerTest.php and other service tests

---

## 🔧 CI/CD Fixes Applied

- Fixed Backend Lint (Pint) - ran `vendor/bin/pint` to fix 78 style issues
- Fixed Backend Tests (Pest) - configured MySQL env vars for CI
- Fixed Frontend Lint - updated ESLint scripts for flat config
- Fixed Frontend Tests - fixed api.spec.ts localStorage assertions

---

## Quick Wins (< 30 min each)

1. ~~Add `throttle:60,1` middleware to API routes~~ ✅
2. ~~Add `throttle:5,1` to login route~~ ✅
3. ~~Add index migration for `laps.lap_time`~~ ✅
4. ~~Set token expiration in Sanctum config~~ ✅
5. ~~Add SoftDeletes trait to models~~ ✅
6. ~~Create basic FormRequest for DriverController~~ ✅
7. ~~Add ARIA labels to major buttons~~ ✅
8. ~~Add toast notification package~~ ✅

---

## Notes

### Running Tests
```bash
# Backend (PEST)
cd portal/backend && composer test

# Frontend (Vitest)  
cd portal/frontend && npm test

# Python (pytest)
cd data-importer/scripts && pytest
```

### Code Quality
```bash
# PHP Linting
cd portal/backend && vendor/bin/pint

# Frontend Linting
cd portal/frontend && npm run lint

# Type Check
cd portal/frontend && npm run type-check
```

### Health Check Endpoints
- `GET /api/health` - Basic health status
- `GET /api/health/detailed` - Full system component status
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/live` - Kubernetes liveness probe
