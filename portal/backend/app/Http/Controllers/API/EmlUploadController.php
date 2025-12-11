<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Driver;
use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EmlUploadController extends Controller
{
    public function parseEml(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:eml,txt|max:10240',
        ]);

        $file = $request->file('file');
        
        // Read EML file
        $content = file_get_contents($file->getRealPath());
        
        // Parse email
        $emailData = $this->parseEmailContent($content);
        
        // Auto-detect track from email
        $track = $this->detectTrack($emailData);
        
        if (!$track) {
            return response()->json([
                'success' => false,
                'message' => 'Could not detect track from email. Please add track manually.',
                'available_tracks' => Track::select('id', 'name', 'city')->get()
            ], 400);
        }
        
        // Extract session data based on track
        $sessionData = $this->extractSessionData($emailData, $track);
        
        // Check for duplicates
        $duplicate = $this->checkDuplicate($sessionData, $track->id);
        
        return response()->json([
            'success' => true,
            'data' => $sessionData,
            'duplicate' => $duplicate,
            'track' => $track
        ]);
    }

    public function saveSession(Request $request)
    {
        $request->validate([
            'track_id' => 'required|exists:tracks,id',
            'session_date' => 'required|date',
            'heat_price' => 'nullable|numeric',
            'laps' => 'required|array',
            'laps.*.driver_name' => 'required|string',
            'laps.*.lap_number' => 'required|integer',
            'laps.*.lap_time' => 'required|numeric',
            'laps.*.position' => 'nullable|integer',
            'laps.*.kart_number' => 'nullable|string',
        ]);

        DB::beginTransaction();
        
        try {
            // Create session
            $session = KartingSession::create([
                'track_id' => $request->track_id,
                'session_date' => $request->session_date,
                'heat_price' => $request->heat_price ?? 0,
                'session_type' => $request->session_type ?? 'race',
                'session_number' => $request->session_number,
            ]);

            // Process laps grouped by driver
            $driverLaps = collect($request->laps)->groupBy('driver_name');
            
            foreach ($driverLaps as $driverName => $laps) {
                // Find or create driver
                $driver = Driver::firstOrCreate(
                    ['name' => $driverName],
                    ['email' => null]
                );

                foreach ($laps as $lapData) {
                    Lap::create([
                        'karting_session_id' => $session->id,
                        'driver_id' => $driver->id,
                        'lap_number' => $lapData['lap_number'],
                        'lap_time' => $lapData['lap_time'],
                        'position' => $lapData['position'] ?? null,
                        'kart_number' => $lapData['kart_number'] ?? null,
                        'sector1' => $lapData['sector1'] ?? null,
                        'sector2' => $lapData['sector2'] ?? null,
                        'sector3' => $lapData['sector3'] ?? null,
                        'is_best_lap' => false,
                        'gap_to_best_lap' => $lapData['gap_to_best_lap'] ?? null,
                        'interval' => $lapData['interval'] ?? null,
                        'gap_to_previous' => $lapData['gap_to_previous'] ?? null,
                        'avg_speed' => $lapData['avg_speed'] ?? null,
                    ]);
                }
            }

            // Mark best laps and calculate gaps for each driver
            $this->markBestLapsAndCalculateGaps($session->id);

            DB::commit();

            return response()->json([
                'success' => true,
                'session' => $session->load(['track', 'laps.driver'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to save session: ' . $e->getMessage()
            ], 500);
        }
    }

    private function parseEmailContent($content)
    {
        $headers = [];
        $body = '';
        
        // Split headers and body at the first blank line
        $parts = preg_split('/\r?\n\r?\n/', $content, 2);
        $headerText = $parts[0] ?? '';
        $bodyText = $parts[1] ?? '';
        
        // Parse headers
        if (preg_match_all('/^([^:]+):\s*(.*)$/m', $headerText, $headerMatches, PREG_SET_ORDER)) {
            foreach ($headerMatches as $match) {
                $headers[trim($match[1])] = trim($match[2]);
            }
        }
        
        // Check for multipart content
        $boundary = null;
        if (isset($headers['Content-Type']) && preg_match('/boundary="?([^";\s]+)"?/i', $headers['Content-Type'], $matches)) {
            $boundary = $matches[1];
        }
        
        // If multipart, extract the text/plain part
        if ($boundary) {
            $parts = explode('--' . $boundary, $bodyText);
            $plainTextBody = '';
            $htmlBody = '';
            
            foreach ($parts as $part) {
                // Look for text/plain part
                if (stripos($part, 'Content-Type: text/plain') !== false) {
                    // Check if base64 encoded
                    if (preg_match('/Content-Transfer-Encoding:\s*base64/i', $part)) {
                        // Extract base64 content (everything after the headers)
                        if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                            $base64Content = preg_replace('/\s+/', '', $contentMatch[1]);
                            $plainTextBody = base64_decode($base64Content);
                        }
                    } else if (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $part)) {
                        if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                            $plainTextBody = quoted_printable_decode($contentMatch[1]);
                        }
                    } else {
                        // Plain text content
                        if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                            $plainTextBody = $contentMatch[1];
                        }
                    }
                }
                
                // Also extract HTML part as fallback
                if (stripos($part, 'Content-Type: text/html') !== false) {
                    if (preg_match('/Content-Transfer-Encoding:\s*base64/i', $part)) {
                        if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                            $base64Content = preg_replace('/\s+/', '', $contentMatch[1]);
                            $htmlBody = base64_decode($base64Content);
                        }
                    } else if (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $part)) {
                        if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                            $htmlBody = quoted_printable_decode($contentMatch[1]);
                        }
                    } else {
                        if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                            $htmlBody = $contentMatch[1];
                        }
                    }
                }
            }
            
            // Prefer plain text, but use HTML if plain is empty
            $body = !empty($plainTextBody) ? $plainTextBody : $htmlBody;
        } else {
            // Single part message
            if (preg_match('/Content-Transfer-Encoding:\s*base64/i', $content)) {
                // Extract base64 content after headers
                $base64Content = preg_replace('/\s+/', '', $bodyText);
                $body = base64_decode($base64Content);
            } else {
                $body = $bodyText;
            }
        }
        
        return [
            'headers' => $headers,
            'subject' => $headers['Subject'] ?? '',
            'from' => $headers['From'] ?? '',
            'date' => $headers['Date'] ?? '',
            'body' => $body
        ];
    }

    private function detectTrack($emailData)
    {
        $subject = strtolower($emailData['subject']);
        $from = strtolower($emailData['from']);
        $body = strtolower($emailData['body']);
        
        // Track detection patterns
        $trackPatterns = [
            'De Voltage' => ['devoltage', 'de voltage'],
            'Experience Factory' => ['experience factory', 'experiencefactory'],
            'Goodwill Karting' => ['goodwill', 'goodwill karting'],
            'Circuit Park Berghem' => ['berghem', 'circuit park berghem'],
            'Fastkart Elche' => ['fastkart', 'elche'],
            'Lot66' => ['lot66', 'lot 66'],
        ];
        
        foreach ($trackPatterns as $trackName => $patterns) {
            foreach ($patterns as $pattern) {
                if (stripos($subject, $pattern) !== false || 
                    stripos($from, $pattern) !== false || 
                    stripos($body, $pattern) !== false) {
                    
                    // Find track in database by name (case insensitive)
                    $track = Track::whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($trackName) . '%'])->first();
                    
                    if ($track) {
                        return $track;
                    }
                    
                    // Create track if it doesn't exist
                    return Track::create([
                        'track_id' => 'TRK-' . strtoupper(substr(md5($trackName), 0, 6)),
                        'name' => $trackName,
                        'city' => $this->getTrackCity($trackName),
                        'country' => 'Netherlands', // Default, can be improved
                    ]);
                }
            }
        }
        
        return null;
    }
    
    private function getTrackCity($trackName)
    {
        $cities = [
            'De Voltage' => 'Tilburg',
            'Experience Factory' => 'Antwerp',
            'Goodwill Karting' => 'Veenendaal',
            'Circuit Park Berghem' => 'Berghem',
            'Fastkart Elche' => 'Elche',
            'Lot66' => 'Oosterhout',
        ];
        
        return $cities[$trackName] ?? null;
    }

    private function extractSessionData($emailData, $track)
    {
        $body = $emailData['body'];
        $subject = $emailData['subject'];
        
        // Extract session number from subject or body
        $sessionNumber = null;
        if (preg_match('/Sessie\s+(\d+)/i', $subject, $matches)) {
            $sessionNumber = $matches[1];
        }
        
        // Extract session date from email headers
        $sessionDate = $this->parseEmailDate($emailData['date']);
        
        // Extract lap data based on track format
        $laps = $this->extractLapsData($body, $track);
        
        return [
            'session_number' => $sessionNumber,
            'session_date' => $sessionDate,
            'track_name' => $track->name,
            'laps_count' => count($laps),
            'drivers_detected' => count(array_unique(array_column($laps, 'driver_name'))),
            'laps' => $laps
        ];
    }

    private function extractLapsData($body, $track)
    {
        $laps = [];
        
        // Remove HTML tags to get clean text
        $text = strip_tags($body);
        
        // Detect format based on track or content patterns
        $trackName = strtolower($track->name);
        
        // Lot66 format: Single driver, lap-by-lap with sector times
        if (stripos($trackName, 'lot66') !== false || stripos($text, 'Lap 1') !== false && stripos($text, 'S1') !== false) {
            return $this->extractLot66LapsData($text);
        }
        
        // Elche / Gilesias format: Spanish single driver
        if (stripos($trackName, 'elche') !== false || stripos($trackName, 'gilesias') !== false || 
            stripos($text, 'RESUMEN DE TU CARRERA') !== false || stripos($text, 'Mejor V.') !== false) {
            return $this->extractElcheLapsData($text);
        }
        
        // De Voltage / Goodwill / Circuit Park Berghem: Multi-driver with detailed lap table
        return $this->extractDeVoltageStyleLapsData($text);
    }

    private function extractLot66LapsData($text)
    {
        $laps = [];
        $lines = explode("\n", $text);
        $driverName = null;
        
        // Extract driver name - it's typically on the second line after "Lot66"
        for ($i = 0; $i < min(5, count($lines)); $i++) {
            $line = trim($lines[$i]);
            // Skip "Lot66", dates, and header rows
            if (empty($line) || stripos($line, 'lot66') !== false || 
                preg_match('/\d{2}\.\d{2}\.\d{4}/', $line) || 
                preg_match('/^(Lap|S1|S2|S3|Time)$/i', $line)) {
                continue;
            }
            // This should be the driver name
            if (strlen($line) > 2 && strlen($line) < 50 && !is_numeric($line)) {
                $driverName = $line;
                break;
            }
        }
        
        if (!$driverName) {
            $driverName = 'Unknown Driver';
        }
        
        // Parse lap data - much simpler approach
        $currentLapNumber = null;
        for ($i = 0; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            
            // Check if this is a lap number line (just a number)
            if (is_numeric($line) && (int)$line > 0 && (int)$line < 100) {
                $currentLapNumber = (int)$line;
                
                // Look for "Lap X" on next line
                if ($i + 1 < count($lines) && preg_match('/^Lap\s+\d+$/i', trim($lines[$i + 1]))) {
                    // Skip the sector time lines (-, -, -)
                    // Time should be 5 lines after the lap number (after Lap X, S1, S2, S3, Time)
                    for ($j = $i + 1; $j < min($i + 7, count($lines)); $j++) {
                        $timeLine = trim($lines[$j]);
                        // Match time format: 00:35.560 or 35.560
                        if (preg_match('/^(\d{1,2}:)?\d{2}\.\d{3}$/', $timeLine)) {
                            $lapTime = $this->convertTimeToSeconds($timeLine);
                            if ($lapTime > 0 && $lapTime < 300) {
                                $laps[] = [
                                    'driver_name' => $driverName,
                                    'lap_number' => $currentLapNumber,
                                    'lap_time' => $lapTime,
                                    'position' => null,
                                    'kart_number' => null,
                                ];
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        return $laps;
    }

    private function extractElcheLapsData($text)
    {
        $laps = [];
        $lines = explode("\n", $text);
        $driverName = null;
        $kartNumber = null;
        
        // Extract pilot name and kart number from header
        foreach ($lines as $line) {
            if (preg_match('/Pilotos.*?([A-Za-z0-9_]+)/i', $line, $match)) {
                $driverName = trim($match[1]);
            }
            if (preg_match('/TB\s+(\d+)/i', $line, $match)) {
                $kartNumber = $match[1];
            }
        }
        
        if (!$driverName) {
            $driverName = 'Unknown Driver';
        }
        
        // Parse detailed results section
        $inDetailedSection = false;
        foreach ($lines as $line) {
            $line = trim($line);
            
            if (stripos($line, 'RESULTADOS DETALLADOS') !== false) {
                $inDetailedSection = true;
                continue;
            }
            
            if ($inDetailedSection && preg_match('/^(\d+)\s+(\d{2}:\d{2}\.\d{3})$/', $line, $matches)) {
                $lapNumber = (int)$matches[1];
                $lapTime = $this->convertTimeToSeconds($matches[2]);
                
                if ($lapTime > 0 && $lapTime < 300) {
                    $laps[] = [
                        'driver_name' => $driverName,
                        'lap_number' => $lapNumber,
                        'lap_time' => $lapTime,
                        'position' => null,
                        'kart_number' => $kartNumber,
                    ];
                }
            }
            
            // Stop at average or end
            if (preg_match('/^Avg\./i', $line)) {
                break;
            }
        }
        
        return $laps;
    }

    private function extractDeVoltageStyleLapsData($text)
    {
        $laps = [];
        
        // Pattern for De Voltage format - looks for lap time tables
        // The format is: driver names in header row, then lap numbers and times in subsequent rows
        
        // Extract best scores overview (final positions)
        $lines = explode("\n", $text);
        $bestScoresSection = false;
        $driverPositions = [];
        $driverKarts = [];
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Find the "Heat overview" or "Sessie overzicht" section
            if (stripos($line, 'Heat overview') !== false || 
                stripos($line, 'Best score') !== false ||
                stripos($line, 'Sessie overzicht') !== false ||
                stripos($line, 'Pos.') !== false && stripos($line, 'Kart') !== false) {
                $bestScoresSection = true;
                continue;
            }
            
            // Stop at "Thank you" or other end markers
            if (stripos($line, 'Thank you') !== false || 
                stripos($line, 'Detailed results') !== false ||
                stripos($line, 'Rondetijden per piloot') !== false) {
                $bestScoresSection = false;
                continue;
            }
            
            // Parse position lines (format: "1.      Driver Name      39.761" or "1  10  JORDI 91  18  34.828  35.606")
            if ($bestScoresSection) {
                // De Voltage format: "1.      Driver Name      39.761"
                if (preg_match('/^(\d+)\.\s+(.+?)\s+([\d:.]+)$/', $line, $matches)) {
                    $position = (int)$matches[1];
                    $driverName = trim($matches[2]);
                    $bestTime = $this->convertTimeToSeconds($matches[3]);
                    
                    if ($bestTime > 0 && !empty($driverName)) {
                        $driverPositions[$driverName] = [
                            'position' => $position,
                            'best_time' => $bestTime
                        ];
                    }
                }
                // Goodwill format: "1  10  JORDI 91  18  34.828  35.606"
                else if (preg_match('/^(\d+)\s+(\d+)\s+(.+?)\s+(\d+)\s+([\d:.]+)\s/', $line, $matches)) {
                    $position = (int)$matches[1];
                    $kartNum = $matches[2];
                    $driverName = trim($matches[3]);
                    $bestTime = $this->convertTimeToSeconds($matches[5]);
                    
                    if ($bestTime > 0 && !empty($driverName)) {
                        $driverPositions[$driverName] = [
                            'position' => $position,
                            'best_time' => $bestTime
                        ];
                        $driverKarts[$driverName] = $kartNum;
                    }
                }
            }
        }
        
        // Extract detailed lap-by-lap data from the table
        // Format: columns are drivers, rows are lap numbers
        $detailedSection = false;
        $driverNames = [];
        $lapNumber = 0;
        
        foreach ($lines as $idx => $line) {
            $line = trim($line);
            
            if (stripos($line, 'Detailed results') !== false || 
                stripos($line, 'Rondetijden per piloot') !== false) {
                $detailedSection = true;
                continue;
            }
            
            if ($detailedSection) {
                // Look for driver name headers (line with "Kart    Piloot  1  2  3..." or just driver names)
                if (empty($driverNames) && (stripos($line, 'Piloot') !== false || strlen($line) > 50)) {
                    // For Goodwill format, skip the "Kart Piloot 1 2 3..." header
                    if (stripos($line, 'Kart') !== false && stripos($line, 'Piloot') !== false) {
                        continue;
                    }
                    
                    // Split by multiple spaces to get driver names
                    $driverNames = array_filter(preg_split('/\s{2,}/', $line), function($name) {
                        $name = trim($name);
                        return strlen($name) > 2 && !is_numeric($name) && !preg_match('/^\d+$/', $name);
                    });
                    $driverNames = array_values(array_map('trim', $driverNames));
                    continue;
                }
                
                // For Goodwill format: "10  JORDI 91  36.318  37.711  35.814..."
                if (preg_match('/^(\d+)\s+(.+?)\s+([\d:.]+(?:\s+[\d:.]+)+)$/', $line, $matches)) {
                    $kartNum = $matches[1];
                    $driverName = trim($matches[2]);
                    $timesStr = trim($matches[3]);
                    $times = preg_split('/\s+/', $timesStr);
                    
                    foreach ($times as $lapIdx => $time) {
                        if (!empty($time)) {
                            $lapTime = $this->convertTimeToSeconds($time);
                            if ($lapTime > 0 && $lapTime < 300) {
                                $position = isset($driverPositions[$driverName]) ? 
                                    $driverPositions[$driverName]['position'] : null;
                                
                                $laps[] = [
                                    'driver_name' => $driverName,
                                    'lap_number' => $lapIdx + 1,
                                    'lap_time' => $lapTime,
                                    'position' => $position,
                                    'kart_number' => $kartNum,
                                ];
                            }
                        }
                    }
                    continue;
                }
                
                // De Voltage format: "1       48.762  48.646  48.383  ..."
                if (!empty($driverNames) && preg_match('/^(\d+)\s+(.+)$/', $line, $matches)) {
                    $lapNum = (int)$matches[1];
                    $times = preg_split('/\s+/', trim($matches[2]));
                    
                    foreach ($times as $index => $time) {
                        if (isset($driverNames[$index]) && !empty($time)) {
                            $lapTime = $this->convertTimeToSeconds($time);
                            if ($lapTime > 0 && $lapTime < 300) { // Valid lap time (less than 5 minutes)
                                $driverName = $driverNames[$index];
                                $position = isset($driverPositions[$driverName]) ? 
                                    $driverPositions[$driverName]['position'] : null;
                                
                                $laps[] = [
                                    'driver_name' => $driverName,
                                    'lap_number' => $lapNum,
                                    'lap_time' => $lapTime,
                                    'position' => $position,
                                    'kart_number' => $driverKarts[$driverName] ?? null,
                                ];
                            }
                        }
                    }
                }
                
                // Stop at summary rows (Avg., Hist., Overzicht, etc.)
                if (preg_match('/^(Avg\.|Hist\.|Best scores|Overzicht|Je laatste)/i', $line)) {
                    break;
                }
            }
        }
        
        // If detailed lap data wasn't found, use best scores as single laps
        if (empty($laps) && !empty($driverPositions)) {
            foreach ($driverPositions as $driverName => $data) {
                $laps[] = [
                    'driver_name' => $driverName,
                    'lap_number' => 1,
                    'lap_time' => $data['best_time'],
                    'position' => $data['position'],
                    'kart_number' => $driverKarts[$driverName] ?? null,
                ];
            }
        }
        
        return $laps;
    }

    private function convertTimeToSeconds($timeStr)
    {
        $timeStr = trim($timeStr);
        
        // Handle format like "39.761" (seconds.milliseconds)
        if (preg_match('/^(\d+)\.(\d+)$/', $timeStr, $matches)) {
            return (float)$timeStr;
        }
        
        // Handle format like "1:23.456" (minutes:seconds.milliseconds)
        if (preg_match('/^(\d+):(\d+\.\d+)$/', $timeStr, $matches)) {
            $minutes = (int)$matches[1];
            $seconds = (float)$matches[2];
            return $minutes * 60 + $seconds;
        }
        
        return 0;
    }

    private function parseEmailDate($dateStr)
    {
        try {
            $date = new \DateTime($dateStr);
            return $date->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return now()->format('Y-m-d H:i:s');
        }
    }

    private function checkDuplicate($sessionData, $trackId)
    {
        if (!isset($sessionData['session_date'])) {
            return null;
        }
        
        // Check if a session exists with same track and date (within 1 hour)
        $sessionDate = new \DateTime($sessionData['session_date']);
        
        $existing = KartingSession::where('track_id', $trackId)
            ->whereBetween('session_date', [
                $sessionDate->modify('-1 hour')->format('Y-m-d H:i:s'),
                $sessionDate->modify('+2 hours')->format('Y-m-d H:i:s')
            ])
            ->with(['laps.driver'])
            ->first();
        
        if ($existing) {
            return [
                'exists' => true,
                'session_id' => $existing->id,
                'session_date' => $existing->session_date,
                'laps_count' => $existing->laps->count(),
                'drivers' => $existing->laps->pluck('driver.name')->unique()->values()
            ];
        }
        
        return null;
    }

    /**
     * Mark best laps and calculate gaps for a session
     */
    private function markBestLapsAndCalculateGaps($sessionId)
    {
        // Get all laps for this session grouped by driver
        $drivers = Lap::where('karting_session_id', $sessionId)
            ->select('driver_id')
            ->distinct()
            ->pluck('driver_id');

        foreach ($drivers as $driverId) {
            $driverLaps = Lap::where('karting_session_id', $sessionId)
                ->where('driver_id', $driverId)
                ->orderBy('lap_time', 'asc')
                ->get();

            if ($driverLaps->isEmpty()) {
                continue;
            }

            // Find the best lap (lowest time)
            $bestLap = $driverLaps->first();
            $bestLapTime = $bestLap->lap_time;

            // Mark best lap and calculate gaps
            foreach ($driverLaps as $lap) {
                $gap = $lap->lap_time - $bestLapTime;
                
                $lap->update([
                    'is_best_lap' => $lap->id === $bestLap->id,
                    'gap_to_best_lap' => $gap > 0 ? $gap : null,
                ]);
            }
        }

        // Calculate interval/gap to previous position (if positions are available)
        $lapsWithPositions = Lap::where('karting_session_id', $sessionId)
            ->whereNotNull('position')
            ->orderBy('position', 'asc')
            ->get();

        $previousLap = null;
        foreach ($lapsWithPositions as $lap) {
            if ($previousLap) {
                $interval = $lap->lap_time - $previousLap->lap_time;
                $lap->update([
                    'gap_to_previous' => $interval,
                ]);
            }
            $previousLap = $lap;
        }
    }
}

