<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Track;
use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Services\EmlParser;
use Illuminate\Support\Facades\DB;

/**
 * Calculate missing fields for all laps in a session
 * Calculates: best_lap flag, gap_to_best_lap, gap_to_previous, interval, position
 */
function calculateSessionFields(int $sessionId): void
{
    $session = KartingSession::with(['laps' => function($query) {
        $query->orderBy('driver_id')->orderBy('lap_number');
    }, 'laps.driver', 'track'])->find($sessionId);
    
    if (!$session) return;
    
    // Group laps by driver
    $lapsByDriver = $session->laps->groupBy('driver_id');
    
    foreach ($lapsByDriver as $driverId => $driverLaps) {
        // Find best lap for this driver
        $bestLap = $driverLaps->sortBy('lap_time')->first();
        $bestLapTime = $bestLap->lap_time;
        
        $previousLapTime = null;
        
        foreach ($driverLaps as $index => $lap) {
            $updates = [];
            
            // Mark best lap
            $updates['is_best_lap'] = ($lap->lap_time == $bestLapTime);
            
            // Calculate gap to best lap
            $updates['gap_to_best_lap'] = round($lap->lap_time - $bestLapTime, 3);
            
            // Calculate interval (gap to previous lap)
            if ($previousLapTime !== null) {
                $updates['interval'] = round($lap->lap_time - $previousLapTime, 3);
            }
            $previousLapTime = $lap->lap_time;
            
            // Calculate gap to previous position (if position data available)
            if ($lap->position && $lap->position > 1) {
                $previousPosition = $driverLaps->where('lap_number', $lap->lap_number)
                    ->where('position', $lap->position - 1)
                    ->first();
                if ($previousPosition) {
                    $updates['gap_to_previous'] = round($lap->lap_time - $previousPosition->lap_time, 3);
                }
            }
            
            // Calculate average speed if track length is known
            if ($session->track && $session->track->distance) {
                // Speed = distance / time = (distance_meters / lap_time) * 3.6 for km/h
                $updates['avg_speed'] = round(($session->track->distance / $lap->lap_time) * 3.6, 2);
            }
            
            // Update lap
            $lap->update($updates);
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

echo "\n===========================================\n";
echo "  BATCH EML/PDF/TXT FILE PROCESSOR\n";
echo "===========================================\n\n";

$emlPath = __DIR__ . '/data-importer/eml-samples';

// Folder to Track ID mapping
$folderToTrack = [
    'De Voltage' => 2,
    'Elche' => 1,
    'Fastkart Elche' => 1,
    'Experience Factory Antwerp' => 3,
    'Circuit Park Berghem' => 4,
    'Goodwill Karting' => 5,
    'Lot66' => 6,
    'Gilesias' => 7,
    'Racing Center Gilesias' => 7,
];

$parser = new EmlParser();
$totalFiles = 0;
$totalLaps = 0;
$totalDrivers = 0;

// Get all subdirectories
$directories = array_filter(glob($emlPath . '/*'), 'is_dir');

foreach ($directories as $dir) {
    $folderName = basename($dir);
    
    echo "\n================================================\n";
    echo "Processing folder: $folderName\n";
    echo "================================================\n";
    
    // Find matching track
    $trackId = $folderToTrack[$folderName] ?? null;
    
    if (!$trackId) {
        echo "❌ No track mapping found for: $folderName\n";
        echo "   Skipping...\n";
        continue;
    }
    
    $track = Track::find($trackId);
    if (!$track) {
        echo "❌ Track ID $trackId not found in database\n";
        continue;
    }
    
    echo "✓ Matched to track: {$track->name} (ID: {$track->id})\n\n";
    
    // Get all files in this directory and subdirectories
    $files = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $ext = strtolower($file->getExtension());
            // Include .eml, .pdf, .txt, and extensionless files (likely plain text)
            if (in_array($ext, ['eml', 'pdf', 'txt']) || empty($ext)) {
                $files[] = $file->getPathname();
            }
        }
    }
    
    echo "Found " . count($files) . " files\n\n";
    
    foreach ($files as $filePath) {
        $filename = basename($filePath);
        echo "  Processing: $filename ... ";
        
        try {
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            
            // Parse file based on extension (treat extensionless files as text)
            $parsedData = match($extension) {
                'eml' => $parser->parse($filePath, $trackId),
                'txt' => $parser->parseTextFile($filePath, $trackId),
                'pdf' => $parser->parsePdfFile($filePath, $trackId),
                '' => $parser->parseTextFile($filePath, $trackId), // Extensionless = text
                default => throw new Exception("Unsupported file type: $extension")
            };
            
            if (empty($parsedData['laps'])) {
                echo "⚠️  No laps found\n";
                continue;
            }
            
            // Start transaction
            DB::beginTransaction();
            
            $sessionDate = $parsedData['session_info']['date'] ?? now()->format('Y-m-d');
            
            // Find or create session for this track and date
            $session = KartingSession::firstOrCreate(
                [
                    'track_id' => $trackId,
                    'session_date' => $sessionDate,
                ],
                [
                    'date' => $sessionDate,
                    'session_type' => 'practice',
                    'notes' => "Imported from $filename",
                ]
            );
            
            $sessionDrivers = [];
            $sessionLaps = 0;
            $skippedLaps = 0;
            
            // Process each lap
            foreach ($parsedData['laps'] as $lapIndex => $lapData) {
                $driverName = $lapData['driver_name'] ?? 'Unknown';
                
                // Find or create driver
                $driver = Driver::firstOrCreate(
                    ['name' => $driverName],
                    ['email' => null]
                );
                
                $sessionDrivers[$driver->id] = $driverName;
                
                $lapNumber = $lapData['lap_number'] ?? ($lapIndex + 1);
                $lapTime = $lapData['lap_time'] ?? $lapData['best_lap_time'] ?? null;
                
                // Check if this exact lap already exists (same session, driver, lap number, and lap time)
                $existingLap = Lap::where('karting_session_id', $session->id)
                    ->where('driver_id', $driver->id)
                    ->where('lap_number', $lapNumber)
                    ->where('lap_time', $lapTime)
                    ->first();
                
                if ($existingLap) {
                    $skippedLaps++;
                    continue;
                }
                
                // Create lap
                Lap::create([
                    'karting_session_id' => $session->id,
                    'driver_id' => $driver->id,
                    'lap_number' => $lapNumber,
                    'lap_time' => $lapTime,
                    'position' => $lapData['position'] ?? null,
                    'kart_number' => $lapData['kart_number'] ?? null,
                ]);
                
                $sessionLaps++;
            }
            
            // Calculate and update missing fields for this session
            calculateSessionFields($session->id);
            
            DB::commit();
            
            $driverCount = count($sessionDrivers);
            $totalFiles++;
            $totalLaps += $sessionLaps;
            $totalDrivers += $driverCount;
            
            if ($skippedLaps > 0) {
                echo "✅ $sessionLaps new laps, $driverCount drivers (skipped $skippedLaps duplicates)\n";
            } else {
                echo "✅ $sessionLaps laps, $driverCount drivers\n";
            }
            
        } catch (Exception $e) {
            DB::rollBack();
            echo "❌ ERROR: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n\n===========================================\n";
echo "  BATCH PROCESSING COMPLETE!\n";
echo "===========================================\n";
echo "Files processed: $totalFiles\n";
echo "Total laps imported: $totalLaps\n";
echo "Total drivers: $totalDrivers\n";
echo "\n";
