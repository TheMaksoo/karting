<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use App\Models\Upload;
use App\Services\EmlParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmlUploadController extends Controller
{
    public function parseEml(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:eml,txt,pdf,html,csv',
            'track_id' => 'nullable|exists:tracks,id',
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();

        // Read file content
        $content = file_get_contents($file->getRealPath());
        $fileHash = md5($content);

        // Check if this exact file was already uploaded
        $existingUpload = Upload::where('file_hash', $fileHash)->first();

        if ($existingUpload) {
            return response()->json([
                'success' => false,
                'duplicate_file' => true,
                'file_name' => $fileName,
                'existing_upload' => [
                    'id' => $existingUpload->id,
                    'file_name' => $existingUpload->file_name,
                    'upload_date' => $existingUpload->upload_date,
                    'session_date' => $existingUpload->session_date,
                    'laps_count' => $existingUpload->laps_count,
                    'drivers_count' => $existingUpload->drivers_count,
                    'status' => $existingUpload->status,
                ],
                'message' => "This exact file '{$existingUpload->file_name}' was already uploaded on {$existingUpload->upload_date->format('Y-m-d H:i:s')}",
            ], 409);
        }

        $warnings = [];
        $errors = [];

        try {
            // Save temporary file
            $tempPath = storage_path('app/temp/' . $fileName);

            if (! is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0777, true);
            }
            file_put_contents($tempPath, $content);

            // Check if track_id was manually provided (force track override)
            if ($request->has('track_id') && $request->track_id) {
                $track = Track::find($request->track_id);

                if (! $track) {
                    @unlink($tempPath);

                    return response()->json([
                        'success' => false,
                        'file_name' => $fileName,
                        'errors' => ['Invalid track ID provided'],
                    ], 400);
                }
            } else {
                // Auto-detect track from filename or content
                $track = $this->detectTrackFromFile($fileName, $content);

                if (! $track) {
                    // Save a small debug snapshot for failed detections to help investigate batch issues
                    try {
                        $emailData = $this->parseEmailContent($content);
                        $snippet = substr($emailData['subject'] ?? '', 0, 200) . "\n" . substr($emailData['from'] ?? '', 0, 200) . "\n\n" . substr($emailData['body'] ?? '', 0, 2000);
                    } catch (\Exception $e) {
                        $snippet = substr($content, 0, 2000);
                    }

                    $debugPath = storage_path('app/temp/failed-detection-' . time() . '-' . md5($fileName) . '.txt');
                    @mkdir(dirname($debugPath), 0777, true);
                    @file_put_contents($debugPath, "filename: {$fileName}\n\nsnippet:\n{$snippet}");

                    // Don't delete temp file - keep it for potential retry with manual track selection
                    $errors[] = 'Could not auto-detect track. Please select manually.';

                    return response()->json([
                        'success' => false,
                        'file_name' => $fileName,
                        'errors' => $errors,
                        'available_tracks' => Track::select('id', 'name', 'city')->get(),
                        'require_manual_input' => true,
                        'debug_file' => $debugPath,
                    ], 400);
                }
            }

            // Use EmlParser service to parse the file
            $parser = new EmlParser();
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            try {
                $parsedData = match ($extension) {
                    'eml' => $parser->parse($tempPath, $track->id),
                    'txt' => $parser->parseTextFile($tempPath, $track->id),
                    'pdf' => $parser->parsePdfFile($tempPath, $track->id),
                    '' => $parser->parseTextFile($tempPath, $track->id), // Extensionless files
                    default => throw new \Exception("Unsupported file type: $extension")
                };
            } catch (\Exception $e) {
                @unlink($tempPath);
                $errors[] = $e->getMessage();

                return response()->json([
                    'success' => false,
                    'file_name' => $fileName,
                    'errors' => $errors,
                ], 400);
            }

            @unlink($tempPath);

            // Validate extracted data
            if (empty($parsedData['laps'])) {
                $errors[] = 'No lap data found in file. Check if format is supported.';
            }

            if (count($parsedData['laps']) === 0) {
                $errors[] = 'No valid lap times could be extracted';
            }

            $driversDetected = count(array_unique(array_column($parsedData['laps'], 'driver_name')));

            if ($driversDetected === 0) {
                $errors[] = 'No drivers detected in lap data';
            }

            if (! empty($errors)) {
                return response()->json([
                    'success' => false,
                    'file_name' => $fileName,
                    'errors' => $errors,
                ], 400);
            }

            // Extract session date
            $sessionDate = $parsedData['session_info']['date'] ?? now()->format('Y-m-d');

            // Format response with parsed data (wrap in 'data' for frontend compatibility)
            return response()->json([
                'success' => true,
                'file_name' => $fileName,
                'file_hash' => $fileHash,
                'track' => $track,
                'warnings' => $warnings,
                'data' => [
                    'session_date' => $sessionDate,
                    'session_time' => $parsedData['session_info']['time'] ?? null,
                    'session_number' => $parsedData['session_info']['session_number'] ?? null,
                    'laps_count' => count($parsedData['laps']),
                    'drivers_detected' => $driversDetected,
                    'drivers' => array_values(array_unique(array_column($parsedData['laps'], 'driver_name'))),
                    'laps' => $parsedData['laps'],
                    'file_hash' => $fileHash,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse file: ' . $e->getMessage(),
                'file_name' => $fileName,
                'errors' => [$e->getMessage()],
            ], 500);
        }
    }

    private function detectTrackFromFile($fileName, $content)
    {
        // Search a larger slice of the raw content (some EMLs embed useful text later)
        $searchText = strtolower($fileName . ' ' . substr($content, 0, 20000));

        // Track detection patterns - now using NAME-BASED lookup instead of hardcoded IDs
        $trackPatterns = [
            'De Voltage' => ['devoltage', 'de voltage', 'karten sessie'],
            'Experience Factory' => ['experience factory', 'experiencefactory', 'antwerp'],
            'Goodwill Karting' => ['goodwill', 'goodwillkarting'],
            'Circuit Park Berghem' => ['berghem', 'circuit park', 'circuitpark', 'circuitpark berghem', 'circuit park berghem'],
            'Fastkart Elche' => ['fastkart', 'elche', 'resumen de tu carrera'],
            'Lot66' => ['lot66', 'lot 66'],
            'Racing Center Gilesias' => ['gilesias', 'racing center'],
        ];

        foreach ($trackPatterns as $trackName => $patterns) {
            foreach ($patterns as $pattern) {
                if (stripos($searchText, $pattern) !== false) {
                    // Find track by name (case-insensitive) - works regardless of database ID
                    try {
                        $track = Track::whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($trackName) . '%'])->first();

                        if ($track) {
                            return $track;
                        }

                        // If track doesn't exist, create it automatically
                        return Track::create([
                            'track_id' => 'TRK-' . strtoupper(substr(md5($trackName), 0, 6)),
                            'name' => $trackName,
                            'city' => $this->getTrackCity($trackName),
                            'country' => $this->getTrackCountry($trackName),
                        ]);
                    } catch (\Throwable $e) {
                        // Return fallback object when DB is not reachable in this environment
                        $obj = new \stdClass();
                        $obj->id = 0; // Placeholder - will fail validation intentionally
                        $obj->name = $trackName;
                        $obj->city = $this->getTrackCity($trackName);
                        $obj->country = $this->getTrackCountry($trackName);

                        return $obj;
                    }
                }
            }
        }

        // If simple heuristics failed, try parsing the EML to get decoded headers/body
        try {
            $emailData = $this->parseEmailContent($content);

            // Extra explicit checks for Circuit Park Berghem markers
            $bodyLower = strtolower($emailData['body'] ?? '');
            $subjectLower = strtolower($emailData['subject'] ?? '');
            $fromLower = strtolower($emailData['from'] ?? '');

            $additionalBerghemMarkers = ['smstiming', 'circuitparkberghem', 'circuitpark berghem', 'race overzicht', 'jouw rondetijden'];

            foreach ($additionalBerghemMarkers as $marker) {
                if (stripos($bodyLower, $marker) !== false || stripos($subjectLower, $marker) !== false || stripos($fromLower, $marker) !== false) {
                    // Prefer finding existing track by name; fallback to creating a basic Track record if DB available
                    try {
                        $t = Track::whereRaw('LOWER(name) LIKE ?', ['%circuit park berghem%'])->first();

                        if ($t) {
                            return $t;
                        }

                        return Track::create([
                            'track_id' => 'TRK-' . strtoupper(substr(md5('Circuit Park Berghem'), 0, 6)),
                            'name' => 'Circuit Park Berghem',
                            'city' => 'Berghem',
                            'country' => 'Netherlands',
                        ]);
                    } catch (\Throwable $e) {
                        // If DB not available in this environment, fall back to detectTrack() below
                        break;
                    }
                }
            }

            $detected = $this->detectTrack($emailData);

            if ($detected) {
                return $detected;
            }
        } catch (\Throwable $e) {
            // Fall through to null if parsing fails
        }

        return null;
    }

    public function saveSession(Request $request)
    {
        $request->validate([
            'track_id' => 'required|exists:tracks,id',
            'session_date' => 'required|date',
            'heat' => 'nullable|integer',
            'heat_price' => 'nullable|numeric',
            'weather' => 'nullable|string',
            'notes' => 'nullable|string',
            'laps' => 'required|array',
            'laps.*.driver_name' => 'required|string',
            'laps.*.lap_number' => 'required|integer',
            'laps.*.lap_time' => 'required|numeric|gt:0',
            'laps.*.position' => 'nullable|integer',
            'laps.*.kart_number' => 'nullable|string',
            'file_name' => 'nullable|string',
            'file_hash' => 'nullable|string',
            'replace_duplicate' => 'nullable|boolean',
        ]);

        DB::beginTransaction();

        try {
            // If replacing duplicate, delete old session
            if ($request->replace_duplicate && $request->file_hash) {
                $oldUpload = Upload::where('file_hash', $request->file_hash)->first();

                if ($oldUpload && $oldUpload->karting_session_id) {
                    $oldSession = KartingSession::find($oldUpload->karting_session_id);

                    if ($oldSession) {
                        $oldSession->delete(); // Cascade deletes laps
                    }
                    $oldUpload->delete();
                }
            }

            // Create session
            $session = KartingSession::create([
                'track_id' => $request->track_id,
                'session_date' => $request->session_date,
                'heat' => $request->heat,
                'heat_price' => $request->heat_price ?? 0,
                'weather' => $request->weather,
                'notes' => $request->notes,
                'session_type' => $request->session_type ?? 'race',
                'session_number' => $request->session_number,
            ]);

            // Process laps grouped by driver
            $driverLaps = collect($request->laps)->groupBy('driver_name');

            $driversProcessed = [];
            $newDriversCreated = [];

            foreach ($driverLaps as $driverName => $laps) {
                // Find or create driver by name only
                $driver = Driver::firstOrCreate(
                    ['name' => $driverName],
                    ['email' => null, 'track_id' => $session->track_id]
                );

                // Track if this is a new driver
                if ($driver->wasRecentlyCreated) {
                    $newDriversCreated[] = [
                        'id' => $driver->id,
                        'name' => $driver->name,
                    ];
                }

                $driversProcessed[] = $driverName;

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
                    ]);
                }
            }

            // Calculate all derived fields (best lap, gaps, speed, cost, etc.)
            $this->calculateSessionFields($session->id);

            // Record upload
            if ($request->file_name && $request->file_hash) {
                Upload::create([
                    'file_name' => $request->file_name,
                    'file_hash' => $request->file_hash,
                    'upload_date' => now(),
                    'session_date' => $session->session_date,
                    'session_time' => $request->session_time,
                    'karting_session_id' => $session->id,
                    'track_id' => $session->track_id,
                    'status' => 'success',
                    'warnings' => $request->warnings ?? null,
                    'laps_count' => count($request->laps),
                    'drivers_count' => count($driversProcessed),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'session' => $session->load(['track', 'laps.driver']),
                'laps_imported' => count($request->laps),
                'drivers_processed' => $driversProcessed,
                'new_drivers_created' => $newDriversCreated, // Return new drivers for potential connection
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to save session: ' . $e->getMessage(),
                'error_details' => [
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                ],
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
                            // Remove all whitespace from base64
                            $base64Content = str_replace(["\r", "\n", ' ', "\t"], '', $contentMatch[1]);
                            // Remove boundary markers
                            $base64Content = preg_replace('/--' . preg_quote($boundary, '/') . '.*$/s', '', $base64Content);
                            $plainTextBody = base64_decode($base64Content);
                        }
                    } elseif (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $part)) {
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
                            $base64Content = str_replace(["\r", "\n", ' ', "\t"], '', $contentMatch[1]);
                            $base64Content = preg_replace('/--' . preg_quote($boundary, '/') . '.*$/s', '', $base64Content);
                            $htmlBody = base64_decode($base64Content);
                        }
                    } elseif (preg_match('/Content-Transfer-Encoding:\s*quoted-printable/i', $part)) {
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
            $body = ! empty($plainTextBody) ? $plainTextBody : $htmlBody;
        } else {
            // Single part message
            if (preg_match('/Content-Transfer-Encoding:\s*base64/i', $content)) {
                // Extract base64 content after headers
                $base64Content = str_replace(["\r", "\n", ' ', "\t"], '', $bodyText);
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
            'body' => $body,
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
            'Racing Center Gilesias' => 'Gilesias',
        ];

        return $cities[$trackName] ?? null;
    }

    private function getTrackCountry($trackName)
    {
        $countries = [
            'De Voltage' => 'Netherlands',
            'Experience Factory' => 'Belgium',
            'Goodwill Karting' => 'Netherlands',
            'Circuit Park Berghem' => 'Netherlands',
            'Fastkart Elche' => 'Spain',
            'Lot66' => 'Netherlands',
            'Racing Center Gilesias' => 'Spain',
        ];

        return $countries[$trackName] ?? 'Netherlands';
    }

    /**
     * Mark best laps and calculate gaps for a session
     */
    private function calculateSessionFields(int $sessionId): void
    {
        $session = KartingSession::with(['laps' => function ($query) {
            $query->orderBy('driver_id')->orderBy('lap_number');
        }, 'laps.driver', 'track'])->find($sessionId);

        if (! $session) {
            return;
        }

        // Group laps by driver
        $lapsByDriver = $session->laps->groupBy('driver_id');

        foreach ($lapsByDriver as $driverLaps) {
            // Find best lap for this driver
            $bestLap = $driverLaps->sortBy('lap_time')->first();
            $bestLapTime = $bestLap->lap_time;

            $previousLapTime = null;

            foreach ($driverLaps->sortBy('lap_number') as $lap) {
                $updates = [];

                // Mark best lap
                $updates['is_best_lap'] = ($lap->lap_time == $bestLapTime);

                // Calculate gap to best lap
                $updates['gap_to_best_lap'] = round($lap->lap_time - $bestLapTime, 3);

                // Calculate interval (time difference from previous lap by THIS driver)
                if ($previousLapTime !== null) {
                    $updates['interval'] = round($lap->lap_time - $previousLapTime, 3);
                }
                $previousLapTime = $lap->lap_time;

                // Calculate average speed if track distance is known
                if ($session->track && $session->track->distance) {
                    // Speed = distance / time = (distance_meters / lap_time) * 3.6 for km/h
                    $updates['avg_speed'] = round(($session->track->distance / $lap->lap_time) * 3.6, 2);
                }

                // Calculate cost per lap if track pricing is known
                if ($session->track && isset($session->track->pricing['costPerLap'])) {
                    $updates['cost_per_lap'] = $session->track->pricing['costPerLap'];
                }

                // Update lap
                $lap->update($updates);
            }
        }

        // Calculate gap_to_previous (gap to driver in position ahead) for each lap number
        // Group all session laps by lap_number, not the already-grouped driver laps
        $allLaps = $session->laps;

        foreach ($allLaps->groupBy('lap_number') as $lapsAtSameNumber) {
            $sortedLaps = $lapsAtSameNumber->sortBy('lap_time');

            $previousLapTime = null;

            foreach ($sortedLaps as $lap) {
                if ($previousLapTime !== null) {
                    $lap->update([
                        'gap_to_previous' => round($lap->lap_time - $previousLapTime, 3),
                    ]);
                }
                $previousLapTime = $lap->lap_time;
            }
        }

        // Calculate overall session positions based on best lap times
        $allBestLaps = $session->laps()
            ->where('is_best_lap', true)
            ->orderBy('lap_time')
            ->get();

        foreach ($allBestLaps as $index => $bestLap) {
            // Update position for ALL laps of this driver in this session
            Lap::where('karting_session_id', $sessionId)
                ->where('driver_id', $bestLap->driver_id)
                ->update(['position' => $index + 1]);
        }
    }
}
