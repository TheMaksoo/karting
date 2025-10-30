# Karting Session Data Processor

A Python script that processes karting session emails from multiple tracks and extracts lap time data for specified drivers, then adds it to a karting CSV database with intelligent weather detection.

## Features

- **Multi-track support**: De Voltage, Experience Factory Antwerp, Circuit Park Berghem, Goodwill Karting
- **Email parsing**: Extracts data from SMS Timing email files (.eml)
- **API integration**: Apex Timing data fetching
- **Weather detection**: Real-time weather API + intelligent rain detection based on lap times
- **Individual lap tracking**: Records every lap time, not just best times
- **Duplicate prevention**: Avoids adding the same session twice

## Setup

### 1. Install Dependencies

```bash
pip install requests beautifulsoup4
```

### 2. Configure API Keys

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Copy `secrets.example.json` to `secrets.json`
3. Add your API key to `secrets.json`:

```json
{
  "openweather_api_key": "your_actual_api_key_here"
}
```

Alternatively, set environment variable:
```bash
export OPENWEATHER_API_KEY="your_actual_api_key_here"
```

### 3. Organize Your Files

```
karting/
├── process_karting_sessions.py
├── config.py
├── secrets.json (your API keys - not in git)
├── Karten.csv (your database)
├── De Voltage/
│   ├── Results - Session 1.eml
│   └── Results - Session 2.eml
├── Circuit Park Berghem/
│   ├── Results - Session 75.eml
│   └── Results - Session 76.eml
└── ... other track folders
```

## Usage

```bash
python process_karting_sessions.py
```

The script will:
1. Clear and recreate the CSV database
2. Process all EML files from track folders
3. Fetch recent data from Apex Timing
4. Add weather data (with intelligent rain detection)
5. Generate comprehensive lap-by-lap records

## Weather Detection

The system uses a smart multi-layered approach:

1. **Lap Time Analysis**: For outdoor tracks, analyzes driver lap times to detect rain conditions
   - Circuit Park Berghem: If average lap > 70s or max lap > 80s, likely rain conditions
2. **Real Weather API**: Gets current weather from OpenWeatherMap
3. **Seasonal Fallback**: Uses reasonable seasonal weather if API unavailable

## Supported Tracks

- **De Voltage** (Indoor, Tilburg, NL)
- **Experience Factory Antwerp** (Indoor, Antwerp, BE) 
- **Circuit Park Berghem** (Outdoor, Berghem, NL)
- **Goodwill Karting** (Indoor, Olen, BE)

## Driver Configuration

Update `DRIVER_ALIASES` in the script for your drivers and their track-specific aliases.

## CSV Output

Generated CSV includes:
- Individual lap times for each driver
- Session details (date, time, track, weather)
- Position and ranking data
- Best lap indicators
- Comprehensive session notes

## Security

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