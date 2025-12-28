<?php

$goodwillFile = __DIR__ . '/data-importer/eml-samples/Goodwill Karting/Fwd_ Goodwill Karting - Resultaten Sessie 7 Max.eml';
$content = file_get_contents($goodwillFile);

// Try to decode base64
if (preg_match('/Content-Transfer-Encoding:\s*base64\s+([\s\S]+?)(?:--_000_|$)/i', $content, $match)) {
    $decoded = base64_decode($match[1]);
    
    echo "=== GOODWILL DECODED CONTENT (first 2000 chars) ===\n";
    echo substr($decoded, 0, 2000) . "\n\n";
    
    // Check if we can find the table
    if (stripos($decoded, 'Sessie overzicht') !== false) {
        echo "✓ Found 'Sessie overzicht'\n";
    } else {
        echo "✗ Could not find 'Sessie overzicht'\n";
    }
    
    if (stripos($decoded, 'Rondetijden per piloot') !== false) {
        echo "✓ Found 'Rondetijden per piloot'\n";
    } else {
        echo "✗ Could not find 'Rondetijden per piloot'\n";
    }
} else {
    echo "✗ Could not match base64 pattern\n";
}

echo "\n\n=== EXPERIENCE FACTORY ===\n";
$expFile = __DIR__ . '/data-importer/eml-samples/Experience Factory Antwerp/Experience Factory Antwerp Max.eml';
$content2 = file_get_contents($expFile);

if (preg_match('/Content-Transfer-Encoding:\s*base64\s+([\s\S]+?)(?:--_000_|$)/i', $content2, $match2)) {
    $decoded2 = base64_decode($match2[1]);
    
    echo "=== EXPERIENCE FACTORY DECODED CONTENT (first 2000 chars) ===\n";
    echo substr($decoded2, 0, 2000) . "\n\n";
    
    // Check patterns
    if (preg_match('/Rnk\s+Kart\s+Driver/i', $decoded2)) {
        echo "✓ Found results table header\n";
    } else {
        echo "✗ Could not find results table header\n";
    }
    
    if (stripos($decoded2, 'Your lap times') !== false) {
        echo "✓ Found 'Your lap times'\n";
    } else {
        echo "✗ Could not find 'Your lap times'\n";
    }
} else {
    echo "✗ Could not match base64 pattern\n";
}
