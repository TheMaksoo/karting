<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\EmlParser;

// Test Goodwill Karting
echo "=== Testing Goodwill Karting ===\n";
$parser = new EmlParser();
$goodwillFile = __DIR__ . '/data-importer/eml-samples/Goodwill Karting/Fwd_ Goodwill Karting - Resultaten Sessie 7 Max.eml';
$result = $parser->parse($goodwillFile, 5); // Track ID 5 = Goodwill Karting

echo "Session Info:\n";
print_r($result['session_info']);
echo "\nDrivers found: " . count(array_unique(array_column($result['laps'], 'driver_name'))) . "\n";
echo "Total laps: " . count($result['laps']) . "\n";

$driverNames = array_unique(array_column($result['laps'], 'driver_name'));
echo "Driver names:\n";
foreach ($driverNames as $name) {
    $driverLaps = array_filter($result['laps'], fn($lap) => $lap['driver_name'] === $name);
    echo "  - {$name} ({" . count($driverLaps) . "} laps)\n";
}

echo "\n\n=== Testing Experience Factory Antwerp ===\n";
$expFile = __DIR__ . '/data-importer/eml-samples/Experience Factory Antwerp/Experience Factory Antwerp Max.eml';
$result2 = $parser->parse($expFile, 3); // Track ID 3 = Experience Factory Antwerp

echo "Session Info:\n";
print_r($result2['session_info']);
echo "\nDrivers found: " . count(array_unique(array_column($result2['laps'], 'driver_name'))) . "\n";
echo "Total laps: " . count($result2['laps']) . "\n";

$driverNames2 = array_unique(array_column($result2['laps'], 'driver_name'));
echo "Driver names:\n";
foreach ($driverNames2 as $name) {
    $driverLaps2 = array_filter($result2['laps'], fn($lap) => $lap['driver_name'] === $name);
    echo "  - {$name} (" . count($driverLaps2) . " laps)\n";
}
