# 🏗️ Architecture Overview

This document provides a comprehensive overview of the Karting Dashboard architecture, technology stack, and design decisions.

## 🎯 System Architecture

The Karting Dashboard follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│            Vue 3 + TypeScript + Vite                     │
│         (SPA - Single Page Application)                  │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/REST API
                  │ JSON
┌─────────────────▼───────────────────────────────────────┐
│                   Backend Layer                          │
│          Laravel 12 + PHP 8.2 + Sanctum                  │
│         (RESTful API + Authentication)                   │
└─────────────────┬───────────────────────────────────────┘
                  │ SQL Queries
                  │ Eloquent ORM
┌─────────────────▼───────────────────────────────────────┐
│                  Database Layer                          │
│         MySQL 8.0 / SQLite (development)                 │
│            (Relational Database)                         │
└─────────────────────────────────────────────────────────┘
```

## 📦 Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vue.js** | 3.5 | Progressive JavaScript framework |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **Vite** | 6.0 | Fast build tool and dev server |
| **Pinia** | 2.x | State management |
| **Vue Router** | 4.x | Client-side routing |
| **Chart.js** | 4.x | Data visualization |
| **Axios** | 1.x | HTTP client |
| **Vitest** | 2.x | Unit testing framework |
| **ESLint** | 9.x | Code linting |
| **vue-toastification** | 2.x | Toast notifications |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Laravel** | 12.x | PHP web framework |
| **PHP** | 8.2+ | Server-side language |
| **Sanctum** | 4.x | API authentication |
| **Eloquent ORM** | - | Database abstraction |
| **PEST** | 2.x | Testing framework |
| **Laravel Pint** | 1.x | Code style fixer |
| **L5-Swagger** | 8.x | API documentation |
| **Composer** | 2.x | Dependency manager |

### Database & Storage

| Technology | Purpose |
|------------|---------|
| **MySQL 8.0** | Production database |
| **SQLite** | Development database |
| **Redis** | Caching (optional) |

### DevOps & Quality

| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | CI/CD pipeline |
| **SonarCloud** | Code quality analysis |
| **Codecov** | Test coverage reporting |
| **Docker** | Future containerization |

## 📁 Project Structure

```
karting/
├── docs/
│   └── wiki/                    # Documentation (this wiki)
├── portal/
│   ├── backend/                 # Laravel API Backend
│   │   ├── app/
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/
│   │   │   │   │   ├── API/    # 16 API Controllers
│   │   │   │   │   └── HealthController.php
│   │   │   │   ├── Middleware/ # 7 Middleware
│   │   │   │   ├── Requests/   # 6 FormRequest validators
│   │   │   │   └── Traits/     # Reusable traits
│   │   │   ├── Models/         # 11 Eloquent Models
│   │   │   └── Services/       # 4 Business Logic Services
│   │   ├── config/             # Configuration files
│   │   ├── database/
│   │   │   └── migrations/     # 30+ database migrations
│   │   ├── routes/
│   │   │   └── api.php         # API route definitions
│   │   ├── storage/
│   │   │   └── api-docs/       # Generated API docs
│   │   └── tests/
│   │       ├── Feature/        # 21 Feature tests
│   │       └── Unit/           # 3 Unit tests
│   └── frontend/               # Vue SPA Frontend
│       ├── src/
│       │   ├── assets/         # Static assets
│       │   ├── components/     # 62 Vue components
│       │   │   ├── admin/      # Admin components
│       │   │   ├── charts/     # Chart components
│       │   │   ├── filters/    # Filter components
│       │   │   ├── home/       # Home view components
│       │   │   ├── icons/      # Icon components
│       │   │   └── layout/     # Layout components
│       │   ├── composables/    # 11 Reusable logic
│       │   ├── router/         # Route definitions
│       │   ├── services/       # API services
│       │   │   └── api/        # Type-safe API client
│       │   ├── stores/         # Pinia stores
│       │   ├── types/          # TypeScript definitions
│       │   ├── utils/          # Utility functions
│       │   ├── views/          # 24 Page views
│       │   ├── App.vue         # Root component
│       │   └── main.ts         # Application entry
│       └── tests/              # 36 test files
├── data-importer/              # Python Data Processing (Legacy)
│   ├── scripts/                # Python scripts
│   ├── data/                   # Historical CSV data
│   └── eml-samples/            # Sample EML files
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── pipeline.yml        # Main CI/CD pipeline
│       └── auto-fix.yml        # Automated fixes
└── [config files]              # Various config files
```

## 🔄 Request Flow

### Typical API Request Flow

```
User Action (Frontend)
    ↓
