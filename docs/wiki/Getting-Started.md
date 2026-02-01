# 🚀 Getting Started Guide

This guide will help you get the Karting Dashboard up and running on your local machine.

## 📋 Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| **PHP** | 8.2+ | Backend runtime |
| **Composer** | 2.x | PHP dependency management |
| **Node.js** | 18+ | Frontend build tools |
| **npm** | 9+ | JavaScript package manager |
| **MySQL** | 8.0+ | Database (or SQLite for development) |
| **Python** | 3.10+ | Data importer scripts (legacy) |

### Optional Tools
- **Git** - Version control
- **Docker** - Containerized development (coming soon)
- **Redis** - Caching (production)

## 🛠 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/TheMaksoo/karting.git
cd karting
```

### 2. Backend Setup (Laravel)

```bash
cd portal/backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
# For development, SQLite is pre-configured
# For production, configure MySQL settings

# Run database migrations
php artisan migrate

# Seed initial data (optional)
php artisan db:seed

# Generate Swagger API documentation
php artisan l5-swagger:generate

# Start development server
php artisan serve
```

Backend will be available at `http://localhost:8000`

### 3. Frontend Setup (Vue)

```bash
cd portal/frontend

# Install JavaScript dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure API endpoint in .env.local
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 4. Python Data Importer Setup (Optional)

The Python data importer is legacy and not required for normal operation. Skip this unless you need to import historical data.

```bash
cd data-importer/scripts

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest
```

## 🎯 Quick Start Development

### Terminal 1: Backend
```bash
cd portal/backend
php artisan serve
```

### Terminal 2: Frontend
```bash
cd portal/frontend
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/documentation

## 🔐 Initial Login

After seeding, use these credentials:
- **Email**: `admin@example.com`
- **Password**: `password`

⚠️ **Change these credentials immediately in production!**

## 📤 Uploading Session Data

The Karting Dashboard supports multiple data formats:

### 1. EML Files
Upload email files (.eml) from karting tracks. The system automatically:
- Detects the track from email content
- Parses lap times and session data
- Creates drivers automatically
- Calculates statistics

**Supported Tracks**:
- Circuit Park Berghem
- De Voltage
- Elche
- Experience Factory Antwerp
- Gilesias
- Goodwill Karting
- Lot66

### 2. CSV Files
Upload CSV files with lap data in the format:
```csv
Driver Name,Lap Number,Lap Time,Session Date
John Doe,1,45.123,2024-01-15
```

### 3. Manual Entry
Use the web interface to manually enter:
- Session information
- Driver details
- Individual lap times

## ✅ Verify Installation

### Check Backend Health
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T12:00:00Z"
}
```

### Check Frontend Build
```bash
cd portal/frontend
npm run build
```

Should complete without errors.

### Run All Tests
```bash
# Backend tests
cd portal/backend
composer test

# Frontend tests
cd portal/frontend
npm test

# Python tests
cd data-importer/scripts
pytest
```

## 🔧 Configuration

### Backend Configuration (.env)

Key settings in `portal/backend/.env`:

```env
# Application
APP_NAME="Karting Dashboard"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=sqlite  # or mysql for production
DB_DATABASE=/absolute/path/to/database.sqlite

# For MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=karting
# DB_USERNAME=root
# DB_PASSWORD=

# Sanctum Authentication
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost

# Rate Limiting
THROTTLE_RATE_LIMIT=60

# Cache (for production)
CACHE_DRIVER=file  # or redis
```

### Frontend Configuration (.env.local)

Key settings in `portal/frontend/.env.local`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Application Settings
VITE_APP_NAME="Karting Dashboard"
VITE_APP_VERSION=1.0.0
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Class not found" errors
```bash
cd portal/backend
composer dump-autoload
php artisan clear-compiled
php artisan optimize
```

#### 2. Frontend API connection issues
Check CORS settings in `portal/backend/config/cors.php`:
```php
'allowed_origins' => ['http://localhost:5173'],
```

#### 3. Database connection issues
```bash
cd portal/backend
php artisan migrate:fresh --seed
```

#### 4. Permission errors (Linux/Mac)
```bash
cd portal/backend
chmod -R 775 storage bootstrap/cache
chown -R $USER:www-data storage bootstrap/cache
```

See [Troubleshooting Guide](Troubleshooting.md) for more solutions.

## 📚 Next Steps

Now that you have the application running:

1. **Explore the code**: Read the [Architecture Overview](Architecture.md)
2. **Understand the frontend**: Check the [Frontend Guide](Frontend-Guide.md)
3. **Learn the backend**: Review the [Backend Guide](Backend-Guide.md)
4. **Make changes**: Follow the [Development Workflow](Development-Workflow.md)
5. **Contribute**: Read the [Contributing Guidelines](Contributing.md)

## 🆘 Getting Help

- **Documentation**: Check other wiki pages
- **Issues**: [GitHub Issues](https://github.com/TheMaksoo/karting/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheMaksoo/karting/discussions)

---

*Last Updated: February 2026*
