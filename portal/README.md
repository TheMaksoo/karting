# 🏎️ Karting Portal

Modern web application for karting session management, analysis, and visualization.

## 🎯 Features

- 📊 **Analytics Dashboard** - Comprehensive lap time analysis and driver statistics
- 🗺️ **Geographic Tracking** - Track location and regional performance analysis  
- 👥 **Driver Management** - Track multiple drivers and their progress
- 🏁 **Track Database** - Comprehensive track information with specs and pricing
- 📤 **Session Upload** - Import lap data from EML, CSV, or TXT files
- ✍️ **Manual Entry** - Add individual laps directly
- 🔐 **Admin Controls** - Track management, data uploads (admin-only)

## 🏗️ Tech Stack

### Backend
- **Laravel 12** - PHP framework
- **MySQL** - Database
- **Sanctum** - API authentication

### Frontend  
- **Vue 3** - JavaScript framework
- **TypeScript** - Type safety
- **Pinia** - State management
- **Chart.js** - Data visualization
- **Tailwind CSS** - Modern styling

## 🚀 Quick Start

### Backend Setup

```bash
cd portal/backend

# Install dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed

# Start server
php artisan serve
```

Backend will run at: `http://127.0.0.1:8000`

### Frontend Setup

```bash
cd portal/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: `http://localhost:5173`

## 🔐 Default Credentials

```
Email: maxvanlierop05@gmail.com
Password: admin123
```

## 📚 API Documentation

The backend provides 31 REST API endpoints:

- **Authentication**: Login, register, logout, user management
- **Drivers**: CRUD operations, statistics
- **Tracks**: CRUD operations, search
- **Sessions**: CRUD operations, filtering
- **Laps**: CRUD operations, analysis
- **Upload**: EML/CSV/TXT parsing and import

Full API documentation: See `portal/backend/BACKEND_COMPLETE.md`

## 🎨 Modern Design

The portal features a sleek, modern interface with:
- 🌓 Glassmorphism effects
- 🎭 Smooth animations
- 📱 Fully responsive design
- 🎨 Color-coded data visualization
- ⚡ Fast, reactive UI

## 🔒 Security

- **Admin-only features**: Track management, data uploads
- **Role-based access**: Admin and driver roles
- **Token authentication**: Sanctum bearer tokens
- **Input validation**: Frontend and backend validation

## 📁 Project Structure

```
portal/
├── backend/              # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/API/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   └── routes/
│
└── frontend/            # Vue application
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── views/       # Page views
    │   ├── stores/      # Pinia stores
    │   ├── services/    # API client
    │   └── router/      # Vue Router
    └── public/
```

## 🧪 Testing

```bash
# Backend tests
cd portal/backend
php artisan test

# Frontend tests  
cd portal/frontend
npm run test
```

## 📦 Deployment

See `DEPLOYMENT_GUIDE.md` for production deployment instructions.

## 📄 License

This is a private project for karting data management.

## 👥 Contributors

- Max van Lierop - Project Owner
