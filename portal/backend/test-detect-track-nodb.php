<?php

require __DIR__ . '/vendor/autoload.php';

use App\Http\Controllers\API\EmlUploadController;

$controller = new EmlUploadController();

$file = 'C:\\laragon\\www\\karting\\data-importer\\eml-samples\\Circuit Park Berghem\\Results - 10 - Heat.eml';
$fileName = basename($file);
$content = file_get_contents($file);

// 1) Simple filename/content heuristic (no DB)
$searchText = strtolower($fileName . ' ' . substr($content, 0, 5000));
$trackPatternsId = [
    2 => ['devoltage', 'de voltage', 'karten sessie'],
    3 => ['experience factory', 'experiencefactory', 'antwerp'],
    5 => ['goodwill', 'goodwillkarting'],
    4 => ['berghem', 'circuit park', 'circuitpark', 'circuitpark berghem', 'circuit park berghem'],
    1 => ['fastkart', 'elche', 'resumen de tu carrera'],
    6 => ['lot66', 'lot 66'],
    7 => ['gilesias', 'racing center'],
];

$found = false;
foreach ($trackPatternsId as $trackId => $patterns) {
    foreach ($patterns as $pattern) {
        if (stripos($searchText, $pattern) !== false) {
            echo "Heuristic match: track id {$trackId} (pattern: {$pattern})\n";
            $found = true;
            break 2;
        }
    }
}
if (!$found) {
    echo "No heuristic match from filename/content.\n";
}

// 2) Use parseEmailContent (reflection) to get decoded subject/from/body
$ref = new ReflectionClass($controller);
$parseMethod = $ref->getMethod('parseEmailContent');
$parseMethod->setAccessible(true);
$emailData = $parseMethod->invoke($controller, $content);

echo "\nParsed subject: " . ($emailData['subject'] ?? '') . "\n";
echo "Parsed from: " . ($emailData['from'] ?? '') . "\n\n";

// 3) Use detectTrack-like patterns (no DB) to check subject/from/body
$trackNamePatterns = [
    'De Voltage' => ['devoltage', 'de voltage'],
    'Experience Factory' => ['experience factory', 'experiencefactory'],
    'Goodwill Karting' => ['goodwill', 'goodwill karting'],
    'Circuit Park Berghem' => ['berghem', 'circuit park berghem', 'circuitparkberghem', 'circuitpark'],
    'Fastkart Elche' => ['fastkart', 'elche'],
    'Lot66' => ['lot66', 'lot 66'],
];

$subject = strtolower($emailData['subject'] ?? '');
$from = strtolower($emailData['from'] ?? '');
$body = strtolower($emailData['body'] ?? '');

$matched = false;
foreach ($trackNamePatterns as $trackName => $patterns) {
    foreach ($patterns as $pattern) {
        if (stripos($subject, $pattern) !== false || stripos($from, $pattern) !== false || stripos($body, $pattern) !== false) {
            echo "Parsed-body match: {$trackName} (pattern: {$pattern})\n";
            $matched = true;
            break 2;
        }
    }
}
if (!$matched) {
    echo "No match found in parsed email subject/from/body.\n";
}

// Print small snippet of body for inspection
echo "\nBody snippet:\n";
echo substr($emailData['body'] ?? '', 0, 500) . "\n";
