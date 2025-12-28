<?php

require __DIR__ . '/vendor/autoload.php';

$parser = new App\Services\EmlParser();
$file = 'C:\laragon\www\karting\data-importer\eml-samples\Circuit Park Berghem\Results - 10 - Heat.eml';

echo "Testing parser->parse() directly:\n";
echo "====================================\n\n";

$result = $parser->parse($file, 4);

echo "Total laps parsed: " . count($result['laps']) . "\n";
echo "Session number: " . ($result['session_info']['session_number'] ?? 'unknown') . "\n\n";

// Group by driver
$byDriver = [];
foreach ($result['laps'] as $lap) {
    $driver = $lap['driver_name'];
    if (!isset($byDriver[$driver])) {
        $byDriver[$driver] = 0;
    }
    $byDriver[$driver]++;
}

echo "Laps per driver:\n";
arsort($byDriver);
foreach ($byDriver as $driver => $count) {
    echo "  $driver: $count laps\n";
}
