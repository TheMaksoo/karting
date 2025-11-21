# 🏎️ Karting Dashboard - Laravel + Vue Migration

## ✅ COMPLETED (Session 1)

### Database & Backend
- ✅ Laravel 12 + Vue 3 project structure created
- ✅ MySQL database configured (`karting`)
- ✅ 8 migrations created and run successfully:
  - users (with roles: admin/driver)
  - drivers
  - tracks  
  - karting_sessions
  - laps
  - settings
  - cache, jobs, password_reset_tokens

### Data Migration
- ✅ **All existing data imported:**
  - 7 tracks (from tracks.json)
  - 6 drivers (extracted from CSV)
  - 26 karting sessions
  - 617 laps (from Karten.csv)
  - Default color settings
  - Admin user: maxvanlierop05@gmail.com (password: admin123)

### Track Data Corrections
- ✅ De Voltage: Fixed city (Tiel → Tilburg)
- ✅ Lot66: Marked as PERMANENTLY CLOSED, fixed city (Oss → Breda)

### Models Created
- ✅ User (with Sanctum authentication)
- ✅ Driver
- ✅ Track
- ✅ KartingSession
- ✅ Lap
- ✅ Setting

### API Controllers Created
- ✅ DriverController
- ✅ TrackController
- ✅ KartingSessionController
- ✅ LapController
- ✅ SettingController
- ✅ AuthController

---

## 🚧 IN PROGRESS

### API Endpoints (Next Step)
Need to implement CRUD operations in controllers:
- `/api/auth/login` - User login
- `/api/auth/register` - Create driver account
- `/api/drivers` - List/create/update drivers
- `/api/tracks` - List/create/update tracks
- `/api/sessions` - List/create sessions
- `/api/sessions/{id}/laps` - Get laps for session
- `/api/laps` - Create/update laps
- `/api/settings` - Get/update settings
- `/api/upload-session` - Upload CSV/Excel session data

---

## 📋 TODO (Prioritized)

### Phase 1: API Completion (2-3 hours)
1. Implement authentication endpoints
2. Implement CRUD endpoints for all resources
3. Add file upload for session data (CSV/Excel parser)
4. Test all endpoints with Postman/Thunder Client

### Phase 2: Vue Frontend - Driver Stats View (4-5 hours) ⭐ PRIORITY
1. Setup Vue Router with routes
2. Create API service layer (axios)
3. Migrate charts-driver.js → DriverStatsView.vue
   - Driver comparison charts
   - Lap time analysis
   - Best lap progression
   - Performance metrics
4. Implement all existing calculations

### Phase 3: Vue Frontend - Geographic View (2-3 hours) ⭐ PRIORITY  
1. Migrate charts-geo.js → GeographicView.vue
2. Track location map
3. Performance by track/region

### Phase 4: Authentication & Admin Panel (3-4 hours)
1. Login page
2. Protected routes
3. Upload session data form
4. Add new track form
5. Add new driver form
6. Email system for new drivers

### Phase 5: Remaining Views (6-8 hours)
1. Session Analysis View (charts-session.js)
2. Track Comparison View (charts-track.js)
3. Head-to-Head Battles View (charts-battles.js)
4. Financial Tracking View (charts-financial.js)
5. Temporal Trends View (charts-temporal.js)
6. Predictive Analytics View (charts-predictive.js)

### Phase 6: Control Panel Migration (2-3 hours)
1. Color palette editor
2. Driver nicknames
3. Settings management

### Phase 7: Testing & Deployment (3-4 hours)
1. Verify all calculations match legacy
2. Test all features
3. Optimize for production
4. Create deployment package for Namecheap
5. Write deployment instructions

---

## 🗂️ Project Structure

```
karting/
├── backend/              # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/API/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
├── frontend/             # Vue 3 SPA
│   ├── src/
│   │   ├── views/       # Each chart group = 1 view
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API calls
│   │   ├── stores/      # Pinia state management
│   │   └── router/
│   └── public/
│
├── dashboard/            # Legacy (keep for reference)
├── Karten.csv           # Source data
└── tracks.json          # Track information
```

---

## 📊 Database Schema

### users
- Admin: maxvanlierop05@gmail.com
- Role-based access (admin/driver)
- Linked to drivers table

### drivers
- name, email, nickname, color
- Extracted from CSV (6 unique drivers)

### tracks  
- 7 tracks with full specifications
- Location, distance, corners, pricing, features

### karting_sessions
- Links tracks to session data
- Date, weather, heat info

### laps
- 617 laps imported
- Full timing data, sectors, gaps, speeds

### settings
- Color palettes
- Driver-color mappings
- App configuration

---

## 🔑 Key Features to Implement

### Data Upload (NEW)
- Upload CSV/Excel files
- Parse timing data
- Auto-match tracks
- Create drivers if new
- Import all laps

### Track Management (NEW)
- Add new tracks via form
- Edit track specifications
- Deactivate closed tracks

### Driver Management (NEW)
- Add drivers manually
- Link to user accounts
- Send email invitations
- Assign colors

### Authentication
- Admin login (maxvanlierop05@gmail.com)
- Driver accounts creation
- Password reset via email
- Protected routes

---

## 🚀 Deployment Plan (Namecheap)

### Requirements
- PHP 8.1+
- MySQL database
- Composer (or upload vendor/)
- Node.js (for build, not hosting)

### Steps
1. Build Vue frontend: `npm run build`
2. Upload Laravel backend to server
3. Upload Vue dist/ to Laravel /public
4. Configure .htaccess
5. Set environment variables
6. Run migrations on production DB
7. Seed with data

---

## 💡 Next Immediate Actions

1. **Finish API endpoints** (controllers implementation)
2. **Setup Vue Router** with all views
3. **Create API service layer** for frontend
4. **Migrate Driver Stats view** (highest priority)
5. **Migrate Geographic view** (high priority)

---

## 📝 Notes

- Current admin password: `admin123` (change in production!)
- All 617 laps successfully imported
- Track data verified against websites
- Lot66 is closed - marked in database
- De Voltage city corrected (Tilburg)

---

**Estimated Time Remaining:** 20-30 hours for complete migration
**Current Progress:** ~15% complete (foundation done)
**Next Session:** API endpoint implementation
