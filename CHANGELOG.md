# Changelog

All notable changes to the Karting Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Security
- Input sanitization service for XSS/HTML injection prevention in EmlUploadController
- File content validation for uploaded EML files
- Zod validation schemas for frontend form validation
- Audit logging middleware for tracking user CRUD actions
- Request logging middleware for monitoring and debugging

#### Performance
- Response compression middleware (gzip) for large JSON responses
- Session calculator service for optimized lap statistics calculation

#### Code Quality
- Split `api.ts` into domain-specific modules (AuthApi, DriversApi, TracksApi, etc.)
- TrackDetectorService extracted from EmlUploadController
- SessionCalculatorService extracted from EmlUploadController
- InputSanitizer service for centralized input sanitization
- Form validation composable with Zod integration

#### Accessibility
- Skip to content link component
- Dark/light mode toggle with system preference detection
- Keyboard navigation composable for lists and dropdowns
- AccessibleDropdown component with full keyboard support
- ARIA labels and roles throughout the application

#### Frontend Features
- Dark mode support with `useDarkMode` composable
- Optimistic updates composable for instant UI feedback
- Form validation composable using Zod schemas
- Theme toggle component with smooth transitions

#### Documentation
- Added CONTRIBUTING.md with development guidelines
- Added CHANGELOG.md for tracking changes
- PHPDoc comments on all new PHP services
- JSDoc comments on all new TypeScript modules

#### Database
- Audit logs table for tracking user actions
- Added `uploaded_from_ip` column to uploads table

### Changed

- EmlUploadController now uses dependency injection for services
- Session save endpoint now sanitizes all user inputs
- API module structure reorganized for better maintainability

### Fixed

- Potential XSS vulnerabilities in uploaded file content
- Potential HTML injection in driver names and notes fields

## [1.0.0] - 2026-01-15

### Added

- Initial release of Karting Dashboard
- Multi-track karting lap time management
- EML file parsing for major karting tracks:
  - De Voltage
  - Experience Factory Antwerp
  - Goodwill Karting
  - Circuit Park Berghem
  - Fastkart Elche
  - Lot66
  - Racing Center Gilesias
- Driver management with statistics
- Track management with pricing configuration
- Session history and analytics
- Friends system for comparing lap times
- User authentication with Sanctum
- Role-based access control (admin/driver)
- Rate limiting on all API endpoints
- Brute-force protection on login
- Health check endpoints for monitoring
- CI/CD pipeline with GitHub Actions
- PHPUnit/PEST tests for backend
- Vitest tests for frontend
- pytest tests for Python importer

### Security

- API rate limiting (60 requests/minute)
- Login throttling (5 attempts/minute)
- Sanctum token expiration (24 hours)
- Strong password requirements
- HTTPS enforcement in production
- Content-Security-Policy headers
- CORS configuration

### Performance

- Database indexes on frequently queried columns
- Eager loading to prevent N+1 queries
- Response caching on stats endpoints
- Soft deletes for data recovery

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2026-01-15 | Initial release |

## Release Notes Format

Each release includes:
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Features to be removed in future
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
