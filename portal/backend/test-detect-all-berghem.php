<?php

require __DIR__ . '/vendor/autoload.php';

$dir = 'C:\\\\laragon\\\\www\\\\karting\\\\data-importer\\\\eml-samples\\\\Circuit Park Berghem';
$files = glob($dir . '/*.eml');

if (! $files) {
    echo "No .eml files found in {$dir}\n";
    exit(1);
}

foreach ($files as $file) {
    $name = basename($file);
    $content = file_get_contents($file);
    $rawSearch = strtolower($name . ' ' . substr($content, 0, 20000));

    $patterns = ['berghem', 'circuit park', 'circuitpark', 'circuitpark berghem', 'circuit park berghem'];
    $foundRaw = false;

    foreach ($patterns as $p) {
        if (stripos($rawSearch, $p) !== false) {
            $foundRaw = true;
            break;
        }
    }

    // Parse email body
    $controller = new ReflectionClass('App\\Http\\Controllers\\API\\EmlUploadController');
    $instance = $controller->newInstanceWithoutConstructor();
    $parseMethod = $controller->getMethod('parseEmailContent');
    $parseMethod->setAccessible(true);
    $emailData = $parseMethod->invoke($instance, $content);

    $bodyLower = strtolower($emailData['body'] ?? '');
    $subjectLower = strtolower($emailData['subject'] ?? '');
    $fromLower = strtolower($emailData['from'] ?? '');

    $additionalMarkers = ['smstiming', 'circuitparkberghem', 'circuitpark berghem', 'race overzicht', 'jouw rondetijden'];
    $foundParsed = false;

    foreach ($additionalMarkers as $m) {
        if (stripos($bodyLower, $m) !== false || stripos($subjectLower, $m) !== false || stripos($fromLower, $m) !== false) {
            $foundParsed = true;
            break;
        }
    }

    echo "File: {$name}\n";
    echo '  Heuristic (raw) match: ' . ($foundRaw ? 'YES' : 'NO') . "\n";
    echo '  Parsed-body match: ' . ($foundParsed ? 'YES' : 'NO') . "\n";
    echo "\n";
}
