<?php

require __DIR__ . '/vendor/autoload.php';

$firstLine = 'Q van Wesel     max van lierop  Lars van den Hurk       Sandra Oude Alink       Rob Amesz       Wout Eurlings   Niek Oude Alink Maxim Schuttelaar       tim Van Mil     Dewi Oude Alink Evelyn Noveno';

$numColumns = 11;

// Split on 2+ spaces or tabs
$tempNames = preg_split('/\s{2,}|\t+/', $firstLine);
$tempNames = array_filter(array_map('trim', $tempNames));
$tempNames = array_values($tempNames);

echo 'After initial split: ' . count($tempNames) . " names\n";

foreach ($tempNames as $i => $name) {
    echo "  [$i] $name\n";
}
echo "\n";

if (count($tempNames) < $numColumns) {
    echo 'Need to split merged names (have ' . count($tempNames) . ", need $numColumns)\n\n";

    $driverNames = [];

    foreach ($tempNames as $chunk) {
        echo "Processing chunk: '$chunk'\n";
        $words = preg_split('/\s+/', $chunk);
        $currentName = '';
        $nameWordCount = 0;

        foreach ($words as $word) {
            $isConnector = in_array(strtolower($word), ['van', 'de', 'den', 'der', 'het', 'van den']);
            $isCapitalized = ! empty($word) && ctype_upper($word[0]);

            echo "  Word: '$word' | Cap: " . ($isCapitalized ? 'Y' : 'N') . ' | Conn: ' . ($isConnector ? 'Y' : 'N') . " | WordCount: $nameWordCount | DriverCount: " . count($driverNames) . "\n";

            if ($currentName === '') {
                $currentName = $word;
                $nameWordCount = 1;
                echo "    -> Start name: '$currentName'\n";
            } elseif ($isCapitalized && ! $isConnector && $nameWordCount >= 2 && count($driverNames) < $numColumns) {
                echo "    -> Split! Save '$currentName', start new with '$word'\n";
                $driverNames[] = trim($currentName);
                $currentName = $word;
                $nameWordCount = 1;
            } else {
                $currentName .= ' ' . $word;
                $nameWordCount++;
                echo "    -> Continue: '$currentName' (words: $nameWordCount)\n";
            }
        }

        if (! empty($currentName)) {
            echo "  -> Final name from chunk: '$currentName'\n";
            $driverNames[] = trim($currentName);
        }
        echo "\n";
    }

    echo 'Final driver names: ' . count($driverNames) . "\n";

    foreach ($driverNames as $i => $name) {
        echo "  [$i] $name\n";
    }
}
