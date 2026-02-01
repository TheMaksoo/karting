# 🔄 Development Workflow

Complete guide to development processes, testing, code quality, and CI/CD.

## 🎯 Development Process

### 1. Setup Development Environment

```bash
# Clone repository
git clone https://github.com/TheMaksoo/karting.git
cd karting

# Backend setup
cd portal/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Frontend setup
cd ../frontend
npm install
cp .env.example .env.local

# Start development servers
# Terminal 1: Backend
cd portal/backend && php artisan serve

# Terminal 2: Frontend
cd portal/frontend && npm run dev
```

### 2. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes

Follow the [Coding Standards](#coding-standards) and make your changes.

### 4. Test Your Changes

Run tests before committing (see [Testing](#testing) section).

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🧪 Testing

### Backend Testing (PEST)

#### Run All Tests
```bash
cd portal/backend
php artisan test
```

#### Run Specific Test File
```bash
php artisan test tests/Feature/DriverControllerTest.php
```

#### Run Specific Test
```bash
php artisan test --filter "can list all drivers"
```

#### Run with Coverage
```bash
php artisan test --coverage
```

#### Run with Coverage HTML Report
```bash
php artisan test --coverage-html coverage
```

#### Run Parallel Tests (Faster)
```bash
php artisan test --parallel
```

#### Writing Tests

```php
// tests/Feature/ExampleTest.php
use App\Models\User;
use App\Models\Driver;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('can create a driver', function () {
    $response = $this->postJson('/api/drivers', [
        'name' => 'Test Driver',
        'color' => '#FF5733',
        'is_active' => true,
    ]);

    $response->assertStatus(201)
        ->assertJson(['name' => 'Test Driver']);

    $this->assertDatabaseHas('drivers', [
        'name' => 'Test Driver'
    ]);
});
```

### Frontend Testing (Vitest)

#### Run All Tests
```bash
cd portal/frontend
npm test
```

#### Run in Watch Mode
```bash
npm run test:watch
```

#### Run with Coverage
```bash
npm run test:coverage
```

#### Run Specific Test File
```bash
npm test -- DriverCard.spec.ts
```

#### Writing Tests

```typescript
// __tests__/DriverCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DriverCard from '@/components/DriverCard.vue'

describe('DriverCard', () => {
  it('renders driver name', () => {
    const wrapper = mount(DriverCard, {
      props: {
        driver: {
          id: 1,
          name: 'John Doe',
          color: '#FF5733',
          is_active: true
        }
      }
    })

    expect(wrapper.text()).toContain('John Doe')
  })
})
```

### Python Testing (pytest)

#### Run All Tests
```bash
cd data-importer/scripts
pytest
```

#### Run with Coverage
```bash
pytest --cov=.
```

#### Run Verbose
```bash
pytest -v
```

## 📏 Code Quality

### Backend (Laravel Pint)

#### Check Code Style
```bash
cd portal/backend
vendor/bin/pint --test
```

#### Fix Code Style
```bash
vendor/bin/pint
```

#### Configuration

Laravel Pint uses PSR-12 standard by default. Custom rules in `pint.json`:

```json
{
    "preset": "psr12",
    "rules": {
        "array_syntax": {
            "syntax": "short"
        },
        "no_unused_imports": true
    }
}
```

### Frontend (ESLint)

#### Check Code
```bash
cd portal/frontend
npm run lint
```

#### Fix Issues
```bash
npm run lint:fix
```

#### Type Check
```bash
npm run type-check
```

#### Configuration

ESLint 9.x flat config in `eslint.config.js`:

```javascript
export default [
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
]
```

### Code Formatting (Prettier)

```bash
cd portal/frontend
npm run format
```

Configuration in `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## 🔍 Static Analysis

### PHPStan (PHP)

```bash
cd portal/backend
vendor/bin/phpstan analyse
```

### SonarLint (IDE Integration)

Install SonarLint extension in your IDE for real-time code quality feedback.

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for automated CI/CD.

#### Workflow File: `.github/workflows/pipeline.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          
      - name: Install Dependencies
        run: |
          cd portal/backend
          composer install
          
      - name: Run Tests
        run: |
          cd portal/backend
          php artisan test --coverage
          
      - name: Run Pint
        run: |
          cd portal/backend
          vendor/bin/pint --test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: |
          cd portal/frontend
          npm ci
          
      - name: Run Tests
        run: |
          cd portal/frontend
          npm test
          
      - name: Run Linter
        run: |
          cd portal/frontend
          npm run lint
          
      - name: Build
        run: |
          cd portal/frontend
          npm run build

  deploy:
    needs: [backend-tests, frontend-tests]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Production
        run: |
          # Deployment steps
```

### Pipeline Stages

1. **Code Checkout**: Clone repository
2. **Backend Tests**: Run PEST tests, check code style
3. **Frontend Tests**: Run Vitest tests, run linter, build
4. **Python Tests**: Run pytest (if applicable)
5. **Quality Gates**: SonarCloud analysis
6. **Coverage**: Upload to Codecov
7. **Deploy**: Deploy to production (if main branch)

### SonarCloud Integration

Quality metrics tracked:
- **Code Coverage**: Target 80%+
- **Code Smells**: Target 0
- **Bugs**: Target 0
- **Vulnerabilities**: Target 0
- **Security Hotspots**: Target 0
- **Duplications**: Target <3%
- **Maintainability**: Target A rating

### Codecov Integration

Test coverage is uploaded to Codecov for tracking:

```yaml
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage.xml
    flags: backend
```

## 🛠️ Development Tools

### Recommended IDE

**Visual Studio Code** with extensions:
- PHP Intelephense
- Laravel Extension Pack
- Vue - Official
- ESLint
- Prettier
- SonarLint
- GitLens

### IDE Configuration

#### VSCode settings.json
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[php]": {
    "editor.defaultFormatter": "bmewburn.vscode-intelephense-client"
  },
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Docker Support (Future)

Docker support is planned for easier development setup:

```yaml
# docker-compose.yml (planned)
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./portal/backend:/var/www/html
      
  frontend:
    build: ./portal/frontend
    ports:
      - "5173:5173"
    volumes:
      - ./portal/frontend:/app
      
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: karting
      MYSQL_ROOT_PASSWORD: secret
```

## 📊 Performance Profiling

### Backend Profiling

#### Using Laravel Telescope

```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

Access at: `http://localhost:8000/telescope`

#### Using Laravel Debugbar

```bash
composer require barryvdh/laravel-debugbar --dev
```

Automatically shows in development environment.

### Frontend Profiling

#### Vue DevTools

Install Vue DevTools browser extension for:
- Component inspection
- State management debugging
- Performance profiling
- Timeline analysis

#### Vite Performance

```bash
npm run build -- --mode analyze
```

## 🐛 Debugging

### Backend Debugging

#### Xdebug Setup

```ini
; php.ini
zend_extension=xdebug.so
xdebug.mode=debug
xdebug.start_with_request=yes
xdebug.client_port=9003
```

#### VSCode Launch Configuration

```json
{
  "name": "Listen for Xdebug",
  "type": "php",
  "request": "launch",
  "port": 9003,
  "pathMappings": {
    "/var/www/html": "${workspaceFolder}/portal/backend"
  }
}
```

### Frontend Debugging

#### Browser DevTools

Use Chrome/Firefox DevTools:
- Console for errors
- Network tab for API calls
- Vue DevTools for component state

#### VSCode Debugging

```json
{
  "name": "Debug Frontend",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/portal/frontend/src"
}
```

## 📝 Documentation

### API Documentation

Generate Swagger docs:

```bash
cd portal/backend
php artisan l5-swagger:generate
```

Access at: `http://localhost:8000/api/documentation`

### Component Documentation

Document Vue components with JSDoc:

```vue
<script setup lang="ts">
/**
 * Driver card component
 * @component
 * @example
 * <DriverCard :driver="driverData" @click="handleClick" />
 */

interface Props {
  /** Driver information */
  driver: Driver
  /** Show detailed stats */
  detailed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  detailed: false
})
</script>
```

### PHPDoc Comments

```php
/**
 * Calculate session statistics
 *
 * @param KartingSession $session The session to calculate stats for
 * @return array<string, mixed> Statistics including best lap, average, etc.
 * @throws \InvalidArgumentException If session has no laps
 */
public function calculateStatistics(KartingSession $session): array
{
    // Implementation
}
```

## 🔧 Environment Management

### Environment Files

- `.env` - Local development (not committed)
- `.env.example` - Template (committed)
- `.env.testing` - Test environment (committed)
- `.env.production` - Production (server only)

### Environment Variables

#### Backend (.env)
```env
APP_NAME="Karting Dashboard"
APP_ENV=local
APP_DEBUG=true
DB_CONNECTION=sqlite
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

#### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 📋 Pre-commit Checklist

Before committing, ensure:

- [ ] All tests pass (backend, frontend, python)
- [ ] Code linting passes (Pint, ESLint)
- [ ] Type checking passes (TypeScript)
- [ ] No console.log statements (frontend)
- [ ] No dd() or dump() statements (backend)
- [ ] Documentation updated if needed
- [ ] Environment variables documented
- [ ] Commit message follows conventions

## 🚀 Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

1. Update CHANGELOG.md
2. Update version in package.json
3. Run full test suite
4. Tag release: `git tag v1.2.3`
5. Push tags: `git push --tags`
6. Create GitHub release
7. Deploy to production

## 📚 Further Reading

- [Laravel Testing](https://laravel.com/docs/testing)
- [PEST PHP](https://pestphp.com/)
- [Vitest](https://vitest.dev/)
- [ESLint](https://eslint.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

*Last Updated: February 2026*
