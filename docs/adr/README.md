# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for the Karting Dashboard project.

## What are ADRs?

Architecture Decision Records (ADRs) document important architectural decisions made during the development of the project. Each ADR describes:

- **Context**: What is the issue we're addressing?
- **Decision**: What is the change we're making?
- **Consequences**: What are the trade-offs?

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-001](001-use-laravel-for-backend.md) | Use Laravel for Backend | ✅ Accepted | 2024-01 |
| [ADR-002](002-use-vue3-for-frontend.md) | Use Vue 3 for Frontend | ✅ Accepted | 2024-01 |
| [ADR-003](003-use-sanctum-for-authentication.md) | Use Laravel Sanctum for Authentication | ✅ Accepted | 2024-01 |
| [ADR-004](004-use-mysql-database.md) | Use MySQL for Database | ✅ Accepted | 2024-01 |
| [ADR-005](005-use-pest-for-testing.md) | Use PEST for Backend Testing | ✅ Accepted | 2024-06 |
| [ADR-006](006-use-pinia-for-state-management.md) | Use Pinia for State Management | ✅ Accepted | 2024-01 |
| [ADR-007](007-eml-parsing-strategy.md) | EML Email Parsing Strategy | ✅ Accepted | 2024-03 |
| [ADR-008](008-api-versioning-strategy.md) | API Versioning Strategy | ✅ Accepted | 2025-01 |
| [ADR-009](009-caching-strategy.md) | Caching Strategy | ✅ Accepted | 2025-06 |
| [ADR-010](010-error-tracking-with-sentry.md) | Error Tracking with Sentry | ✅ Accepted | 2025-12 |

## Creating a New ADR

1. Copy `template.md` to a new file: `XXX-title-with-dashes.md`
2. Fill in all sections
3. Add to the index above
4. Submit a PR for review

## ADR Statuses

- **Proposed**: Under discussion
- **Accepted**: Decision has been made and implemented
- **Deprecated**: No longer valid, superseded by another decision
- **Superseded**: Replaced by a newer ADR

## Further Reading

- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Michael Nygard
- [ADR GitHub Organization](https://adr.github.io/)
