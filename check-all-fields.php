<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Lap;

$total = Lap::count();

echo "\n========== ALL LAP FIELDS COVERAGE ==========\n";
echo "Total laps: $total\n\n";

// Check each field
$fields = [
    'lap_number',
    'lap_time',
    'position',
    'sector1',
    'sector2',
    'sector3',
    'is_best_lap',
    'gap_to_best_lap',
    'interval',
    'gap_to_previous',
    'avg_speed',
    'kart_number',
    'tyre',
    'cost_per_lap'
];

foreach ($fields as $field) {
    $count = Lap::whereNotNull($field)->count();
    $percentage = $total > 0 ? round(($count / $total) * 100, 1) : 0;
    $status = $percentage == 100 ? '✅' : ($percentage > 0 ? '⚠️' : '❌');
    echo sprintf("%s %-20s: %4d / %4d (%5.1f%%)\n", $status, $field, $count, $total, $percentage);
}

echo "\n========== MISSING DATA SUMMARY ==========\n";
$missingSector = Lap::whereNull('sector1')->count();
$missingInterval = Lap::whereNull('interval')->count();
$missingGapPrev = Lap::whereNull('gap_to_previous')->count();
$missingTyre = Lap::whereNull('tyre')->count();
$missingCost = Lap::whereNull('cost_per_lap')->count();

echo "Laps missing sector times: $missingSector\n";
echo "Laps missing interval: $missingInterval\n";
echo "Laps missing gap_to_previous: $missingGapPrev\n";
echo "Laps missing tyre: $missingTyre\n";
echo "Laps missing cost: $missingCost\n";

echo "\n";
