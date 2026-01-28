<?php

require __DIR__ . '/portal/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/portal/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$filePath = __DIR__ . '/data-importer/eml-samples/De Voltage/Results - Karten Sessie 33.eml';

if (!file_exists($filePath)) {
    echo "Error: File not found: $filePath\n";
    exit(1);
}

$content = file_get_contents($filePath);

// Parse the EML structure
$headers = [];
$body = '';

// Split headers and body
$parts = preg_split('/\r?\n\r?\n/', $content, 2);

if (count($parts) === 2) {
    $headerLines = explode("\n", $parts[0]);
    $body = $parts[1];
    
    foreach ($headerLines as $line) {
        if (preg_match('/^([^:]+):\s*(.+)$/', $line, $matches)) {
            $headers[strtolower($matches[1])] = trim($matches[2]);
        }
    }
}

echo "Headers found:\n";
foreach ($headers as $key => $value) {
    if (str_contains($key, 'content')) {
        echo "  $key: " . substr($value, 0, 100) . "\n";
    }
}

echo "\nBody length: " . strlen($body) . "\n";
echo "\nIs multipart: " . (str_contains($headers['content-type'] ?? '', 'multipart') ? 'YES' : 'NO') . "\n";

// Now try extracting
if (str_contains($headers['content-type'] ?? '', 'multipart')) {
    echo "\nExtracting from multipart...\n";
    
    if (preg_match('/boundary[\s]*=[\s]*"([^"]+)"/', $body, $matches) ||
        preg_match('/boundary[\s]*=[\s]*([^\s;]+)/', $body, $matches)) {
        $boundary = $matches[1];
        echo "Boundary: $boundary\n";
        
        $parts = explode("--" . $boundary, $body);
        echo "Parts: " . count($parts) . "\n";
        
        foreach ($parts as $i => $part) {
            if (str_contains($part, 'text/html')) {
                echo "\nPart $i is HTML\n";
                echo "Length: " . strlen($part) . "\n";
                
                if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                    $extracted = trim($contentMatch[1]);
                    $extracted = preg_replace('/--$/s', '', $extracted);
                    echo "Extracted length: " . strlen($extracted) . "\n";
                    
                    if (str_contains($part, 'Content-Transfer-Encoding: base64')) {
                        $decoded = base64_decode($extracted);
                        echo "Decoded length: " . strlen($decoded) . "\n";
                        
                        // Check for lap data
                        if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $decoded, $cells)) {
                            echo "Found " . count($cells[0]) . " table cells\n";
                        }
                    }
                }
            }
        }
    }
}
