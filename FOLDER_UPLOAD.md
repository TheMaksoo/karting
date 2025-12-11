# Folder Upload Feature

## Overview
The EML upload page now supports both **single file** and **batch folder** uploads, allowing you to import entire directories of karting session files at once.

## Features

### Single File Upload
- Click "Upload File" or drag & drop a single `.eml` or `.txt` file
- Preview and edit session data before importing
- Review laps, drivers, and track information
- Manually adjust any incorrect data

### Folder Upload (NEW!)
- Click "Upload Folder" to select an entire directory
- Automatically processes all `.eml` and `.txt` files in the folder
- **Auto-import mode**: Sessions are imported immediately without preview
- Real-time progress tracking with success/failure counts
- Batch summary showing total imported, failed, and error details

## Usage

### Upload Your Data Folder Structure
```
data/
  ├── De Voltage/
  │   ├── Sessie 33.eml
  │   ├── Sessie 52.eml
  │   └── Sessie 55.eml
  ├── Lot66/
  │   ├── Session 1.eml
  │   └── Session 2.eml
  └── Circuit Park Berghem/
      ├── Heat 3.eml
      └── Heat 5.eml
```

### Steps
1. Navigate to **EML Session Upload** page
2. Click **"Upload Folder"** button
3. Select your `data` folder or any subfolder
4. Watch the progress bar as files are processed
5. Review the batch summary:
   - ✅ Sessions imported successfully
   - ❌ Failed imports with error messages
   - Duplicate sessions are skipped and logged
6. Click **"View Sessions"** to see your imported data

## Auto-Detection
Each EML file is automatically analyzed to detect:
- **Track**: Extracted from email sender or content
- **Drivers**: Parsed from lap time tables
- **Session Date**: Extracted from email headers
- **Lap Times**: All lap data with positions and kart numbers

## Duplicate Handling
- The system checks for duplicate sessions (same track, date, and laps)
- Duplicates are **skipped** and logged in the error list
- No data is overwritten - your existing sessions are safe

## Error Handling
- Invalid files are skipped (only `.eml` and `.txt` supported)
- Parse errors are logged with the filename
- Failed imports don't stop the batch process
- All errors are displayed in the summary with details

## Deployment
Your changes automatically deploy when you push to GitHub:

```bash
git add .
git commit -m "Upload all karting sessions"
git push
```

GitHub Actions will:
1. Build the frontend with folder upload support
2. Deploy to production at https://solyx.gg/karting
3. Run database migrations
4. You're done! 🎉

## Technical Details
- **Multiple file input**: Uses `multiple` attribute for file selection
- **Folder selection**: Uses `webkitdirectory` for folder browsing
- **Batch processing**: Sequential uploads to avoid API overload
- **Progress tracking**: Real-time updates with current file and counts
- **Error recovery**: Continues processing even if individual files fail