Vue Component
    ↓
Pinia Store Action
    ↓
API Service (Axios)
    ↓
HTTP Request (JSON)
    ↓
Laravel Route (routes/api.php)
    ↓
Middleware Stack
    ├── Authentication (Sanctum)
    ├── Rate Limiting
    └── CORS
    ↓
Controller Method
    ↓
FormRequest Validation
    ↓
Service Layer (Business Logic)
    ↓
Eloquent Model
    ↓
Database Query
    ↓
JSON Response
    ↓
Frontend State Update
    ↓
UI Re-render
```

### Example: Fetching Driver Statistics

1. **User clicks** on driver card in UI
2. **Vue component** calls `driverStore.loadDriverStats(driverId)`
3. **Pinia store** calls `DriversApi.getDriverStats(driverId)`
4. **API service** sends `GET /api/drivers/{id}/stats`
5. **Laravel route** matches request to `DriverController@stats`
6. **Middleware** checks authentication and rate limits
7. **Controller** validates request and calls `SessionCalculatorService`
8. **Service** queries database using Eloquent:
   ```php
   $driver->kartingSessions()
       ->with(['laps', 'track'])
       ->where('is_active', true)
       ->get();
   ```
9. **Service** calculates statistics (best lap, averages, etc.)
10. **Controller** returns JSON response
11. **Frontend** receives data and updates Pinia store
12. **Vue** reactively updates component UI

## 🔐 Authentication Flow

The application uses **Laravel Sanctum** for API authentication:

```
┌─────────────────────────────────────────┐
│  1. User submits login credentials      │
│     POST /api/auth/login                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  2. AuthController validates            │
│     credentials against database        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  3. Generate Sanctum Bearer Token       │
│     with 24-hour expiration             │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  4. Return token to frontend            │
│     { token: "1|abc...", user: {...} }  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  5. Frontend stores token in            │
│     localStorage and Pinia store        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  6. All subsequent API requests         │
│     include: Authorization: Bearer {...}│
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  7. Sanctum middleware validates token  │
│     and authenticates user              │
└─────────────────────────────────────────┘
```

## 🗄️ Database Design

### Core Entities

The database follows a **normalized relational design**:

```
users ─────────┐
               │
               ├──< user_driver >──── drivers
               │                         │
               └──< friends              │
                                         │
tracks ────────────────────────────────< karting_sessions
                                         │
                                         └──< laps

settings ──── user_settings
```

### Key Relationships

1. **Users ↔ Drivers**: Many-to-Many
   - Users can manage multiple drivers
   - One driver can be the "main" driver per user

2. **Drivers ↔ Sessions**: One-to-Many
   - Each driver has many sessions
   - Each session belongs to one driver

3. **Sessions ↔ Laps**: One-to-Many
   - Each session contains many laps
   - Each lap belongs to one session

4. **Tracks ↔ Sessions**: One-to-Many
   - Each track has many sessions
   - Each session occurs at one track

5. **Users ↔ Friends**: Many-to-Many (self-referential)
   - Users can have many friends
   - Friendship is bidirectional

See [Database Schema](Database-Schema.md) for complete details.

## ⚡ Performance Optimizations

### Backend Optimizations

1. **Database Indexing**
   - Indexes on `laps.lap_time` for sorting
   - Indexes on `drivers.name`, `drivers.is_active`
   - Indexes on `karting_sessions.session_type`

2. **Eager Loading**
   - Use `with()` to prevent N+1 queries
   - Pre-load relationships in controllers

3. **Query Caching**
   - Cache driver statistics (1 hour)
   - Cache track statistics (1 hour)

4. **Rate Limiting**
   - 60 requests per minute for authenticated routes
   - 5 requests per minute for login/register

### Frontend Optimizations

1. **Code Splitting**
   - Route-based code splitting with Vue Router
   - Lazy loading of components

2. **Asset Optimization**
   - Vite automatically minifies and bundles
   - Tree-shaking removes unused code

3. **State Management**
   - Pinia stores cache API responses
   - Computed properties for derived state

4. **Rendering Optimization**
   - Virtual scrolling for large lap lists
   - Skeleton loaders for better UX

## 🔒 Security Architecture

### Defense Layers

1. **Authentication**: Laravel Sanctum bearer tokens
2. **Authorization**: Policy-based access control
3. **Input Validation**: FormRequest classes
4. **Input Sanitization**: XSS prevention service
5. **Rate Limiting**: Throttle middleware
6. **HTTPS**: Enforced in production
7. **CORS**: Strict origin validation
8. **CSP**: Content Security Policy headers
9. **SQL Injection**: Eloquent ORM protection
10. **Password Security**: Bcrypt hashing with minimum requirements

See [Security Best Practices](Security.md) for details.

## 📊 Testing Strategy

### Test Pyramid

```
        ┌────────────┐
        │   E2E      │  (Future)
        └────────────┘
      ┌──────────────────┐
      │   Integration    │  (Feature Tests - 21)
      └──────────────────┘
    ┌──────────────────────┐
    │   Unit Tests         │  (Unit Tests - 3 + Component Tests - 407)
    └──────────────────────┘
