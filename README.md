# 🏎️ Karting Dashboard

Full-stack karting lap time tracking and analytics platform with automated EML parsing, driver performance analytics, and multi-track support.

[![CI/CD Pipeline](https://github.com/TheMaksoo/karting/actions/workflows/ci.yml/badge.svg)](https://github.com/TheMaksoo/karting/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/TheMaksoo/karting/branch/main/graph/badge.svg)](https://codecov.io/gh/TheMaksoo/karting)

### SonarCloud Quality Metrics
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=coverage)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=bugs)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)

## 🚀 Quick Start

1. Clone the repository
2. Configure [GitHub Secrets](SETUP.md) for deployment
3. Push to deploy automatically

See [SETUP.md](SETUP.md) for detailed setup instructions.

## 🛠 Local Development

### Backend (Laravel)

```bash
cd portal/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend (Vue)

```bash
cd portal/frontend
npm install
npm run dev
```

### Testing

```bash
# Backend tests (PEST)
cd portal/backend
composer test

# Frontend tests (Vitest)
cd portal/frontend
npm test

# Python tests (pytest)
cd data-importer/scripts
pytest
```

### Code Quality

```bash
# PHP linting
cd portal/backend
vendor/bin/pint

# Frontend linting
cd portal/frontend
npm run lint

# Type checking
npm run type-check
```

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vue 3.5 + TypeScript 5.9 + Vite 6 + Pinia |
| **Backend** | Laravel 12 + PHP 8.2 + Sanctum |
| **Database** | MySQL 8.0 |
| **Testing** | PEST (PHP), Vitest (JS), pytest (Python) |
| **CI/CD** | GitHub Actions + SonarQube |

## ✨ Features

- 📧 **EML Upload**: Parse karting session emails with auto-track detection
- 📊 **Analytics**: Real-time lap time analytics and performance trends
- 👥 **Drivers**: Multi-driver support with color coding and statistics
- 🏁 **Tracks**: Multi-track support with location and lap records
- 🏆 **Trophy Case**: Personal bests, track records, and achievements
- 🔄 **Health Monitoring**: `/api/health` endpoints for monitoring
- 🚀 **Automated Deployment**: Push to main for automatic deployment

## 📁 Project Structure

```
karting/
├── portal/
│   ├── backend/         # Laravel API
│   └── frontend/        # Vue SPA
├── data-importer/       # Python data processing
├── .github/workflows/   # CI/CD pipeline
└── TODO.md             # Improvement roadmap
```

## 🔗 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check status |
| `GET /api/health/detailed` | Full system status |
| `POST /api/auth/login` | User authentication |
| `GET /api/drivers` | List all drivers |
| `GET /api/tracks` | List all tracks |
| `GET /api/sessions` | List karting sessions |
| `POST /api/upload/eml` | Upload EML session file |

## 📋 Development Roadmap

See [TODO.md](TODO.md) for the complete list of 87 identified improvements across:

- 🔐 Security (rate limiting, input validation)
- ⚡ Performance (caching, indexes, query optimization)
- 📝 Code Quality (service extraction, FormRequests)
- 📚 Documentation (API docs, deployment guides)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `composer test && npm test`
4. Run linting: `vendor/bin/pint && npm run lint`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
