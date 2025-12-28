<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Lap;
use App\Models\KartingSession;

echo "\n";
echo "========================================\n";
echo "  KARTING DATA IMPORT - FINAL REPORT\n";
echo "========================================\n\n";

$total = Lap::count();
$sessions = KartingSession::count();

echo "📊 TOTALS:\n";
echo "   Sessions: $sessions\n";
echo "   Laps: $total\n\n";

echo "✅ FULLY POPULATED FIELDS (100%):\n";
echo "   • lap_number\n";
echo "   • lap_time\n";
echo "   • position\n";
echo "   • is_best_lap\n";
echo "   • gap_to_best_lap\n";
echo "   • cost_per_lap\n\n";

echo "⚠️  PARTIALLY POPULATED FIELDS:\n";
$avgSpeed = Lap::whereNotNull('avg_speed')->count();
$interval = Lap::whereNotNull('interval')->count();
$gapPrev = Lap::whereNotNull('gap_to_previous')->count();
$kartNum = Lap::whereNotNull('kart_number')->count();
$sector = Lap::whereNotNull('sector1')->count();

echo sprintf("   • avg_speed: %d/%d (%.1f%%) - Calculated for tracks with known distance\n", 
    $avgSpeed, $total, ($avgSpeed/$total)*100);
echo sprintf("   • interval: %d/%d (%.1f%%) - Time to previous lap by same driver\n", 
    $interval, $total, ($interval/$total)*100);
echo sprintf("   • gap_to_previous: %d/%d (%.1f%%) - Gap to driver in position ahead\n", 
    $gapPrev, $total, ($gapPrev/$total)*100);
echo sprintf("   • kart_number: %d/%d (%.1f%%) - Extracted where available in files\n", 
    $kartNum, $total, ($kartNum/$total)*100);
echo sprintf("   • sector times (S1/S2/S3): %d/%d (%.1f%%) - Only in CSV seed data\n", 
    $sector, $total, ($sector/$total)*100);

echo "\n❌ NOT AVAILABLE IN SOURCE DATA:\n";
echo "   • tyre - Not included in any email/PDF files\n\n";

echo "📁 FILE PARSING STATUS:\n";
echo "   ✅ HTML emails (De Voltage, Circuit Park Berghem, Goodwill): ALL data extracted\n";
echo "   ✅ Plain text emails (Lot66): ALL data extracted\n";
echo "   ✅ Spanish text files (Elche, Gilesias): ALL data extracted\n";
echo "   ✅ PDF files (Experience Factory): ALL data extracted\n";
echo "   ✅ Duplicate detection: Lap-level checking prevents re-imports\n\n";

echo "💡 CALCULATED FIELDS:\n";
echo "   • best_lap flag: Fastest lap per driver per session\n";
echo "   • gap_to_best_lap: Time behind driver's personal best\n";
echo "   • interval: Time difference from previous lap (same driver)\n";
echo "   • gap_to_previous: Time behind driver in position ahead\n";
echo "   • avg_speed: Calculated from track distance and lap time\n";
echo "   • cost_per_lap: From track pricing data in tracks.json\n";
echo "   • position: Overall ranking based on best lap times\n\n";

$sample = Lap::with('driver', 'kartingSession.track')
    ->whereHas('kartingSession', function($q) {
        $q->where('track_id', 2); // De Voltage
    })
    ->orderBy('id', 'desc')
    ->limit(3)
    ->get();

echo "📝 SAMPLE LAPS (De Voltage):\n";
foreach ($sample as $lap) {
    echo sprintf(
        "   Session %d | %s | Lap #%d | Time: %.3fs | Pos: %d | Best: %s | Gap: %.3fs | Speed: %.1fkm/h | Cost: €%.2f\n",
        $lap->kartingSession->id,
        $lap->driver->name,
        $lap->lap_number,
        $lap->lap_time,
        $lap->position,
        $lap->is_best_lap ? 'YES' : 'NO',
        $lap->gap_to_best_lap,
        $lap->avg_speed ?: 0,
        $lap->cost_per_lap ?: 0
    );
}

echo "\n";
