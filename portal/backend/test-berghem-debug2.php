<?php

require __DIR__ . '/vendor/autoload.php';

$parser = new App\Services\EmlParser();
$file = 'C:\laragon\www\karting\data-importer\eml-samples\Circuit Park Berghem\Results - 10 - Heat.eml';

// Use reflection to access private method
$reflection = new ReflectionClass($parser);
$method = $reflection->getMethod('parseCircuitParkBerghemFormat');
$method->setAccessible(true);

// Read file content
$html = file_get_contents($file);

// Call the parser method directly
$result = $method->invoke($parser, $html);

echo "Session info:\n";
print_r($result['session_info']);
echo "\n";

echo 'Total laps: ' . count($result['laps']) . "\n\n";

// Group by driver
$byDriver = [];

foreach ($result['laps'] as $lap) {
    $driver = $lap['driver_name'];

    if (! isset($byDriver[$driver])) {
        $byDriver[$driver] = [];
    }
    $byDriver[$driver][] = $lap;
}

echo "Laps per driver:\n";

foreach ($byDriver as $driver => $laps) {
    echo "  $driver: " . count($laps) . " laps\n";
}

echo "\nMax van lierop's laps:\n";

if (isset($byDriver['max van lierop'])) {
    foreach ($byDriver['max van lierop'] as $lap) {
        echo "  Lap {$lap['lap_number']}: {$lap['lap_time']}s\n";
    }
}
