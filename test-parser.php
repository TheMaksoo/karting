<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\EmlParser;

// Test parsing one De Voltage file
$filePath = __DIR__ . '/data-importer/eml-samples/De Voltage/Results - Karten Sessie 33.eml';

echo "Testing EML parser with: " . basename($filePath) . "\n\n";

$parser = new EmlParser();

try {
    echo "Parsing file...\n";
    $result = $parser->parse($filePath, 2); // De Voltage = track ID 2
    
    echo "Parse successful!\n\n";
    echo "Session Info:\n";
    print_r($result['session_info']);
    
    echo "\nLaps found: " . count($result['laps']) . "\n\n";
    
    if (!empty($result['laps'])) {
        echo "First 5 laps:\n";
        foreach (array_slice($result['laps'], 0, 5) as $lap) {
            print_r($lap);
        }
    } else {
        echo "NO LAPS FOUND!\n\n";
        echo "Checking HTML content extraction...\n";
        
        // Let's manually check what's being extracted
        $content = file_get_contents($filePath);
        echo "File size: " . strlen($content) . " bytes\n";
        
        // Check if HTML is in there
        if (str_contains($content, 'text/html')) {
            echo "✓ Contains HTML\n";
        }
        
        if (str_contains($content, 'base64')) {
            echo "✓ Contains base64 encoding\n";
        }
        
        // Try to manually decode base64 section
        if (preg_match('/Content-Type: text\/html.*?Content-Transfer-Encoding: base64.*?\n\n(.*?)\n\n--/s', $content, $matches)) {
            echo "✓ Found base64 HTML section\n";
            $decoded = base64_decode($matches[1]);
            echo "Decoded length: " . strlen($decoded) . " bytes\n";
            
            // Check for lap times in decoded content
            if (preg_match_all('/\d{2}\.\d{3}/', $decoded, $times)) {
                echo "Found " . count($times[0]) . " time values: " . implode(', ', array_slice($times[0], 0, 5)) . "...\n";
            }
            
            // Check for driver names
            if (preg_match('/Laszlo van Melis/', $decoded)) {
                echo "✓ Found driver name 'Laszlo van Melis'\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
