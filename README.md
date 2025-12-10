# Karting Portal

Full-stack karting lap time tracking and analytics platform.

## 🚀 Quick Start

1. Clone repo
2. Add [GitHub Secrets](SETUP.md)
3. Push to deploy

See [SETUP.md](SETUP.md) for detailed instructions.

## 🛠 Local Development

```bash
# Backend
cd portal/backend
composer install
php artisan migrate
php artisan serve

# Frontend
cd portal/frontend
npm install
npm run dev
```

## 📦 Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Laravel 10 + PHP 8.2
- **Database**: MySQL
- **Hosting**: cPanel (auto-deploy via GitHub Actions)

## ✨ Features

- EML session upload with auto-track detection
- Real-time lap time analytics
- Driver performance tracking
- Multi-track support
- Automated deployments
