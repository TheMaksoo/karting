# 📋 Architecture Decision Records

Architecture Decision Records (ADRs) document the key architectural decisions made during the development of the Karting Dashboard.

## What are ADRs?

ADRs are short documents that capture important architectural decisions along with their context and consequences. They serve as:

- **Documentation**: Explain why the codebase is structured a certain way
- **Onboarding**: Help new developers understand past decisions
- **History**: Track the evolution of the architecture
- **Communication**: Share knowledge across the team

## Current ADRs

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-001](https://github.com/TheMaksoo/karting/blob/main/docs/adr/001-use-laravel-for-backend.md) | Use Laravel for Backend | ✅ Accepted | 2024-01 |
| [ADR-002](https://github.com/TheMaksoo/karting/blob/main/docs/adr/002-use-vue3-for-frontend.md) | Use Vue 3 for Frontend | ✅ Accepted | 2024-01 |
| [ADR-003](https://github.com/TheMaksoo/karting/blob/main/docs/adr/003-use-sanctum-for-authentication.md) | Use Laravel Sanctum for Authentication | ✅ Accepted | 2024-01 |
| [ADR-004](https://github.com/TheMaksoo/karting/blob/main/docs/adr/004-use-mysql-database.md) | Use MySQL for Database | ✅ Accepted | 2024-01 |
| [ADR-005](https://github.com/TheMaksoo/karting/blob/main/docs/adr/005-use-pest-for-testing.md) | Use PEST for Backend Testing | ✅ Accepted | 2024-06 |
| [ADR-006](https://github.com/TheMaksoo/karting/blob/main/docs/adr/006-use-pinia-for-state-management.md) | Use Pinia for State Management | ✅ Accepted | 2024-01 |
| [ADR-007](https://github.com/TheMaksoo/karting/blob/main/docs/adr/007-eml-parsing-strategy.md) | EML Email Parsing Strategy | ✅ Accepted | 2024-03 |
| [ADR-008](https://github.com/TheMaksoo/karting/blob/main/docs/adr/008-api-versioning-strategy.md) | API Versioning Strategy | ✅ Accepted | 2025-01 |
| [ADR-009](https://github.com/TheMaksoo/karting/blob/main/docs/adr/009-caching-strategy.md) | Caching Strategy | ✅ Accepted | 2025-06 |
| [ADR-010](https://github.com/TheMaksoo/karting/blob/main/docs/adr/010-error-tracking-with-sentry.md) | Error Tracking with Sentry | ✅ Accepted | 2025-12 |

## ADR Summaries

### ADR-001: Laravel for Backend
We chose Laravel 12 for its mature ecosystem, Eloquent ORM, built-in features (rate limiting, validation, caching), and excellent developer experience.

### ADR-002: Vue 3 for Frontend
Vue 3 with Composition API and TypeScript provides a clean component architecture, excellent DevTools, and fast development with Vite.

### ADR-003: Sanctum for Authentication
Laravel Sanctum provides simple SPA authentication with cookies and API tokens, without the complexity of full OAuth2.

### ADR-004: MySQL Database
MySQL 8.0 offers strong relational data support, excellent Laravel integration, and widespread hosting availability.

### ADR-005: PEST for Testing
PEST PHP offers a more readable syntax than PHPUnit (`it()`, `describe()`, `expect()`), with Laravel integration and parallel execution.

### ADR-006: Pinia for State Management
Pinia is the official Vue state management solution, simpler than Vuex, with full TypeScript support and DevTools integration.

### ADR-007: EML Parsing Strategy
Multi-parser architecture with automatic track detection, allowing easy addition of new track parsers without changing core logic.

### ADR-008: API Versioning
URL-based versioning (`/api/v1/`) with backward-compatible defaults, enabling breaking changes without disrupting existing clients.

### ADR-009: Caching Strategy
Laravel Cache with 5-minute TTL on stats endpoints, user-scoped cache keys, and automatic invalidation on model events.

### ADR-010: Sentry Error Tracking
Sentry for production error tracking with performance monitoring, release tracking, and alerting capabilities.

## Creating a New ADR

1. Copy the [template](https://github.com/TheMaksoo/karting/blob/main/docs/adr/template.md)
2. Number it sequentially (e.g., `011-title.md`)
3. Fill in all sections:
   - **Status**: Proposed → Accepted → (Deprecated/Superseded)
   - **Context**: What problem are we solving?
   - **Decision**: What did we choose and why?
   - **Consequences**: Trade-offs and implications
4. Submit a PR for review
5. Update this wiki page

## ADR Statuses

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet implemented |
| **Accepted** | Decision made and implemented |
| **Deprecated** | No longer valid, avoid using |
| **Superseded** | Replaced by a newer ADR |

## Further Reading

- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Michael Nygard
- [ADR GitHub Organization](https://adr.github.io/)
- [When to Write an ADR](https://github.blog/2020-08-13-why-write-adrs/)

---

*Last Updated: February 2026*
