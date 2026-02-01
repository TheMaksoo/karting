# Karting Dashboard - AI Assistant Instructions

## Project Overview
Karting Dashboard is a full-stack karting lap time tracking and analytics platform.

## Tech Stack

### Backend
- **Framework**: Laravel 12 + PHP 8.2
- **Database**: MySQL 8.0
- **Auth**: Laravel Sanctum
- **Testing**: PEST (554 tests)
- **Docs**: OpenAPI/Swagger (L5-Swagger)

### Frontend
- **Framework**: Vue 3.5 + TypeScript 5.9
- **Build**: Vite 6
- **State**: Pinia
- **Testing**: Vitest (407 tests)
- **Styling**: CSS with dark/light mode

### Python
- **Scripts**: Data importer in `data-importer/`
- **Testing**: pytest (29 tests)

## Project Structure
```
portal/backend/     # Laravel API
portal/frontend/    # Vue SPA
data-importer/      # Python scripts
docs/wiki/          # GitHub Wiki source
docs/adr/           # Architecture Decision Records
```

## Coding Conventions

### Backend (Laravel)
- Use FormRequest classes for validation
- Use Service classes for business logic (not in controllers)
- Use PEST for testing with `describe()` and `it()` blocks
- Follow PSR-12 (Laravel Pint)
- Add OpenAPI attributes to controllers

### Frontend (Vue)
- Use Composition API with `<script setup lang="ts">`
- Use composables for reusable logic (`use*.ts`)
- Use Pinia stores for state management
- Strict TypeScript (no `any`)
- Follow ESLint + Prettier rules

### General
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- Check existing patterns before implementing
- Update `TODO.md` when completing tasks
- Update `docs/wiki/` for documentation changes
- Run tests after code changes

## Workflow
1. Read existing code patterns first
2. Implement following existing conventions
3. Update TODO.md if completing an item
4. Update wiki docs if relevant
5. Run tests to verify (990 total must pass)
6. Commit with conventional commit message

## Key Files
- `TODO.md` - Task tracking (64/87 completed)
- `docs/wiki/` - GitHub Wiki source files
- `docs/adr/` - Architecture Decision Records
- `.github/workflows/` - CI/CD pipelines

## Testing Commands
```bash
# Backend
cd portal/backend && composer test

# Frontend
cd portal/frontend && npm test

# Python
cd data-importer/scripts && pytest
```

## Important Notes
- Wiki links use format `[Title](Page-Name)` (no .md extension)
- External links use full GitHub URLs
- Pagination already implemented on drivers/tracks endpoints
- Sentry configured for error tracking
- Rate limiting enabled on all API routes
