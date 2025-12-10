# Database Overview & EML Upload Updates

## ✅ What Was Completed

### 1. Split AdminDataView into Components
**Problem:** AdminDataView was too large (690 lines) and hard to maintain

**Solution:**
- Created `SessionsTable.vue` component - Full inline editing for all session fields
- Created `LapsTable.vue` component - Full inline editing for all lap fields
- New `AdminDataView.vue` - Clean 400-line orchestrator using components

**Session Fields (ALL Editable):**
- ID, Date, Time, Track, Type, Heat #, Weather, Source, Heat Price, Notes
- Edit/Save/Cancel/Delete actions per row

**Lap Fields (ALL Editable):**
- ID, Session, Driver, Lap #, Lap Time, Position
- Sector 1/2/3, Best Lap Flag, Gap, Interval
- Avg Speed, Kart #, Tyre, Cost per Lap
- Filters by driver & track
- Edit/Save/Cancel/Delete actions per row

### 2. Auto-Detection in EML Upload
**Problem:** Had to manually select track before upload

**Solution:**
- Removed track selection dropdown
- Auto-detects track from email content (From/Subject/Body)
- Auto-creates track if doesn't exist in database
- Detects: De Voltage, Experience Factory, Goodwill, Circuit Park Berghem, Fastkart, Lot66

**Backend Changes:**
```php
// EmlUploadController.php
private function detectTrack($emailData)
{
    // Searches subject, from, body for track patterns
    // Creates track if not found
    // Returns Track model
}

private function getTrackCity($trackName)
{
    // Maps track names to cities
}
```

**Frontend Changes:**
```vue
<!-- Removed track selector -->
<p>Track and driver will be auto-detected from the email</p>

<!-- Auto-detection in upload -->
const response = await apiService.upload.parseEml(file) // No trackId needed
```

### 3. Complete Database Fields Shown
**All migrations mapped to UI:**

**Drivers Table:**
- ✅ id, name, email, nickname, color, is_active, created_at

**Tracks Table:**
- ✅ id, track_id, name, city, country, region
- ✅ distance, corners, indoor, website

**Sessions Table:**
- ✅ id, track_id, session_date, session_time
- ✅ session_type, heat, weather, source
- ✅ heat_price, notes, timestamps

**Laps Table:**
- ✅ id, karting_session_id, driver_id, lap_number
- ✅ lap_time, position, sector1/2/3
- ✅ is_best_lap, gap_to_best_lap, interval, gap_to_previous
- ✅ avg_speed, kart_number, tyre, cost_per_lap

## 🎯 Features

### Inline Editing System
```typescript
// Click any field to edit
startEdit(item) → editingId = item.id → Show input fields
saveEdit() → API.update() → Refresh table
cancelEdit() → Restore original values
```

### Auto-Detection Logic
1. Upload EML file
2. Parse headers (From, Subject, Date)
3. Decode base64 body
4. Search for track patterns:
   - "devoltage" → De Voltage (Tilburg)
   - "experience factory" → Experience Factory (Antwerp)
   - "goodwill" → Goodwill Karting (Veenendaal)
   - etc.
5. Find/Create track in database
6. Extract drivers from lap table
7. Parse lap-by-lap data
8. Return editable preview

### Component Structure
```
AdminDataView.vue (orchestrator)
├── SessionsTable.vue (edit sessions)
├── LapsTable.vue (edit laps + filters)
└── Standard tables (drivers, tracks → link to management)
```

## 📋 Usage

### Upload EML
1. Go to **Admin → EML Upload**
2. Drag & drop EML file (NO track selection needed)
3. System auto-detects: "From: De Voltage..." → De Voltage track
4. Preview shows all extracted data
5. Edit any field if needed
6. Click Save

### Edit Database Records
1. Go to **Admin → Database Overview**
2. Select tab (Sessions/Laps/Drivers/Tracks)
3. Click **✎** edit button on any row
4. Fields become editable inputs
5. Click **✓** to save or **✗** to cancel
6. Click **🗑** to delete

### Filter Laps
1. Go to Laps tab
2. Select driver from dropdown
3. Select track from dropdown
4. Table updates automatically
5. Pagination preserved

## 🧪 Testing

### Test Auto-Detection
```powershell
# Upload sample EML
Upload: data-importer/eml-samples/De Voltage/Results - Karten Sessie 33.eml
Expected: Auto-detects "De Voltage" track
```

### Test Inline Editing
```
1. Go to Sessions tab
2. Click ✎ on any row
3. Change session_type to "Qualifying"
4. Change heat_price to 15.50
5. Click ✓ save
6. Verify changes persist after refresh
```

### Test All Fields
```
Sessions: ✅ All 10 fields editable
Laps: ✅ All 16 fields editable
Drivers: ℹ️ Use Driver Management (separate view)
Tracks: ℹ️ Use Track Management (separate view)
```

## 🔧 File Changes

### Created
- `frontend/src/components/admin/SessionsTable.vue` (220 lines)
- `frontend/src/components/admin/LapsTable.vue` (250 lines)
- `frontend/src/views/AdminDataViewNew.vue` (replaced old)

### Modified
- `backend/app/Http/Controllers/API/EmlUploadController.php`
  - Added `detectTrack()` method
  - Added `getTrackCity()` method
  - Removed `track_id` requirement from validation
- `frontend/src/views/EmlUploadView.vue`
  - Removed track selector
  - Updated upload flow
- `frontend/src/services/api.ts`
  - Changed `parseEml(file)` - removed trackId param

### Backed Up
- `AdminDataView.vue.backup` - Original 690-line version

## 🎨 UI Improvements

**Before:**
- Monolithic 690-line file
- Read-only tables
- Manual track selection
- Missing DB fields

**After:**
- 3 focused components
- Click-to-edit everywhere
- Auto-detection
- ALL DB fields shown & editable
- Better separation of concerns

## 📊 Database Coverage

**Complete Field Coverage:**
```sql
-- Sessions: 10/10 fields ✅
-- Laps: 16/16 fields ✅
-- Drivers: 7/7 fields ✅
-- Tracks: 10/10 fields ✅
```

**Missing Features (Future):**
- Bulk edit operations
- CSV export
- Advanced filtering (date ranges, multi-select)
- Lap time validation (prevent impossible times)
- Conflict resolution for duplicates
