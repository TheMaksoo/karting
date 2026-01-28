<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$parser = new App\Services\EmlParser();
$file = 'C:\laragon\www\karting\data-importer\eml-samples\Circuit Park Berghem\Results - 10 - Heat.eml';
$result = $parser->parse($file, 4); // Circuit Park Berghem = track ID 4

echo 'Total laps found: ' . count($result['laps']) . PHP_EOL;

// Group laps by driver
$lapsByDriver = [];

foreach ($result['laps'] as $lap) {
    $driver = $lap['driver_name'];

    if (! isset($lapsByDriver[$driver])) {
        $lapsByDriver[$driver] = [];
    }
    $lapsByDriver[$driver][] = $lap;
}

echo "\nLaps per driver:\n";

foreach ($lapsByDriver as $driver => $laps) {
    echo "  $driver: " . count($laps) . " laps\n";
}

// Show Max's laps
if (isset($lapsByDriver['max van lierop'])) {
    $maxLaps = $lapsByDriver['max van lierop'];
    echo "\nMax van lierop's first 5 laps:\n";

    foreach (array_slice($maxLaps, 0, 5) as $lap) {
        echo "  Lap {$lap['lap_number']}: {$lap['lap_time']}s\n";
    }
}
