<?php

require __DIR__ . '/vendor/autoload.php';

use App\Http\Controllers\API\EmlUploadController;

$controller = new EmlUploadController();

$file = 'C:\\laragon\\www\\karting\\data-importer\\eml-samples\\Circuit Park Berghem\\Results - 10 - Heat.eml';
$fileName = basename($file);
$content = file_get_contents($file);

$ref = new ReflectionClass($controller);
$method = $ref->getMethod('detectTrackFromFile');
$method->setAccessible(true);

$track = $method->invoke($controller, $fileName, $content);

if ($track) {
    echo "Detected track: {$track->id} - {$track->name}\n";
} else {
    echo "No track detected\n";
}
