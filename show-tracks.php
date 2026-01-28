<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $tracks = DB::table('tracks')->select('id', 'name', 'city', 'country')->get();

    echo "\n========== TRACKS ==========\n";
    echo str_pad("ID", 5) . " | " . str_pad("Name", 35) . " | Location\n";
    echo str_repeat("-", 70) . "\n";

    foreach ($tracks as $track) {
        echo str_pad($track->id, 5) . " | " . str_pad($track->name, 35) . " | {$track->city}, {$track->country}\n";
    }
    
    echo "\nTotal tracks: " . count($tracks) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
