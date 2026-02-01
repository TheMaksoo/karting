# Contributing to Karting Dashboard

Thank you for your interest in contributing to the Karting Dashboard project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and inclusive in all interactions. We welcome contributions from everyone and strive to maintain a positive and collaborative environment.

## Getting Started

1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/karting.git
   cd karting
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/karting.git
   ```

## Development Setup

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- npm or yarn
- MySQL 8.0+
- Python 3.10+ (for data importer)

### Backend Setup

```bash
cd portal/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

### Frontend Setup

```bash
cd portal/frontend
npm install
cp .env.example .env.local
```

### Python Data Importer Setup

```bash
cd data-importer/scripts
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Application

```bash
# Terminal 1: Backend
cd portal/backend
php artisan serve

# Terminal 2: Frontend
cd portal/frontend
npm run dev
```

## Coding Standards

### PHP (Backend)

- Follow PSR-12 coding standard
- Use Laravel Pint for formatting:
  ```bash
  cd portal/backend
  vendor/bin/pint
  ```
- Add PHPDoc comments to all public methods
- Use strict types: `declare(strict_types=1);`
- Write tests for new features

### TypeScript/Vue (Frontend)

- Use ESLint and Prettier for formatting:
  ```bash
  cd portal/frontend
  npm run lint
  npm run format
  ```
- Use TypeScript strict mode
- Add JSDoc comments to components and functions
- Use Composition API for Vue components
- Write tests for new components

### Python

- Follow PEP 8 style guide
- Use type hints for function parameters and returns
- Run tests with pytest:
  ```bash
  cd data-importer/scripts
  pytest
  ```

## Submitting Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-lap-analytics`
- `fix/login-validation-error`
- `docs/update-api-readme`
- `refactor/split-controller`

### Commit Messages

Follow conventional commits format:
```
type(scope): short description

Longer description if needed.

Fixes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Update your fork** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make your changes** and commit them

4. **Run all tests** before submitting:
   ```bash
   # Backend
   cd portal/backend && composer test

   # Frontend
   cd portal/frontend && npm test

   # Python
   cd data-importer/scripts && pytest
   ```

5. **Run linting**:
   ```bash
   # Backend
   cd portal/backend && vendor/bin/pint --test

   # Frontend
   cd portal/frontend && npm run lint
   cd portal/frontend && npm run type-check
   ```

6. **Push your branch** and create a Pull Request

7. **Fill out the PR template** with:
   - Description of changes
   - Related issue numbers
   - Screenshots (for UI changes)
   - Test coverage information

## Testing

### Backend Tests (PEST/PHPUnit)

```bash
cd portal/backend

# Run all tests
composer test

# Run specific test file
vendor/bin/pest tests/Feature/DriverControllerTest.php

# Run with coverage
vendor/bin/pest --coverage
```

### Frontend Tests (Vitest)

```bash
cd portal/frontend

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Python Tests (pytest)

```bash
cd data-importer/scripts

# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test
pytest tests/test_session_parser.py
```

## Documentation

- Update README.md if adding new features
- Add JSDoc/PHPDoc comments to new code
- Update API documentation for endpoint changes
- Include code examples in documentation

### API Documentation

We use OpenAPI/Swagger for API documentation. After making API changes:

1. Update the OpenAPI annotations in controllers
2. Generate updated documentation:
   ```bash
   cd portal/backend
   php artisan l5-swagger:generate
   ```

## Questions?

If you have questions or need help:
- Open an issue on GitHub
- Check existing issues and PRs for similar topics
- Review the README.md and other documentation

Thank you for contributing! 🏎️
