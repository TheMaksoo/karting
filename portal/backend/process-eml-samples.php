<?php
require __DIR__ . '/vendor/autoload.php';

use App\Services\EmlParser;

$base = 'C:\\\\laragon\\\\www\\\\karting\\\\data-importer\\\\eml-samples';
if (!is_dir($base)) {
    echo "Samples folder not found: $base\n";
    exit(1);
}

$parser = new EmlParser();

$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
$files = [];
foreach ($rii as $file) {
    if ($file->isDir()) continue;
    if (strtolower($file->getExtension()) === 'eml' || strtolower($file->getExtension()) === 'txt') {
        $files[] = $file->getPathname();
    }
}

if (empty($files)) {
    echo "No EML/TXT samples found under $base\n";
    exit(0);
}

foreach ($files as $f) {
    echo "Processing: $f\n";

    // Attempt to detect track using controller logic but avoid DB (use controller's method via reflection)
    $controllerRef = new ReflectionClass('App\\Http\\Controllers\\API\\EmlUploadController');
    $inst = $controllerRef->newInstanceWithoutConstructor();
    $detectMethod = $controllerRef->getMethod('detectTrackFromFile');
    $detectMethod->setAccessible(true);

    $content = file_get_contents($f);
    $fileName = basename($f);

    try {
        $track = $detectMethod->invoke($inst, $fileName, $content);
        if (is_object($track)) {
            $trackId = $track->id ?? null;
            $trackName = $track->name ?? 'Unknown';
        } else {
            $trackId = null;
            $trackName = 'Unknown';
        }
    } catch (\Exception $e) {
        $trackId = null;
        $trackName = 'Unknown';
    }

    if (!$trackId) {
        echo "  Could not detect track, skipping parse.\n\n";
        continue;
    }

    try {
        $res = $parser->parse($f, (int)$trackId);
        $count = count($res['laps'] ?? []);
        echo "  Detected track: {$trackName} (id={$trackId}), laps parsed: {$count}\n\n";
    } catch (\Exception $e) {
        echo "  Parse failed: " . $e->getMessage() . "\n\n";
    }
}