```

### Test Coverage

- **Backend**: 554 tests (PEST) - Controllers, Services, Models
- **Frontend**: 407 tests (Vitest) - Components, Composables, Stores
- **Python**: 29 tests (pytest) - Data processing scripts

## 🚀 Deployment Architecture

### Development
```
Developer Machine
├── PHP Built-in Server (port 8000)
├── Vite Dev Server (port 5173)
└── SQLite Database
```

### Production
```
cPanel Shared Hosting
├── Apache/Nginx
├── PHP-FPM
├── MySQL Database
└── Static Frontend Files
```

See [Deployment Guide](Deployment-Guide.md) for details.

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```
Push to main branch
    ↓
┌───────────────────┐
│  Checkout code    │
└────────┬──────────┘
         │
┌────────▼──────────┐
│  Backend Pipeline │
│  - Install deps   │
│  - Run PEST tests │
│  - Run Pint       │
└────────┬──────────┘
         │
┌────────▼──────────┐
│ Frontend Pipeline │
│  - Install deps   │
│  - Build (Vite)   │
│  - Run Vitest     │
│  - Run ESLint     │
└────────┬──────────┘
         │
┌────────▼──────────┐
│  Quality Checks   │
│  - SonarCloud     │
│  - Codecov        │
└────────┬──────────┘
         │
┌────────▼──────────┐
│  Deploy to Prod   │
│  - FTP Upload     │
│  - Run Migrations │
│  - Cache Config   │
└───────────────────┘
```

## 🎨 Design Patterns

### Backend Patterns

1. **Repository Pattern**: Through Eloquent Models
2. **Service Layer**: Business logic separation
3. **Dependency Injection**: Laravel Container
4. **Form Request Objects**: Validation separation
5. **API Resources**: Response transformation
6. **Middleware Pattern**: Request pipeline
7. **Observer Pattern**: Eloquent events

### Frontend Patterns

1. **Composition API**: Vue 3 pattern
2. **Composables**: Reusable logic extraction
3. **Store Pattern**: Pinia state management
4. **Component Composition**: Atomic design
5. **Dependency Injection**: Vue's provide/inject
6. **Observer Pattern**: Reactive state

## 📈 Scalability Considerations

### Current Scale
- **Users**: 1-100 concurrent users
- **Data**: ~100K laps, ~1K sessions
- **Storage**: ~500MB database

### Future Scalability Options

1. **Horizontal Scaling**
   - Load balancer + multiple app servers
   - Read replicas for database

2. **Caching Layer**
   - Redis for session storage
   - Query result caching

3. **CDN Integration**
   - Static asset delivery
   - Frontend build artifacts

4. **Database Optimization**
   - Partitioning large tables
   - Archive old sessions

## 🔧 Configuration Management

### Environment-Based Configuration

- **Development**: `.env` with debug enabled, SQLite
- **Testing**: `.env.testing` with in-memory database
- **Production**: Environment variables from hosting provider

### Feature Flags

Future implementation for gradual feature rollout.

## 📚 Further Reading

- [Frontend Guide](Frontend-Guide.md) - Detailed frontend architecture
- [Backend Guide](Backend-Guide.md) - Detailed backend architecture
- [Database Schema](Database-Schema.md) - Complete database structure
- [Development Workflow](Development-Workflow.md) - Development processes

---

*Last Updated: February 2026*
