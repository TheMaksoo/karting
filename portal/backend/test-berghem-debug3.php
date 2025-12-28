<?php

require __DIR__ . '/vendor/autoload.php';

// Read file
$file = 'C:\laragon\www\karting\data-importer\eml-samples\Circuit Park Berghem\Results - 10 - Heat.eml';
$html = file_get_contents($file);

// Decode base64
$content = $html;
if (preg_match('/Content-Transfer-Encoding:\s*base64\s+([\s\S]+?)(?:--_000_|$)/i', $html, $match)) {
    $decoded = base64_decode($match[1]);
    if ($decoded) {
        $content = $decoded;
    }
}

// Find section
if (preg_match('/Jouw Rondetijden\s+(.*?)(?:Avg\.|Hist\.|Gem\.|Ben jij|$)/is', $content, $lapSection)) {
    $lapData = $lapSection[1];
    $lines = array_filter(array_map('trim', explode("\n", $lapData)));
    
    $firstLine = $lines[0];
    echo "Header line length: " . strlen($firstLine) . "\n";
    echo "Header line:\n$firstLine\n\n";
    
    // Find first lap row
    $lapRow = null;
    foreach ($lines as $line) {
        if (preg_match('/^1\s+(.+)$/', $line, $match)) {
            $lapRow = $match[1];
            break;
        }
    }
    
    echo "Lap row 1 length: " . strlen($lapRow) . "\n";
    echo "Lap row 1:\n$lapRow\n\n";
    
    // Find time positions
    preg_match_all('/(\d+:\d+\.\d+)/', $lapRow, $timeMatches, PREG_OFFSET_CAPTURE);
    
    echo "Found " . count($timeMatches[0]) . " lap times:\n";
    foreach ($timeMatches[0] as $i => $tm) {
        $time = $tm[0];
        $pos = $tm[1];
        
        // Find corresponding name section in header
        $nextPos = ($i < count($timeMatches[0]) - 1) ? $timeMatches[0][$i+1][1] : strlen($lapRow);
        $prevPos = ($i > 0) ? $timeMatches[0][$i-1][1] + strlen($timeMatches[0][$i-1][0]) : 0;
        
        $nameEnd = $pos;
        $nameStart = $prevPos;
        
        $nameChunk = substr($firstLine, $nameStart, $nameEnd - $nameStart);
        $nameChunk = trim($nameChunk);
        
        echo sprintf("  Column %2d: pos %4d, time %-10s -> name: '%s'\n", $i+1, $pos, $time, $nameChunk);
    }
}
