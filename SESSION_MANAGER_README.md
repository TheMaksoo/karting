# Karting Session Management System

This system allows you to easily add new karting sessions to your database from various file formats (EML, PDF, TXT).

## Quick Start

### Adding a Single Session

```bash
python add_session.py "path/to/session/file.eml"
```

### Adding Multiple Sessions

```bash
python add_session.py "file1.eml" "file2.pdf" "file3.txt"
```

### Preview Mode (Dry Run)

Test without actually adding to the CSV:

```bash
python add_session.py "file.eml" --dry-run
```

### Interactive Mode

Run without arguments for an interactive menu:

```bash
python add_session.py
```

Options in interactive mode:
1. Add single session from file
2. Add all new sessions in a folder
3. Search existing sessions
4. Exit

## Supported Tracks

The system currently supports the following tracks:

| Track ID | Track Name | Location | Indoor/Outdoor | Distance | Corners |
|----------|-----------|----------|----------------|----------|---------|
| TRK-001 | Fastkart Elche | Elche, Spain | Outdoor | 1160m | 14 |
| TRK-002 | De Voltage | Netherlands | Indoor | 450m | 12 |
| TRK-003 | Experience Factory Antwerp | Antwerp, Belgium | Indoor | 350m | 9 |
| TRK-004 | Circuit Park Berghem | Berghem, Netherlands | Outdoor | 1200m | 14 |
| TRK-005 | Goodwill Karting | Netherlands | Indoor | 450m | 10 |
| TRK-006 | Lot66 | Netherlands | Indoor | 325m | 11 |
| TRK-007 | Racing Center Gilesias | Guardamar del Segura, Spain | Outdoor | 500m | 12 |

## Supported File Formats

### 1. Email Files (.eml)
- Experience Factory Antwerp emails (Apex Timing)
- SMS Timing emails
- Goodwill Karting emails
- De Voltage emails

### 2. PDF Files (.pdf)
- Experience Factory Antwerp PDF reports
- Other timing system PDFs (requires PyPDF2: `pip install PyPDF2`)

### 3. Text Files (no extension or .txt)
- Fastkart Elche session exports
- Racing Center Gilesias session exports

## File Structure

```
karting/
├── add_session.py          # Main script to add sessions
├── session_parser.py       # Parser for different file formats
├── tracks.json             # Track database
├── Karten.csv             # Main data file
├── dashboard/
│   └── Karten.csv         # Copy for dashboard
├── Elche/
│   ├── Fastkart Elche
│   └── Fastkart Elche 2
├── Gilesias/
│   └── Racing center gelesias
└── ...other track folders
```

## Track Database (tracks.json)

All track information is stored in `tracks.json`. This includes:
- Track specifications (distance, corners, indoor/outdoor)
- Location details
- Contact information
- Pricing information
- Available kart types
- Features

### Adding a New Track

To add a new track to the database, edit `tracks.json` and add a new entry:

```json
{
  "trackId": "TRK-008",
  "name": "New Track Name",
  "location": {
    "city": "City",
    "country": "Country",
    "region": "Region"
  },
  "specifications": {
    "distance": 800,
    "corners": 12,
    "indoor": false
  },
  "features": [],
  "website": "https://example.com",
  "contact": {},
  "pricing": {},
  "karts": []
}
```

## CSV Output Format

Each session is converted to individual lap records with the following fields:

- **RowID**: Unique identifier for each lap
- **Date**: Session date (YYYY-MM-DD)
- **Time**: Session start time (HH:MM)
- **SessionType**: Usually "Practice"
- **Heat**: Heat number
- **Track**: Track name
- **TrackID**: Track identifier (TRK-XXX)
- **InOrOutdoor**: Indoor or Outdoor
- **Weather**: Weather conditions
- **Source**: Timing system source
- **Driver**: Driver name
- **Position**: Position in the session
- **LapNumber**: Lap number
- **LapTime**: Lap time in seconds
- **Sector1-3**: Sector times (if available)
- **BestLap**: Y if this is the best lap, N otherwise
- **GapToBestLap**: Gap to best lap time
- **Kart**: Kart number or identifier
- **TrackDistance**: Track distance in meters
- **Corners**: Number of corners
- **AvgSpeed**: Average speed in km/h
- **Notes**: Additional notes

## Examples

### Example 1: Add Fastkart Elche Session

```bash
python add_session.py "Elche/Fastkart Elche"
```

Output:
```
📄 Parsing file: Elche/Fastkart Elche

============================================================
📋 SESSION INFORMATION
============================================================
🏁 Track:        Fastkart Elche
👤 Driver:       Max van Lierop
📅 Date:         2025-11-07
🕐 Time:         12:48
🏎️  Kart:        TB 29
#️⃣  Session:     17
🔄 Total Laps:   15
⚡ Best Lap:     00:55.872
============================================================

✅ Ready to add 15 laps

❓ Add this session to the CSV? (yes/no): yes
✅ Successfully added 15 laps to Karten.csv
```

### Example 2: Batch Import from Folder

```bash
python add_session.py
```

Choose option 2, then enter the folder path:
```
Enter folder path: Elche
```

The script will find all compatible files and offer to import them.

### Example 3: Search Existing Sessions

```bash
python add_session.py
```

Choose option 3:
```
Driver name (or blank): Max van Lierop
Track name (or blank): Fastkart
Date YYYY-MM-DD (or blank):
```

Returns all sessions matching the criteria.

## Extending the Parser

To add support for a new track format:

1. **Add track to tracks.json**
2. **Create a parser method** in `session_parser.py`:

```python
def parse_new_track(self, content: str, file_path: Path) -> Dict:
    """Parse New Track session format"""
    session_data = {
        'track': 'New Track Name',
        'track_id': 'TRK-008',
        'source': 'Timing System',
        'file_path': str(file_path),
        'laps': []
    }
    
    # Extract session data using regex
    # ...
    
    return session_data
```

3. **Add detection logic** in `_detect_track_from_text()` method

4. **Add parsing logic** in `parse_text_file()` or `parse_eml()` method

## Troubleshooting

### Issue: File not recognized

**Solution**: Check that the file contains recognizable track keywords. Update `_detect_track_from_text()` if needed.

### Issue: No lap data extracted

**Solution**: The regex patterns may need adjustment for your specific file format. Check the file content and update the parser.

### Issue: Wrong driver name

**Solution**: Add driver name mapping in the parser methods. For example:
```python
if session_data['driver'] == 'TheMaksoo':
    session_data['driver'] = 'Max van Lierop'
```

## Recent Updates

### 2025-11-18
- ✅ Added support for Fastkart Elche (TRK-001)
- ✅ Added support for Racing Center Gilesias (TRK-007)
- ✅ Created `tracks.json` database for track management
- ✅ Built `session_parser.py` module for file parsing
- ✅ Created `add_session.py` interactive tool
- ✅ Added 48 new laps (2 Fastkart sessions + 1 Gilesias session)
- ✅ Updated dashboard CSV

## Dependencies

```bash
pip install pandas
pip install PyPDF2  # Optional, for PDF support
```

## Tips

1. **Always use dry-run first** to preview what will be added
2. **Keep original files** in case you need to re-import
3. **Organize files by track** in separate folders
4. **Check the CSV after import** to verify data accuracy
5. **Backup Karten.csv** regularly

## Future Enhancements

- [ ] Web interface for uploading sessions
- [ ] Automatic driver detection from filenames
- [ ] Support for more timing systems
- [ ] Session duplicate detection
- [ ] Automatic track detection from GPS coordinates
- [ ] Export to other formats (Excel, JSON, SQLite)
