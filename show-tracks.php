<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$tracks = DB::table('tracks')->select('id', 'name', 'city', 'country')->get();

foreach ($tracks as $track) {
    echo "{$track->id} | {$track->name} | {$track->city}, {$track->country}\n";
}
