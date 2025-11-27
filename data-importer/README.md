# 🔧 Karting Data Importer

This folder contains legacy Python scripts and historical data files used for initial data import and processing.

## 📁 Structure

```
data-importer/
├── scripts/           # Python scripts for data processing
│   ├── process_karting_sessions.py
│   ├── run_processing.py
│   └── secrets.json
├── data/              # CSV and JSON data files
│   └── Karten.csv
└── eml-samples/       # Sample EML files from various tracks
    ├── Circuit Park Berghem/
    ├── De Voltage/
    ├── Elche/
    ├── Experience Factory Antwerp/
    ├── Gilesias/
    ├── Goodwill Karting/
    └── Lot66/
```

## ⚠️ Legacy Tools

These scripts are **no longer needed** for day-to-day operations. The portal application now handles:
- Track management
- Session data upload (EML/CSV/TXT files)
- Manual lap entry
- Automated parsing

## 🔄 Historical Purpose

These tools were used to:
1. Process initial karting session data from CSV files
2. Parse EML files from various track providers
3. Import bulk historical data into the database

## 📝 Note

Keep this folder for reference and potential re-imports. For new data, use the **Portal's Upload Interface** instead.
