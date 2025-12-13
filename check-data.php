<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Lap;

$total = Lap::count();
$withBestLap = Lap::whereNotNull('is_best_lap')->count();
$withPosition = Lap::whereNotNull('position')->count();
$withSpeed = Lap::whereNotNull('avg_speed')->count();
$withGap = Lap::whereNotNull('gap_to_best_lap')->count();

echo "\n========== DATABASE STATS ==========\n";
echo "Total laps: $total\n";
echo "With best_lap flag: $withBestLap\n";
echo "With position: $withPosition\n";
echo "With avg_speed: $withSpeed\n";
echo "With gap_to_best_lap: $withGap\n\n";

echo "========== SAMPLE LAPS ==========\n";
$samples = Lap::with('driver', 'kartingSession')
    ->orderBy('id', 'desc')
    ->limit(5)
    ->get();

foreach ($samples as $lap) {
    echo sprintf(
        "ID:%d | Driver:%s | Lap#:%d | Time:%.3fs | Pos:%s | Best:%s | Gap:%.3fs | Speed:%s | Kart:%s\n",
        $lap->id,
        $lap->driver->name,
        $lap->lap_number,
        $lap->lap_time,
        $lap->position ?: 'null',
        $lap->is_best_lap ? 'YES' : 'NO',
        $lap->gap_to_best_lap ?: 0,
        $lap->avg_speed ? number_format($lap->avg_speed, 2) . 'km/h' : 'null',
        $lap->kart_number ?: 'null'
    );
}

echo "\n";
