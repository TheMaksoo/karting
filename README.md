# 🏎️ Karting Dashboard

> **Enterprise-grade karting lap time tracking and analytics platform**  
> Automated EML parsing • Real-time analytics • Multi-track support • Production-ready

---

## 📊 Project Status

[![CI/CD Pipeline](https://github.com/TheMaksoo/karting/actions/workflows/pipeline.yml/badge.svg)](https://github.com/TheMaksoo/karting/actions/workflows/pipeline.yml)
[![codecov](https://codecov.io/gh/TheMaksoo/karting/branch/main/graph/badge.svg)](https://codecov.io/gh/TheMaksoo/karting)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/PHP-8.2+-blue.svg)](https://www.php.net/)
[![Node Version](https://img.shields.io/badge/Node-20+-green.svg)](https://nodejs.org/)
[![Laravel](https://img.shields.io/badge/Laravel-11-red.svg)](https://laravel.com)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-brightgreen.svg)](https://vuejs.org/)

### 🏆 SonarCloud Quality Metrics
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=coverage)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=bugs)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=TheMaksoo_karting&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=TheMaksoo_karting)

---

## 📚 Documentation

**[📖 View Complete Wiki Documentation](docs/wiki/Home.md)**

Quick Links:
- **[🚀 Getting Started](docs/wiki/Getting-Started.md)** - Installation and setup guide
- **[🏗️ Architecture Overview](docs/wiki/Architecture.md)** - System design and tech stack
- **[📡 API Reference](docs/wiki/API-Reference.md)** - Complete API documentation
- **[🎨 Frontend Guide](docs/wiki/Frontend-Guide.md)** - Vue 3 development guide
- **[🔧 Backend Guide](docs/wiki/Backend-Guide.md)** - Laravel development guide
- **[🔒 Security Guide](docs/wiki/Security.md)** - Security best practices
- **[🐛 Troubleshooting](docs/wiki/Troubleshooting.md)** - Common issues and solutions

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/TheMaksoo/karting.git
cd karting

# 2. Backend setup
cd portal/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

# 3. Frontend setup (new terminal)
cd portal/frontend
npm install
cp .env.example .env
npm run dev

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api
# API Docs: http://localhost:8000/api/documentation
```

📚 **Full Setup Guide**: See [SETUP.md](SETUP.md) for detailed configuration  
🚀 **Production Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker/K8s

---

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

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Vue 3 + TypeScript + Vite + Pinia | 3.5 / 5.9 / 6 / 2.3 |
| **Backend** | Laravel + PHP + Sanctum | 11 / 8.2+ / 4 |
| **Database** | MySQL / SQLite | 8.0 / 3 |
| **Cache** | Redis | 7+ |
| **Testing** | PEST + Vitest + pytest | Latest |
| **CI/CD** | GitHub Actions + SonarCloud | - |
| **Monitoring** | Sentry + Structured Logging | Latest |
| **Deployment** | Docker + Kubernetes | Latest |

---

## ✨ Features

### 🎯 Core Features
- 📧 **EML Upload**: Parse karting session emails with auto-track detection (7 tracks supported)
- 📊 **Real-time Analytics**: Live lap time analytics and performance trends
- 👥 **Multi-Driver**: Support unlimited drivers with color coding and statistics
- 🏁 **Multi-Track**: Track performance across different karting venues
- 🏆 **Trophy Case**: Personal bests, track records, and achievements
- 📈 **Performance Insights**: Lap time progression, consistency analysis

### 🔒 Enterprise Security
- 🔐 **HttpOnly Cookies**: XSS-proof session-based authentication
- 🚦 **Rate Limiting**: IP + per-user rate limiting (120 req/min)
- 🛡️ **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- 🔍 **Audit Logging**: Full CRUD operation tracking with user context
- ✅ **Input Validation**: XSS/SQL injection protection, file validation

### 🚀 Production Ready
- ✅ **990 Tests**: 554 backend + 407 frontend + 29 Python (100% passing)
- 📊 **Health Checks**: 4 endpoints for monitoring (`/api/health/*`)
- 📝 **Structured Logging**: JSON logs with user/request context
- 🐛 **Error Tracking**: Sentry integration with breadcrumbs
- 🐳 **Containerized**: Docker + Kubernetes deployment ready
- 🔄 **API Versioning**: `/api/v1/*` for backward compatibility

### 📚 Documentation
- 📖 **OpenAPI Docs**: Interactive Swagger UI at `/api/documentation`
- 📋 **Setup Guide**: [SETUP.md](SETUP.md) - Complete installation instructions
- 🚀 **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md) - Docker, K8s, cloud platforms
- 🤝 **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow
- 🛡️ **Branch Protection**: [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) - PR workflow
- 🔒 **Security**: [SECURITY.md](SECURITY.md) - Vulnerability reporting
- 🎯 **Project Overview**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Full transparency

---

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
