# 🏎️ Karting Portal# 🏎️ Karting Management Portal



Professional karting analytics dashboard with **automatic deployment** to Namecheap.Modern web application for comprehensive karting session management, lap time analysis, and driver performance tracking.



**Vue 3 + Laravel 12 + Auto-Deploy via GitHub Actions**> **Note**: This project has been restructured. Legacy Python scripts moved to `data-importer/`. Main application is in `portal/`.



---## ✨ Features



## 🚀 Deploy to Production- 📊 **Real-time Analytics** - Interactive charts and performance metrics

- 🗺️ **Geographic Analysis** - Track locations and regional statistics

**See [DEPLOY.md](DEPLOY.md)** - 3 steps, 5 minutes total.- 👥 **Driver Management** - Multi-driver tracking and comparisons

- 🏁 **Track Database** - Complete track specs, pricing, and features

1. Fill in `secrets.json` with your values- 📤 **Smart Upload** - Parse EML/CSV/TXT files automatically

2. Push to GitHub- ✍️ **Manual Entry** - Add individual laps when needed

3. Add secrets from `secrets.json` to GitHub- 🔐 **Admin Controls** - Secure track and data management

4. Push again → Live in 5 minutes! 🎉- 📱 **Responsive Design** - Works on desktop, tablet, and mobile



---## 🚀 Quick Start



## 💻 Local Development### Option 1: Use the Portal (Recommended)



### Backend (Laravel)```bash

```bash# Backend

cd portal/backendcd portal/backend

composer installcomposer install

cp .env.example .envcp .env.example .env

php artisan key:generatephp artisan key:generate

php artisan migratephp artisan migrate

php artisan servephp artisan serve

```

# Frontend (new terminal)

### Frontend (Vue)cd portal/frontend

```bashnpm install

cd portal/frontendnpm run dev

npm install```

npm run dev

```Visit `http://localhost:5173` and login with:

- Email: `maxvanlierop05@gmail.com`

**Access:** http://localhost:5173  - Password: `admin123`

**API:** http://127.0.0.1:8000

### Option 2: Legacy Python Scripts

**Login:**

- Admin: admin@karting.com / password```bash

- Driver: driver@karting.com / passwordcd data-importer/scripts

pip install requests beautifulsoup4

---python process_karting_sessions.py

```

## ✨ Features

See `data-importer/README.md` for details.

- 📊 Real-time Analytics

- 🗺️ Track Mapping (OpenStreetMap)## 📁 Project Structure

- 📈 Performance Charts

- 🔐 Secure Authentication```

- 🎨 Elite Dark Themekarting/

- 🚀 Auto-Deploy to Namecheap├── portal/                      # Main application

│   ├── backend/                 # Laravel API

---│   └── frontend/                # Vue 3 UI

│

## 🔧 Tech Stack├── data-importer/               # Legacy tools

│   ├── scripts/                 # Python scripts

**Frontend:** Vue 3, TypeScript, Vite, Chart.js, Leaflet  │   ├── data/                    # CSV files

**Backend:** Laravel 12, MySQL, JWT  │   └── eml-samples/             # Sample EML files

**Deploy:** GitHub Actions, FTP│

└── docs/                        # Documentation

---```

## 🏗️ Tech Stack

## 📚 Documentation

- **Backend**: Laravel 12, MySQL, Sanctum authentication

- **[DEPLOY.md](DEPLOY.md)** - Production deployment guide- **Frontend**: Vue 3, TypeScript, Pinia, Chart.js

- **secrets.json** - Your deployment credentials (edit this!)- **Legacy**: Python scripts for historical data import

- **secrets.example.json** - Template for secrets

## 📖 Documentation

---

- **Portal Guide**: See `portal/README.md`

**Built with ❤️ for karting enthusiasts**  - **API Docs**: See `portal/backend/BACKEND_COMPLETE.md`

🏁 Just push to deploy! 🚀- **Legacy Tools**: See `data-importer/README.md`

- **Restructure Plan**: See `RESTRUCTURE_PLAN.md`

## 🔐 Default Credentials

```
Email: maxvanlierop05@gmail.com
Password: admin123
Role: Admin
```

## 🎯 Key Features

### For Admins
- ✅ Track management (add/edit/delete)
- ✅ Upload session data (EML/CSV/TXT)
- ✅ Manual lap entry
- ✅ Driver management
- ✅ System settings

### For All Users
- ✅ View analytics and charts
- ✅ Track personal performance
- ✅ Compare with other drivers
- ✅ Geographic analysis
- ✅ Session history

## 🤝 Contributing

This is a private project. For questions or issues, contact the project owner.

## 📄 License

Private project - All rights reserved.

---

**Made with ❤️ for karting enthusiasts**

- `secrets.json` is in `.gitignore` - never commit API keys
- Use environment variables in production
- Example config provided in `secrets.example.json`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add your API keys to `secrets.json` (ignored by git)
4. Test your changes
5. Submit a pull request

## Author

Max van Lierop - October 2025