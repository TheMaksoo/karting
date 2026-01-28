<?php

$filePath = __DIR__ . '/data-importer/eml-samples/De Voltage/Results - Karten Sessie 33.eml';

$content = file_get_contents($filePath);

// Find boundary
preg_match('/boundary[\s]*=[\s]*"([^"]+)"/', $content, $matches);
$boundary = $matches[1];

echo "Boundary: $boundary\n\n";

// Split by boundary
$parts = explode("--" . $boundary, $content);

echo "Found " . count($parts) . " parts\n\n";

foreach ($parts as $i => $part) {
    if (str_contains($part, 'text/html')) {
        echo "Part $i contains HTML\n";
        echo "Is base64: " . (str_contains($part, 'Content-Transfer-Encoding: base64') ? 'YES' : 'NO') . "\n";
        
        // Extract content after double newline
        if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
            $content = trim($contentMatch[1]);
            $content = preg_replace('/--$/s', '', $content);
            
            echo "Content length before decode: " . strlen($content) . "\n";
            
            $decoded = base64_decode($content);
            echo "Content length after decode: " . strlen($decoded) . "\n";
            
            // Check for lap times
            if (preg_match_all('/\d{2}\.\d{3}/', $decoded, $times)) {
                echo "Found " . count($times[0]) . " times\n";
                echo "First 5: " . implode(', ', array_slice($times[0], 0, 5)) . "\n";
            }
            
            // Save decoded HTML to file for inspection
            file_put_contents(__DIR__ . '/decoded.html', $decoded);
            echo "\n✓ Saved decoded HTML to decoded.html\n";
            
            break;
        }
    }
}
