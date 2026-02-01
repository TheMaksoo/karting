# ADR-001: Use Laravel for Backend

## Status

**Accepted**

## Date

2024-01-15

## Context

We needed to choose a backend framework for the Karting Dashboard application. The application requires:

- RESTful API for frontend consumption
- Authentication and authorization
- Database ORM for complex queries
- File upload handling (EML parsing)
- Background job processing
- Email notifications
- Testing framework integration

The development team has experience with PHP and needs a framework that enables rapid development while maintaining code quality.

## Decision

We chose **Laravel 12** as the backend framework.

### Reasons

1. **Mature Ecosystem**: Laravel has a rich ecosystem with official packages for authentication (Sanctum), testing (PEST), API documentation (L5-Swagger), and more.

2. **Eloquent ORM**: Powerful ORM for database operations with support for:
   - Eager loading (N+1 prevention)
   - Soft deletes
   - Model scopes
   - Database migrations

3. **Built-in Features**: 
   - Rate limiting middleware
   - Request validation (FormRequest)
   - Caching (Redis/File/Database)
   - Queue system for background jobs

4. **Developer Experience**:
   - Artisan CLI for code generation
   - Tinker REPL for debugging
   - Hot reload with `artisan serve`

5. **Community & Documentation**: Large community, extensive documentation, and active development.

## Alternatives Considered

### Option 1: Symfony
- **Pros**: Enterprise-grade, highly configurable, component-based
- **Cons**: Steeper learning curve, more boilerplate, slower development

### Option 2: Node.js (Express/NestJS)
- **Pros**: JavaScript full-stack, good for real-time features
- **Cons**: Team has more PHP experience, different paradigm

### Option 3: Python (Django/FastAPI)
- **Pros**: Great for data processing, clean syntax
- **Cons**: Team less experienced, would need to maintain two languages

## Consequences

### Positive
- Rapid development with Laravel conventions
- Easy onboarding for PHP developers
- Comprehensive testing with PEST
- Built-in security features (CSRF, XSS protection)
- Excellent API development tools

### Negative
- PHP hosting requirements
- Performance lower than compiled languages for CPU-intensive tasks
- Requires PHP 8.2+ which may limit hosting options

### Neutral
- Requires Composer for dependency management
- Convention over configuration approach

## References

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Best Practices](https://github.com/alexeymezenin/laravel-best-practices)
- [Why Laravel?](https://laravel.com/docs/12.x/introduction#why-laravel)
