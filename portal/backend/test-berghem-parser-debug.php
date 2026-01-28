<?php

require __DIR__ . '/vendor/autoload.php';

$parser = new App\Services\EmlParser();
$file = 'C:\laragon\www\karting\data-importer\eml-samples\Circuit Park Berghem\Results - 10 - Heat.eml';

// Read file content
$html = file_get_contents($file);

// Decode base64 if present
$content = $html;

if (preg_match('/Content-Transfer-Encoding:\s*base64\s+([\s\S]+?)(?:--_000_|$)/i', $html, $match)) {
    $decoded = base64_decode($match[1]);

    if ($decoded) {
        $content = $decoded;
        echo "✓ Base64 decoded successfully\n\n";
    }
}

// Look for "Jouw Rondetijden" section
if (preg_match('/Jouw Rondetijden\s+(.*?)(?:Avg\.|Hist\.|Gem\.|Ben jij|$)/is', $content, $lapSection)) {
    echo "✓ Found 'Jouw Rondetijden' section\n\n";

    $lapData = $lapSection[1];
    $lines = array_filter(array_map('trim', explode("\n", $lapData)));

    echo 'Total lines in section: ' . count($lines) . "\n\n";
    echo "First 5 lines:\n";

    foreach (array_slice($lines, 0, 5) as $i => $line) {
        echo 'Line ' . ($i + 1) . ': ' . substr($line, 0, 100) . "\n";
    }
    echo "\n";

    // First line should contain driver names
    $firstLine = array_shift($lines);
    echo 'First line (driver names): ' . substr($firstLine, 0, 200) . "\n\n";

    // Split on multiple spaces
    $driverNames = preg_split('/\s{2,}/', $firstLine);
    $driverNames = array_filter(array_map('trim', $driverNames));

    echo 'Extracted driver names: ' . implode(', ', $driverNames) . "\n";
    echo 'Total drivers: ' . count($driverNames) . "\n\n";

    // Parse first lap row
    echo "Analyzing lap rows:\n";

    foreach (array_slice($lines, 0, 3) as $i => $line) {
        echo "\nLap row " . ($i + 1) . ': ' . $line . "\n";

        if (preg_match('/^(\d+)\s+(.+)$/', $line, $match)) {
            $lapNumber = (int) $match[1];
            $timesString = $match[2];
            echo "  Lap number: $lapNumber\n";
            echo '  Times string: ' . substr($timesString, 0, 150) . "\n";

            preg_match_all('/(\d+:\d+\.\d+)/', $timesString, $timeMatches);
            echo '  Found ' . count($timeMatches[1]) . ' lap times: ' . implode(', ', $timeMatches[1]) . "\n";
        } else {
            echo "  ✗ Does not match lap row pattern\n";
        }
    }
} else {
    echo "✗ Could not find 'Jouw Rondetijden' section\n";

    // Search for any occurrence
    if (stripos($content, 'Jouw') !== false) {
        echo "  (But 'Jouw' appears in the content)\n";

        // Find surrounding text
        $pos = stripos($content, 'Jouw');
        $contextStart = max(0, $pos - 50);
        $contextEnd = min(strlen($content), $pos + 200);
        echo '  Context: ' . substr($content, $contextStart, $contextEnd - $contextStart) . "\n";
    }
}
