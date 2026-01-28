<?php

require __DIR__ . '/vendor/autoload.php';

$parser = new App\Services\EmlParser();
$file = 'C:\laragon\www\karting\data-importer\eml-samples\Circuit Park Berghem\Results - 10 - Heat.eml';

echo "Comparing parse paths:\n";
echo "======================\n\n";

// Method 1: Through parse() (the broken way)
echo "Method 1: parser->parse() (used by web upload)\n";
$result1 = $parser->parse($file, 4);
echo 'Total laps: ' . count($result1['laps']) . "\n\n";

// Method 2: Direct call (the working way  via reflection)
echo "Method 2: Direct parseCircuitParkBerghemFormat() call\n";
$content = file_get_contents($file);
$reflection = new ReflectionClass($parser);
$method = $reflection->getMethod('parseCircuitParkBerghemFormat');
$method->setAccessible(true);
$result2 = $method->invoke($parser, $content);
echo 'Total laps: ' . count($result2['laps']) . "\n\n";

echo "The difference: Method 1 extracts HTML first, Method 2 uses raw content.\n";
echo "Method 1 is failing because extractHtmlBody() is removing the base64 content!\n";
