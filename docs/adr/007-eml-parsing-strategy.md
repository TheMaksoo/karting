# ADR-007: EML Email Parsing Strategy

## Status

**Accepted**

## Date

2024-03-15

## Context

The Karting Dashboard's core feature is importing lap times from karting track emails. Each track sends session results in different email formats:

- **Circuit Park Berghem**: HTML table with driver times
- **Goodwill Karting**: Plain text with lap listings
- **Experience Factory Antwerp**: HTML with embedded data
- **De Voltage**: Mixed format with session info

We needed a strategy to:
- Parse `.eml` files uploaded by users
- Extract track, date, drivers, and lap times
- Handle multiple formats reliably
- Detect which track the email is from
- Handle errors gracefully

## Decision

We implemented a **multi-parser architecture** with automatic track detection.

### Architecture

```
EmlUploadController
    │
    ▼
EmlParser (Service)
    │
    ├── extractEmailContent()
    │
    ▼
TrackDetectorService
    │
    ├── detectTrack() - Pattern matching
    │
    ▼
Track-Specific Parser
    │
    ├── CircuitParkBerghemParser
    ├── GoodwillKartingParser
    ├── ExperienceFactoryParser
    └── GenericParser (fallback)
    │
    ▼
SessionCalculatorService
    │
    └── calculateStats() - Best lap, average, etc.
```

### Implementation

```php
// TrackDetectorService
public function detectTrack(string $content): ?Track
{
    $patterns = [
        'Circuit Park Berghem' => [
            '/berghem/i',
            '/circuit\s*park/i',
        ],
        'Goodwill Karting' => [
            '/goodwill/i',
            '/good\s*will\s*karting/i',
        ],
        // ... more patterns
    ];

    foreach ($patterns as $trackName => $regexes) {
        foreach ($regexes as $regex) {
            if (preg_match($regex, $content)) {
                return Track::where('name', $trackName)->first();
            }
        }
    }

    return null; // Unknown track
}
```

### Reasons

1. **Extensibility**: Easy to add new track parsers without changing core logic.

2. **Separation of Concerns**: 
   - `EmlParser`: Email structure
   - `TrackDetectorService`: Track identification
   - Track Parsers: Format-specific extraction
   - `SessionCalculatorService`: Statistics

3. **Fallback Support**: Generic parser handles unknown formats with best-effort extraction.

4. **Testability**: Each component can be tested independently.

## Alternatives Considered

### Option 1: Single Monolithic Parser
- **Pros**: Simple initial implementation
- **Cons**: Becomes unmaintainable with many tracks, hard to test

### Option 2: External Parsing Service
- **Pros**: Offload complexity, potentially ML-powered
- **Cons**: Added dependency, latency, cost

### Option 3: User-Defined Templates
- **Pros**: Users can add their own tracks
- **Cons**: Complex UI, error-prone, bad UX

## Consequences

### Positive
- Clean architecture with single responsibility
- Easy to add new tracks (just add a parser)
- Comprehensive testing possible
- Error handling per parser
- Input sanitization (XSS protection)

### Negative
- Need to update when tracks change email format
- Initial setup per track requires email samples
- Some edge cases may fail

### Neutral
- Batch upload supported (multiple files at once)
- Progress tracking for large uploads

## Supported Tracks

| Track | Parser | Status |
|-------|--------|--------|
| Circuit Park Berghem | ✅ | Production |
| Goodwill Karting | ✅ | Production |
| Experience Factory Antwerp | ✅ | Production |
| De Voltage | ✅ | Production |
| Gilesias | ✅ | Production |
| Elche | ✅ | Production |
| Lot66 | ✅ | Production |

## References

- [EML Upload Documentation](../wiki/Backend-Guide.md#eml-parsing)
- [InputSanitizer Service](../../portal/backend/app/Services/InputSanitizer.php)
- [TrackDetectorService](../../portal/backend/app/Services/TrackDetectorService.php)
