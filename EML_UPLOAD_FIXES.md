# EML Upload Fixes - December 11, 2025

## Issues Fixed

### 1. **Validation Error: `best_lap_time` Field Required**
**Problem:** Frontend batch upload was calling wrong API endpoint with incorrect data structure
- Error: `laps.0.best_lap_time field is required`
- Root cause: Frontend calling `/upload/import` (expects `best_lap_time`) instead of `/sessions/save-parsed` (expects `lap_time`)

**Solution:**
- Updated `EmlUploadView.vue` batch upload to call `apiService.upload.saveParsedSession()`
- Corrected data structure to use `lap_time` instead of `best_lap_time`

### 2. **Missing `session_number` Database Field**
**Problem:** Controller trying to save `session_number` but field didn't exist in database
- Field not in migration
- Field not in `KartingSession` model fillable array

**Solution:**
- Created migration: `2025_12_11_000001_add_session_number_to_karting_sessions_table.php`
- Added `session_number` to `KartingSession` fillable array
- Extracts session number from EML subject (e.g., "Sessie 33" → "33")

### 3. **Best Laps Not Marked**
**Problem:** All laps had `is_best_lap = false`, no gaps calculated

**Solution:**
- Added `markBestLapsAndCalculateGaps()` method to `EmlUploadController`
- After all laps imported, finds fastest lap per driver and marks it
- Calculates `gap_to_best_lap` for each lap (difference from driver's fastest lap)
- Calculates `gap_to_previous` based on final positions

### 4. **Missing EML Format Support**
**Problem:** Parser only handled De Voltage multi-driver format

**Solution:** Added comprehensive format detection and parsing:

#### **Lot66 Format** (Single driver, sector times)
```
Lot66
Max van lierop
19.03.2022 At 1700h
Lap  S1  S2  S3  Time
1    -   -   -   00:35.560
2    -   -   -   00:33.092
```
- Detects by filename or "Lap 1", "S1" markers
- Extracts driver name from first line
- Parses lap-by-lap times with lap numbers

#### **Elche / Gilesias Format** (Spanish single driver)
```
RESUMEN DE TU CARRERA
Pos. Pilotos    N.   V.  Mejor V.
1    TheMaksoo  TB29 14  00:56.872

RESULTADOS DETALLADOS
1    01:09.478
2    00:58.890
```
- Detects by "RESUMEN DE TU CARRERA", "Mejor V." markers
- Extracts pilot name and kart number (TB 29)
- Parses detailed lap times with lap numbers

#### **De Voltage / Goodwill / Circuit Park Berghem** (Multi-driver detailed)
```
Heat overview   Best score
1.  Laszlo van Melis  39.761
2.  Kevin Vd Hurk     40.515

Detailed results
                Laszlo  Kevin  ...
1               48.762  48.646 ...
2               40.754  40.520 ...
```
- Extracts final positions and best times from overview
- Parses detailed lap-by-lap table (drivers as columns, laps as rows)
- Associates position with each driver's laps

## Database Schema Updates

### `karting_sessions` Table
**Added:**
- `session_number` (string, nullable) - Extracted from EML subject

### `laps` Table (Already existed, now properly populated)
**Fields Now Populated:**
- `lap_number` - Sequential lap number per driver
- `lap_time` - Time in seconds with milliseconds
- `position` - Final position in heat (from overview section)
- `kart_number` - Kart identifier (when available)
- `is_best_lap` - TRUE for fastest lap per driver
- `gap_to_best_lap` - Seconds behind driver's fastest lap
- `gap_to_previous` - Interval to previous position

**Fields Still Nullable (not in EML data):**
- `sector1`, `sector2`, `sector3` - Sector times (Lot66 shows dashes)
- `interval` - Gap to leader
- `avg_speed` - Average speed
- `tyre` - Tyre compound
- `cost_per_lap` - Calculated separately

## Folder Upload Feature

### How It Works
1. Click "Upload Folder" button
2. Select folder containing EML files (supports subfolders)
3. System processes each `.eml` or `.txt` file sequentially
4. Auto-detects track from email sender/subject/body
5. Extracts all lap data based on detected track format
6. Creates session and imports all laps automatically
7. Marks best laps and calculates gaps
8. Shows summary: ✅ successful imports, ❌ failed files, ⚠️ duplicates

### Batch Processing
- **Progress tracking**: Shows "Processing 3 of 15 files..."
- **Error recovery**: Continues processing even if individual files fail
- **Duplicate detection**: Skips sessions already in database
- **Auto-import**: No preview step for batch uploads (faster)

## Track Auto-Detection

Supported tracks with detection patterns:

| Track | Detection Keywords |
|-------|-------------------|
| De Voltage | devoltage, de voltage |
| Lot66 | lot66, lot 66 |
| Circuit Park Berghem | berghem, circuit park berghem |
| Goodwill Karting | goodwill, goodwill karting |
| Experience Factory | experience factory, experiencefactory |
| Fastkart Elche | fastkart, elche |

**Auto-creation:** If track not in database, creates it with:
- Unique `track_id`: `TRK-{6-char hash}`
- City mapping (Tilburg, Oosterhout, Elche, etc.)
- Default country: Netherlands (Spain for Elche)

## Data Completeness

### ✅ Now Extracted
- Driver names (all formats)
- Lap numbers (sequential per driver)
- Lap times (converted to seconds)
- Final positions (from heat overview)
- Kart numbers (when available in format like "TB 29")
- Session date (from email headers)
- Session number (from subject)
- Best lap per driver (calculated)
- Gaps to best lap (calculated)
- Gaps to previous position (calculated)

### ⚠️ Format-Dependent
- **De Voltage**: Multi-driver detailed lap-by-lap ✅
- **Lot66**: Single driver lap-by-lap (no position) ✅
- **Elche/Gilesias**: Single driver with kart number ✅
- **Goodwill**: Multi-driver (same as De Voltage) ✅
- **Circuit Park Berghem**: Multi-driver (same as De Voltage) ✅

### ❌ Not in EML Data
- Sector times (shown as "-" in Lot66, not in others)
- Average speed
- Tyre compound
- Track conditions/weather
- Fuel usage
- Cost per lap (calculated from session heat_price)

## Deployment

Changes deployed automatically via GitHub Actions:
1. ✅ Frontend: Fixed batch upload API call
2. ✅ Backend: Enhanced EML parser for all formats
3. ✅ Backend: Added best lap marking logic
4. ✅ Backend: Created session_number migration
5. ✅ Backend: Updated KartingSession model

## Testing Recommendations

1. **Upload sample EMLs:**
   - De Voltage: `data-importer/eml-samples/De Voltage/Results - Karten Sessie 33.eml`
   - Lot66: `data-importer/eml-samples/Lot66/19.03.2022 At 1700h max van lierop.eml`
   - Elche: `data-importer/eml-samples/Elche/Fastkart Elche`
   - Goodwill: `data-importer/eml-samples/Goodwill Karting/Fwd_ Goodwill Karting - Resultaten Sessie 7.eml`

2. **Verify database population:**
   ```sql
   SELECT * FROM karting_sessions ORDER BY id DESC LIMIT 5;
   SELECT * FROM laps WHERE karting_session_id = {session_id};
   SELECT * FROM laps WHERE is_best_lap = 1;
   ```

3. **Check gap calculations:**
   ```sql
   SELECT driver_id, lap_number, lap_time, gap_to_best_lap, is_best_lap 
   FROM laps 
   WHERE karting_session_id = {session_id}
   ORDER BY driver_id, lap_number;
   ```

## Next Steps

- [ ] Test batch upload with full `data-importer/eml-samples` folder
- [ ] Add PDF parsing support for Experience Factory format
- [ ] Extract sector times from Lot66 (currently ignored)
- [ ] Calculate cost_per_lap based on heat_price / total_laps
- [ ] Add weather/track condition extraction if available in emails
