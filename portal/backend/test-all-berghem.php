<?php

require __DIR__ . '/vendor/autoload.php';

$parser = new App\Services\EmlParser();
$folder = 'C:\laragon\www\karting\data-importer\eml-samples\Circuit Park Berghem';

// Get all Heat files
$files = [
    'Results - 3 - Heat.eml',
    'Results - 5 - Heat.eml',
    'Results - 6 - Heat.eml',
    'Results - 9 - Heat.eml',
    'Results - 10 - Heat.eml',
];

$totalLaps = 0;
$sessionDetails = [];

foreach ($files as $file) {
    $filePath = $folder . '\\' . $file;
    if (file_exists($filePath)) {
        $result = $parser->parse($filePath, 4); // Track ID 4 = Circuit Park Berghem
        $lapCount = count($result['laps']);
        $totalLaps += $lapCount;
        $sessionDetails[] = [
            'file' => $file,
            'laps' => $lapCount,
            'session_number' => $result['session_info']['session_number'] ?? 'unknown'
        ];
    }
}

echo "Circuit Park Berghem - All Heat Sessions\n";
echo "=========================================\n\n";

$allLapsByDriver = [];

foreach ($files as $file) {
    $filePath = $folder . '\\' . $file;
    if (file_exists($filePath)) {
        $result = $parser->parse($filePath, 4);
        
        // Count laps per driver for this session
        foreach ($result['laps'] as $lap) {
            $driver = $lap['driver_name'];
            if (!isset($allLapsByDriver[$driver])) {
                $allLapsByDriver[$driver] = 0;
            }
            $allLapsByDriver[$driver]++;
        }
    }
}

foreach ($sessionDetails as $detail) {
    echo "Heat {$detail['session_number']}: {$detail['laps']} laps\n";
}

echo "\nTotal laps across all 5 sessions: $totalLaps\n";
echo "Average laps per session: " . round($totalLaps / count($files), 1) . "\n";
echo "\nTotal unique drivers: " . count($allLapsByDriver) . "\n";

// Show laps for max van lierop
if (isset($allLapsByDriver['max van lierop'])) {
    echo "\n✓ max van lierop: " . $allLapsByDriver['max van lierop'] . " laps\n";
} else {
    echo "\n✗ max van lierop: NOT FOUND\n";
}

// Show top 10 drivers by lap count
arsort($allLapsByDriver);
echo "\nTop 10 drivers by lap count:\n";
$count = 0;
foreach ($allLapsByDriver as $driver => $laps) {
    echo "  $driver: $laps laps\n";
    if (++$count >= 10) break;
}
