<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser as PdfParser;

class EmlParser
{
    /**
     * Parse an EML file and extract lap data
     *
     * @param  string  $filePath  Path to the EML file
     * @param  int  $trackId  Track ID for context-specific parsing
     *
     * @throws Exception
     *
     * @return array Parsed lap data
     */
    public function parse(string $filePath, int $trackId): array
    {
        if (! file_exists($filePath)) {
            throw new Exception("EML file not found: {$filePath}");
        }

        $content = file_get_contents($filePath);

        // Parse the EML structure
        $parsed = $this->parseEmlStructure($content);

        // Extract HTML body (if any) and plain text body
        $html = $this->extractHtmlBody($parsed, $content);
        $plainBody = $parsed['body'] ?? '';

        // Build a full content blob containing plain text body, HTML body and original raw content
        // This ensures track-specific parsers (like Berghem) can find lap tables whether they are
        // in the HTML part or embedded base64/plain sections.
        $fullContent = trim(implode("\n\n", array_filter([$plainBody, $html, $content])));

        // Parse lap data based on track format using the full content
        return $this->parseTrackSpecificFormat($fullContent, $trackId);
    }

    /**
     * Parse a plain text file with lap data
     *
     * @param  string  $filePath  Path to the text file
     * @param  int  $trackId  Track ID for context-specific parsing
     *
     * @return array Parsed lap data
     */
    public function parseTextFile(string $filePath, int $trackId): array
    {
        $content = file_get_contents($filePath);

        return $this->parseTrackSpecificFormat($content, $trackId);
    }

    /**
     * Parse a PDF file and extract lap data
     *
     * Note: This is a placeholder implementation.
     * For production use, you would need a PDF parsing library like smalot/pdfparser
     * Install: composer require smalot/pdfparser
     *
     * @param  string  $filePath  Path to the PDF file
     * @param  int  $trackId  Track ID for context-specific parsing
     *
     * @throws Exception
     *
     * @return array Parsed lap data
     */
    public function parsePdfFile(string $filePath, int $trackId): array
    {
        if (! file_exists($filePath)) {
            throw new Exception("PDF file not found: {$filePath}");
        }

        try {
            // Use smalot/pdfparser library for robust PDF text extraction
            $parser = new PdfParser();
            $pdf = $parser->parseFile($filePath);
            $text = $pdf->getText();

            // If we couldn't extract text, throw an exception
            if (empty(trim($text))) {
                throw new Exception('Could not extract text from PDF.');
            }

            // Parse the extracted text using track-specific format
            return $this->parseTrackSpecificFormat($text, $trackId);

        } catch (Exception $e) {
            Log::error('PDF parsing failed: ' . $e->getMessage());

            throw new Exception('PDF parsing failed: ' . $e->getMessage());
        }
    }

    /**
     * Parse EML file structure
     */
    private function parseEmlStructure(string $content): array
    {
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

        return [
            'headers' => $headers,
            'body' => $body,
        ];
    }

    /**
     * Extract HTML body from parsed EML
     */
    private function extractHtmlBody(array $parsed, string $fullContent): ?string
    {
        $body = $parsed['body'];

        // Check for quoted-printable encoding
        if (isset($parsed['headers']['content-transfer-encoding']) &&
            str_contains($parsed['headers']['content-transfer-encoding'], 'quoted-printable')) {
            $body = quoted_printable_decode($body);
        }

        // Check for base64 encoding
        if (isset($parsed['headers']['content-transfer-encoding']) &&
            str_contains($parsed['headers']['content-transfer-encoding'], 'base64')) {
            $body = base64_decode($body);
        }

        // Extract HTML from multipart if needed - pass full content to find boundary
        if (isset($parsed['headers']['content-type']) &&
            str_contains($parsed['headers']['content-type'], 'multipart')) {
            $body = $this->extractFromMultipart($fullContent);
        }

        return $body;
    }

    /**
     * Extract HTML from multipart MIME
     */
    private function extractFromMultipart(string $body): string
    {
        // Find boundary - look in the whole content (headers + body)
        if (preg_match('/boundary[\s]*=[\s]*"([^"]+)"/', $body, $matches) ||
            preg_match('/boundary[\s]*=[\s]*([^\s;"\r\n]+)/', $body, $matches)) {
            $boundary = $matches[1];

            // Split by boundary
            $parts = explode('--' . $boundary, $body);

            foreach ($parts as $part) {
                // Look for HTML content
                if (str_contains($part, 'text/html')) {
                    // Check encoding
                    $isBase64 = str_contains($part, 'Content-Transfer-Encoding: base64');
                    $isQP = str_contains($part, 'quoted-printable');

                    // Extract content after double newline (end of headers)
                    if (preg_match('/\r?\n\r?\n(.+)/s', $part, $contentMatch)) {
                        $content = trim($contentMatch[1]);

                        // Remove trailing boundary markers
                        $content = preg_replace('/--$/s', '', $content);

                        // Decode based on encoding
                        if ($isBase64) {
                            $content = base64_decode($content);
                        } elseif ($isQP) {
                            $content = quoted_printable_decode($content);
                        }

                        if (strlen($content) > 100) {
                            return $content;
                        }
                    }
                }
            }
        }

        return $body;
    }

    /**
     * Parse lap data based on track-specific format
     */
    private function parseTrackSpecificFormat(string $html, int $trackId): array
    {
        // Try track-specific parsers first
        $result = match ($trackId) {
            2 => $this->parseDeVoltageFormat($html), // De Voltage
            3 => $this->parseExperienceFactoryFormat($html), // Experience Factory Antwerp
            5 => $this->parseGoodwillKartingFormat($html), // Goodwill Karting
            4 => $this->parseCircuitParkBerghemFormat($html), // Circuit Park Berghem
            1 => $this->parseSpanishFormat($html), // Fastkart Elche
            6 => $this->parseLot66Format($html), // Lot66
            7 => $this->parseSpanishFormat($html), // Racing Center Gilesias (uses Spanish format)
            default => ['session_info' => [], 'laps' => []]
        };

        // If track-specific parser failed, try universal parser as fallback
        if (empty($result['laps'])) {
            $result = $this->parseUniversalFormat($html);
        }

        return $result;
    }

    /**
     * Universal parser that extracts lap data from ANY format
     * Looks for driver names and lap times in any structure
     */
    private function parseUniversalFormat(string $content): array
    {
        $laps = [];
        $sessionInfo = [];

        // Try to extract date (various formats)
        if (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $content, $match)) {
            $sessionInfo['date'] = $match[0];
        } elseif (preg_match('/(\d{2})\.(\d{2})\.(\d{4})/', $content, $match)) {
            $date = \DateTime::createFromFormat('d.m.Y', $match[0]);
            $sessionInfo['date'] = $date->format('Y-m-d');
        } elseif (preg_match('/(\d{2})\/(\d{2})\/(\d{4})/', $content, $match)) {
            $date = \DateTime::createFromFormat('d/m/Y', $match[0]);
            $sessionInfo['date'] = $date->format('Y-m-d');
        }

        // FIRST: Try to parse detailed lap times table (each driver gets multiple laps)
        $detailedLaps = $this->parseDetailedLapTable($content);

        if (! empty($detailedLaps)) {
            return [
                'session_info' => $sessionInfo,
                'laps' => $detailedLaps,
            ];
        }

        // METHOD 1: Look for HTML tables with lap data
        if (preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $content, $rows)) {
            $foundInTable = false;

            foreach ($rows[1] as $row) {
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $row, $cells)) {
                    $data = array_map('strip_tags', $cells[1]);
                    $data = array_map('trim', $data);
                    $data = array_filter($data); // Remove empty

                    if (count($data) < 2) {
                        continue;
                    }

                    // Look for position number, name, and time pattern
                    $position = null;
                    $driverName = null;
                    $lapTime = null;
                    $kartNumber = null;

                    foreach ($data as $index => $value) {
                        // Check if it's a position (small number at start)
                        if ($index === 0 && is_numeric($value) && $value < 100) {
                            $position = (int) $value;
                        }

                        // Check if it's a lap time (MM:SS.mmm or SS.mmm format)
                        if (preg_match('/^\d{1,2}:\d{2}\.\d{2,3}$/', $value) ||
                            preg_match('/^\d{2}\.\d{2,3}$/', $value) ||
                            preg_match('/^\d{2}\.\d{1,3}$/', $value)) {
                            $lapTime = $this->convertLapTimeToSeconds($value);
                        }

                        // Check if it's a kart number (usually small int)
                        if (is_numeric($value) && $value > 0 && $value < 200 && ! $position) {
                            $kartNumber = $value;
                        }

                        // Likely a driver name (has letters, not a time)
                        if (preg_match('/[a-zA-Z]{3,}/', $value) &&
                            ! preg_match('/^\d+[:\.]\d+/', $value) &&
                            ! str_contains(strtolower($value), 'pos') &&
                            ! str_contains(strtolower($value), 'name') &&
                            ! str_contains(strtolower($value), 'best') &&
                            ! str_contains(strtolower($value), 'lap')) {
                            $driverName = $value;
                        }
                    }

                    // If we found a name and a time, it's a lap!
                    if ($driverName && $lapTime > 0) {
                        $laps[] = [
                            'driver_name' => $driverName,
                            'lap_number' => 1, // Default to 1 for best lap
                            'lap_time' => $lapTime,
                            'position' => $position,
                            'kart_number' => $kartNumber,
                        ];
                        $foundInTable = true;
                    }
                }
            }

            if ($foundInTable) {
                return [
                    'session_info' => $sessionInfo,
                    'laps' => $laps,
                ];
            }
        }

        // METHOD 2: Parse plain text line by line
        $lines = preg_split('/\r?\n/', $content);

        // Extract driver name from header (e.g., "Max van lierop")
        $driverName = null;

        foreach (array_slice($lines, 0, 10) as $line) {
            $line = trim($line);

            // Look for name-like patterns (not dates, not "Lap", not empty)
            if (! empty($line) &&
                ! preg_match('/\d{2}\.\d{2}\.\d{4}/', $line) &&
                ! str_contains($line, 'Lot66') &&
                ! str_contains($line, 'At ') &&
                ! str_contains($line, 'Lap') &&
                ! str_contains($line, 'S1') &&
                ! str_contains($line, 'Time') &&
                preg_match('/^[a-zA-Z\s]{3,}$/', $line)) {
                $driverName = $line;
                break;
            }
        }

        // Special handling for Lot66 format: lap number and time on separate lines
        $i = 0;

        while ($i < count($lines)) {
            $line = trim($lines[$i]);

            // Look for lap number (just a digit)
            if (is_numeric($line) && $line > 0 && $line < 100) {
                $lapNumber = (int) $line;

                // Next few lines should have "Lap X", sector times, then lap time
                // Skip forward to find the time (format: MM:SS.mmm or SS.mmm)
                for ($j = $i + 1; $j < min($i + 6, count($lines)); $j++) {
                    $timeLine = trim($lines[$j]);

                    if (preg_match('/^(\d{1,2}:\d{2}\.\d{3}|\d{2}\.\d{3})$/', $timeLine)) {
                        $lapTime = $this->convertLapTimeToSeconds($timeLine);

                        if ($lapTime > 0) {
                            $laps[] = [
                                'driver_name' => $driverName ?? 'Unknown',
                                'lap_number' => $lapNumber,
                                'lap_time' => $lapTime,
                                'position' => null,
                                'kart_number' => null,
                            ];
                        }
                        $i = $j;
                        break;
                    }
                }
            }
            $i++;
        }

        // If we found laps from the special format, return them
        if (! empty($laps)) {
            return [
                'session_info' => $sessionInfo,
                'laps' => $laps,
            ];
        }

        // Check for Spanish format (Fastkart Elche)
        if (str_contains($content, 'RESULTADOS DETALLADOS') || str_contains($content, 'Mejor V.')) {
            return $this->parseSpanishFormat($content);
        }

        // Otherwise try standard parsing
        foreach ($lines as $line) {
            $line = trim($line);

            // Skip empty lines and headers
            if (empty($line) ||
                strlen($line) < 5 ||
                str_contains(strtolower($line), 'session') ||
                str_contains(strtolower($line), 'result') ||
                str_contains(strtolower($line), 'thank you')) {
                continue;
            }

            // Look for lines with lap data
            // Format: "5  Lap 5  -  -  -  00:33.185"
            if (preg_match('/^(\d+)\s+Lap\s+\d+.*?(\d{2}:\d{2}\.\d{3})/', $line, $matches)) {
                $lapNumber = (int) $matches[1];
                $lapTime = $this->convertLapTimeToSeconds($matches[2]);

                if ($lapTime > 0) {
                    $laps[] = [
                        'driver_name' => $driverName ?? 'Unknown',
                        'lap_number' => $lapNumber,
                        'lap_time' => $lapTime,
                        'position' => null,
                        'kart_number' => null,
                    ];
                }
                continue;
            }

            // Look for lines with: number, name, time pattern
            // Examples:
            // "1.      Laszlo van Melis        39.761"
            // "Max van Lierop  44.356"
            // "9.      Max van Lierop  44.356"

            // Try to find lap time in this line
            if (preg_match('/(\d{1,2}:\d{2}\.\d{2,3}|\d{2}\.\d{2,3})/', $line, $timeMatch)) {
                $lapTime = $this->convertLapTimeToSeconds($timeMatch[1]);

                // Extract everything before the time as potential name
                $beforeTime = substr($line, 0, strpos($line, $timeMatch[1]));

                // Clean up: remove position numbers and extra spaces
                $driverName = preg_replace('/^\d+\.\s*/', '', $beforeTime);
                $driverName = trim($driverName);

                // Must have at least 3 characters
                if (strlen($driverName) >= 3 && $lapTime > 0) {
                    // Try to extract position
                    $position = null;

                    if (preg_match('/^(\d+)\./', $line, $posMatch)) {
                        $position = (int) $posMatch[1];
                    }

                    $laps[] = [
                        'driver_name' => $driverName,
                        'lap_time' => $lapTime,
                        'position' => $position,
                        'kart_number' => null,
                    ];
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Parse detailed lap table where each driver has multiple laps
     * Format: First row has driver names, subsequent rows have lap numbers and times
     */
    private function parseDetailedLapTable(string $content): array
    {
        $allLaps = [];

        // Look for "Detailed results" section
        if (! preg_match('/Detailed\s+results/i', $content)) {
            return [];
        }

        // Find all table rows after "Detailed results"
        $detailedSection = substr($content, stripos($content, 'Detailed'));

        if (! preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $detailedSection, $rows)) {
            return [];
        }

        $driverNames = [];
        $driverPositions = [];

        // Process rows
        foreach ($rows[1] as $rowIndex => $row) {
            if (preg_match_all('/<t[hd][^>]*>(.*?)<\/t[hd]>/is', $row, $cells)) {
                $cellData = array_map('strip_tags', $cells[1]);
                $cellData = array_map('trim', $cellData);
                $cellData = array_filter($cellData, fn ($v) => $v !== '&nbsp;' && $v !== '');
                $cellData = array_values($cellData);

                // First data row contains driver names
                if (empty($driverNames) && count($cellData) > 2) {
                    // Check if this row has driver names (has letters, not just numbers)
                    $hasNames = false;

                    foreach ($cellData as $cell) {
                        if (preg_match('/[a-zA-Z]{3,}/', $cell) && ! preg_match('/^\d+[:\.]\d+/', $cell)) {
                            $hasNames = true;
                            break;
                        }
                    }

                    if ($hasNames) {
                        // Skip first cell (empty header)
                        $driverNames = array_slice($cellData, 1);
                        continue;
                    }
                }

                // If we have driver names, parse lap data rows
                if (! empty($driverNames) && count($cellData) > 1) {
                    $lapNumber = null;

                    // First cell should be lap number
                    if (is_numeric($cellData[0]) && $cellData[0] > 0 && $cellData[0] < 100) {
                        $lapNumber = (int) $cellData[0];

                        // Remaining cells are lap times for each driver
                        $lapTimes = array_slice($cellData, 1);

                        foreach ($lapTimes as $driverIndex => $lapTimeStr) {
                            if (! isset($driverNames[$driverIndex])) {
                                continue;
                            }

                            if (empty($lapTimeStr)) {
                                continue;
                            }

                            // Convert lap time to seconds
                            $lapTime = $this->convertLapTimeToSeconds($lapTimeStr);

                            if ($lapTime > 0) {
                                // Track driver position if not set
                                if (! isset($driverPositions[$driverIndex])) {
                                    $driverPositions[$driverIndex] = count($driverPositions) + 1;
                                }

                                $allLaps[] = [
                                    'driver_name' => $driverNames[$driverIndex],
                                    'lap_number' => $lapNumber,
                                    'lap_time' => $lapTime,
                                    'position' => $driverPositions[$driverIndex],
                                    'kart_number' => null,
                                ];
                            }
                        }
                    }
                }
            }
        }

        return $allLaps;
    }

    /**
     * Parse De Voltage format
     * Format: "Detailed results" table with driver names in headers and lap times in rows
     * Fallback: "Heat overview" table with columns: Pos, Name, Best Score (3 columns)
     */
    private function parseDeVoltageFormat(string $html): array
    {
        $sessionInfo = [];

        // Extract session date from email Date: header (RFC 2822 format)
        // Format: "Date: Sat, 19 Jul 2025 13:39:13 +0000"
        if (preg_match('/Date:\s*\w+,\s*(\d+)\s+(\w+)\s+(\d{4})/i', $html, $dateMatch)) {
            $months = [
                'Jan' => '01', 'Feb' => '02', 'Mar' => '03', 'Apr' => '04',
                'May' => '05', 'Jun' => '06', 'Jul' => '07', 'Aug' => '08',
                'Sep' => '09', 'Oct' => '10', 'Nov' => '11', 'Dec' => '12',
            ];
            $month = $months[$dateMatch[2]] ?? '01';
            $sessionInfo['date'] = $dateMatch[3] . '-' . $month . '-' . sprintf('%02d', $dateMatch[1]);
        } elseif (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $html, $dateMatch)) {
            // Fallback: Only accept dates in reasonable year range (2000-2100)
            $year = (int) $dateMatch[1];

            if ($year >= 2000 && $year <= 2100) {
                $sessionInfo['date'] = $dateMatch[0];
            }
        }

        // Extract session number
        if (preg_match('/Sessie\s+(\d+)/i', $html, $sessionMatch)) {
            $sessionInfo['session_number'] = $sessionMatch[1];
        }

        // First try the detailed lap table (has all individual laps per driver)
        $detailedLaps = $this->parseDetailedLapTable($html);

        if (! empty($detailedLaps)) {
            return [
                'session_info' => $sessionInfo,
                'laps' => $detailedLaps,
            ];
        }

        // Fallback: Parse "Heat overview" table (3 columns: Pos, Name, Best Score)
        $laps = [];

        if (preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $html, $rows)) {
            foreach ($rows[1] as $row) {
                // Extract cells
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $row, $cells)) {
                    $data = array_map('strip_tags', $cells[1]);
                    $data = array_map('trim', $data);

                    // Heat overview table has 3 columns: Pos (like "1."), Name, Best Score
                    if (count($data) >= 3 && ! str_contains(strtolower($data[0]), 'pos')) {
                        // Extract position (remove trailing dot like "1." -> 1)
                        $position = (int) preg_replace('/\D/', '', $data[0]);
                        $driverName = $data[1] ?? '';
                        $bestLap = $data[2] ?? '';

                        // Validate: driver name should have letters, best lap should be numeric
                        if ($driverName && preg_match('/[a-zA-Z]/', $driverName) && preg_match('/^\d+[\.:]\d+/', $bestLap)) {
                            $lapTime = $this->convertLapTimeToSeconds($bestLap);

                            if ($lapTime > 0) {
                                $laps[] = [
                                    'driver_name' => $driverName,
                                    'kart_number' => null,
                                    'position' => $position,
                                    'lap_number' => 1, // Best lap as lap 1
                                    'lap_time' => $lapTime,
                                ];
                            }
                        }
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Parse Lot66 format
     */
    private function parseLot66Format(string $html): array
    {
        $laps = [];
        $sessionInfo = [];

        // Extract date and time
        if (preg_match('/(\d{2}\.\d{2}\.\d{4})\s+At\s+(\d{2}:\d{2})/i', $html, $dateMatch)) {
            $date = \DateTime::createFromFormat('d.m.Y H:i', $dateMatch[1] . ' ' . $dateMatch[2]);
            $sessionInfo['date'] = $date->format('Y-m-d');
            $sessionInfo['time'] = $date->format('H:i:s');
        }

        // Parse lap times table
        if (preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $html, $rows)) {
            foreach ($rows[1] as $row) {
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $row, $cells)) {
                    $data = array_map('strip_tags', $cells[1]);
                    $data = array_map('trim', $data);

                    if (count($data) >= 3 && is_numeric($data[0])) {
                        $laps[] = [
                            'driver_name' => $data[1] ?? 'Unknown',
                            'lap_number' => 1, // Best lap as lap 1
                            'lap_time' => $this->convertLapTimeToSeconds($data[2] ?? '0:00.000'),
                            'position' => (int) $data[0],
                        ];
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Parse Circuit Park Berghem format
     * Format: Plain text email with:
     * 1. "Race overzicht  Beste tijden" - Overall results with best times
     * 2. "Jouw Rondetijden" - Individual lap times table for each driver
     * The table has driver names as column headers followed by their lap times
     */
    private function parseCircuitParkBerghemFormat(string $html): array
    {
        $laps = [];
        $sessionInfo = [];

        // Decode base64 content if present
        $content = $html;

        if (preg_match('/Content-Transfer-Encoding:\s*base64\s+([\s\S]+?)(?:--_000_|$)/i', $html, $match)) {
            $decoded = base64_decode($match[1]);

            if ($decoded) {
                $content = $decoded;
            }
        }

        // Extract session date from email headers
        if (preg_match('/Date:\s*\w+,\s*(\d+)\s+(\w+)\s+(\d{4})/i', $html, $dateMatch)) {
            $months = ['Jan' => '01', 'Feb' => '02', 'Mar' => '03', 'Apr' => '04', 'May' => '05', 'Jun' => '06',
                'Jul' => '07', 'Aug' => '08', 'Sep' => '09', 'Oct' => '10', 'Nov' => '11', 'Dec' => '12'];
            $month = $months[$dateMatch[2]] ?? '01';
            $sessionInfo['date'] = $dateMatch[3] . '-' . $month . '-' . sprintf('%02d', $dateMatch[1]);
        }

        // Extract session number from subject (e.g., "Results - 10 - Heat")
        if (preg_match('/Results\s*-\s*(\d+)\s*-\s*Heat/i', $html, $sessionMatch)) {
            $sessionInfo['session_number'] = $sessionMatch[1];
        }

        // Parse "Jouw Rondetijden" (Your Lap Times) section
        // This section has driver names as column headers, then rows of lap times
        if (preg_match('/Jouw Rondetijden\s+(.*?)(?:Avg\.|Hist\.|Gem\.|Ben jij|$)/is', $content, $lapSection)) {
            $lapData = $lapSection[1];
            $lines = array_filter(array_map('trim', explode("\n", $lapData)));

            $driverNames = [];
            $lapsByDriver = [];

            // Strategy: Parse a lap row first to count how many lap times there are,
            // then parse driver names based on that count
            if (! empty($lines)) {
                $firstLine = $lines[0];  // Don't shift yet, we need it

                // Find first lap row to count columns
                $numColumns = 0;

                foreach ($lines as $line) {
                    if (preg_match('/^(\d+)\s+(.+)$/', $line, $match)) {
                        $timesString = $match[2];
                        preg_match_all('/(\d+:\d+\.\d+)/', $timesString, $timeMatches);
                        $numColumns = count($timeMatches[1]);
                        break;
                    }
                }

                // Now extract driver names based on number of columns
                // Since we know there are $numColumns drivers, split intelligently
                if ($numColumns > 0) {
                    // Split on 2+ spaces or tabs
                    $tempNames = preg_split('/\s{2,}|\t+/', $firstLine);
                    $tempNames = array_filter(array_map('trim', $tempNames));
                    $tempNames = array_values($tempNames);

                    if (count($tempNames) == $numColumns) {
                        // Perfect match
                        $driverNames = $tempNames;
                    } elseif (count($tempNames) < $numColumns) {
                        // Some names got merged - need to split them
                        // Strategy: Look for capital letters that indicate new names
                        $driverNames = [];

                        foreach ($tempNames as $chunk) {
                            // Check if this chunk contains multiple names (has multiple capital letters after spaces)
                            // Pattern: "Niek Oude Alink Maxim Schuttelaar" -> split before "Maxim"
                            // Split before any capitalized word that's not "van", "de", "den", etc.
                            $words = preg_split('/\s+/', $chunk);
                            $currentName = '';
                            $nameWordCount = 0;

                            foreach ($words as $word) {
                                $isConnector = in_array(strtolower($word), ['van', 'de', 'den', 'der', 'het', 'van den']);
                                $isCapitalized = ! empty($word) && ctype_upper($word[0]);

                                if ($currentName === '') {
                                    // Start first name
                                    $currentName = $word;
                                    $nameWordCount = 1;
                                } elseif ($isCapitalized && ! $isConnector && $nameWordCount >= 3 && count($driverNames) < $numColumns - 1) {
                                    // New name detected (after we have at least 3 words in current name) - save current and start new
                                    $driverNames[] = trim($currentName);
                                    $currentName = $word;
                                    $nameWordCount = 1;
                                } else {
                                    // Continue current name
                                    $currentName .= ' ' . $word;
                                    $nameWordCount++;
                                }
                            }

                            // Add the final name from this chunk
                            if (! empty($currentName)) {
                                $driverNames[] = trim($currentName);
                            }
                        }

                        // If we still don't have the right count, just use what we have
                        if (count($driverNames) != $numColumns) {
                            // Fall back to original split
                            $driverNames = array_values($tempNames);
                        }
                    } else {
                        // More names than columns - some splits were wrong, merge adjacent ones
                        // This is complex, so just use the first $numColumns names
                        $driverNames = array_slice($tempNames, 0, $numColumns);
                    }
                }

                // Initialize lap arrays for each driver
                foreach ($driverNames as $driverName) {
                    $lapsByDriver[$driverName] = [];
                }

                // Skip the header line now
                array_shift($lines);

                // Parse lap time rows
                // Each row starts with lap number, then lap times for each driver
                foreach ($lines as $line) {
                    // Match: lap_number followed by lap times (format: 1:03.545 or 1:3.5)
                    if (preg_match('/^(\d+)\s+(.+)$/', $line, $match)) {
                        $lapNumber = (int) $match[1];
                        $timesString = $match[2];

                        // Extract all lap times from the line (format: M:SS.mmm)
                        preg_match_all('/(\d+:\d+\.\d+)/', $timesString, $timeMatches);

                        if (! empty($timeMatches[1])) {
                            // Assign each time to corresponding driver
                            $driverIndex = 0;

                            foreach ($timeMatches[1] as $lapTimeString) {
                                if ($driverIndex < count($driverNames)) {
                                    $driverName = $driverNames[$driverIndex];
                                    $lapTime = $this->convertLapTimeToSeconds($lapTimeString);

                                    if ($lapTime > 0) {
                                        $lapsByDriver[$driverName][] = [
                                            'lap_number' => $lapNumber,
                                            'lap_time' => $lapTime,
                                        ];
                                    }
                                    $driverIndex++;
                                }
                            }
                        }
                    }
                }

                // Convert to final format
                foreach ($lapsByDriver as $driverName => $driverLaps) {
                    foreach ($driverLaps as $lap) {
                        $laps[] = [
                            'driver_name' => $driverName,
                            'lap_number' => $lap['lap_number'],
                            'lap_time' => $lap['lap_time'],
                            'position' => null,
                            'kart_number' => null,
                        ];
                    }
                }
            }
        }

        // If no laps found, fallback to best lap extraction from "Race overzicht"
        if (empty($laps)) {
            if (preg_match_all('/(\d+)\.\s+([^\d\s][^\n]+?)\s+(\d+:\d+\.\d+)/m', $content, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $match) {
                    $position = (int) $match[1];
                    $driverName = trim($match[2]);
                    $bestLap = $match[3];

                    // Filter out table headers like "Avg.", "Hist.", "Gem."
                    if (! in_array($driverName, ['Avg', 'Hist', 'Gem', 'Best', 'Avg.', 'Hist.', 'Gem.'])) {
                        $lapTime = $this->convertLapTimeToSeconds($bestLap);

                        if ($lapTime > 0) {
                            $laps[] = [
                                'driver_name' => $driverName,
                                'lap_number' => 1,
                                'lap_time' => $lapTime,
                                'position' => $position,
                                'kart_number' => null,
                            ];
                        }
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Parse Experience Factory Antwerp format
     * Format: Base64 encoded email with results table showing ALL drivers and "Your lap times RK" section
     * Drivers can have special characters like ¿, %, @, etc.
     */
    private function parseExperienceFactoryFormat(string $html): array
    {
        $laps = [];
        $sessionInfo = [];

        // Decode base64 content if present
        $content = $html;

        if (preg_match('/Content-Transfer-Encoding:\s*base64\s+([\s\S]+?)(?:--_000_|$)/i', $html, $match)) {
            $decoded = base64_decode($match[1]);

            if ($decoded) {
                $content = $decoded;
            }
        }

        // Extract session date and number
        if (preg_match('/(\d+)\.\s+RACE\s*-\s*\d+:\d+\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/i', $content, $match)) {
            $sessionInfo['session_number'] = $match[1];
            $sessionInfo['date'] = $match[4] . '-' . $match[3] . '-' . $match[2];
        }

        // Extract drivers from results table "Rnk Kart Driver Laps ... Best lap"
        $drivers = [];
        $lines = explode("\n", $content);
        $inResultsTable = false;

        for ($i = 0; $i < count($lines); $i++) {
            $line = trim($lines[$i]);

            // Look for results table header
            if (preg_match('/^Rnk\s+Kart\s+Driver\s+Laps/i', $line)) {
                $inResultsTable = true;
                continue;
            }

            if ($inResultsTable) {
                // Stop when we hit "Your lap times" section
                if (preg_match('/Your lap times/i', $line)) {
                    break;
                }

                // Match driver entry pattern: position number, then kart number, then driver name
                // Driver names can be special characters (¿, %, @) or text
                // Look for pattern: number newline number newline name newline number(laps) ...
                if (is_numeric($line) && isset($lines[$i + 2])) {
                    $kartNum = trim($lines[$i + 1] ?? '');
                    $driverName = trim($lines[$i + 2] ?? '');

                    // Skip if driver name looks like a number or is empty
                    if (! empty($driverName) && strlen($driverName) <= 50) {
                        $drivers[] = $driverName;
                    }
                }
            }
        }

        // Extract individual lap times for EACH driver from "Your lap times RK" sections
        // This email contains lap data for the recipient only, but we need to parse ALL drivers
        preg_match_all('/Your lap times\s+\w+\s+Lap\s+S1\s+S2\s+S3\s+Time\s+([\s\S]+?)(?:Your last sessions|Best times|Track records|$)/i', $content, $lapSections);

        if (! empty($lapSections[1])) {
            $lapData = $lapSections[1][0];
            $lapLines = explode("\n", $lapData);

            // Find which driver this belongs to by checking previous driver context
            $currentDriver = $drivers[0] ?? 'Unknown'; // Default to first driver or Unknown

            foreach ($lapLines as $line) {
                $line = trim($line);

                // Match: lap_number sector1 sector2 sector3 total_time
                // Example: 1       31.316  21.454  23.286          1:16.056
                if (preg_match('/^(\d+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d:\.]+)/', $line, $match)) {
                    $lapNumber = (int) $match[1];
                    $lapTime = $this->convertLapTimeToSeconds($match[5]);

                    if ($lapTime > 0) {
                        $laps[] = [
                            'driver_name' => $currentDriver,
                            'lap_number' => $lapNumber,
                            'lap_time' => $lapTime,
                            'position' => array_search($currentDriver, $drivers) + 1,
                            'kart_number' => null,
                        ];
                    }
                }
            }
        }

        // If no detailed laps found, extract best lap from results table
        if (empty($laps) && ! empty($drivers)) {
            preg_match_all('/Best lap\s+([\d:\.]+)/i', $content, $bestLaps);

            foreach ($drivers as $index => $driverName) {
                if (isset($bestLaps[1][$index])) {
                    $bestLap = $this->convertLapTimeToSeconds($bestLaps[1][$index]);

                    if ($bestLap > 0) {
                        $laps[] = [
                            'driver_name' => $driverName,
                            'lap_number' => 1,
                            'lap_time' => $bestLap,
                            'position' => $index + 1,
                            'kart_number' => null,
                        ];
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Parse Goodwill Karting format
     * Format: Base64 encoded forwarded email with "Sessie overzicht" table showing ALL drivers
     * and "Overzicht van je rondetijden" with individual lap times
     * Drivers can have special characters like ¨, @, etc.
     */
    private function parseGoodwillKartingFormat(string $html): array
    {
        $laps = [];
        $sessionInfo = [];

        // Decode base64 content if present
        $content = $html;

        if (preg_match('/Content-Transfer-Encoding:\s*base64\s+([\s\S]+?)(?:--_000_|$)/i', $html, $match)) {
            $decoded = base64_decode($match[1]);

            if ($decoded) {
                $content = $decoded;
            }
        }

        // Extract session date and number
        // Format: "Sessie 7 - 24/10/2025 om 16:00"
        if (preg_match('/Sessie\s+(\d+)\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/i', $content, $match)) {
            $sessionInfo['session_number'] = $match[1];
            $sessionInfo['date'] = $match[4] . '-' . $match[3] . '-' . $match[2];
        }

        // Extract drivers from "Sessie overzicht" table
        // Format: Pos. Kart Piloot Rondes Snelste ronde ...
        $drivers = [];
        $lines = explode("\n", $content);
        $inResultsTable = false;

        for ($i = 0; $i < count($lines); $i++) {
            $line = trim($lines[$i]);

            // Look for results table header
            if (preg_match('/^Pos\.\s+Kart\s+Piloot\s+Rondes/i', $line)) {
                $inResultsTable = true;
                continue;
            }

            if ($inResultsTable) {
                // Stop when we hit individual lap times section
                if (preg_match('/Rondetijden per piloot/i', $line)) {
                    break;
                }

                // Match driver entry: position, kart, driver name
                // Pattern: number newline number(kart) newline name newline number(laps)
                if (is_numeric($line) && isset($lines[$i + 2])) {
                    $kartNum = trim($lines[$i + 1] ?? '');
                    $driverName = trim($lines[$i + 2] ?? '');

                    // Driver names can be special characters or text
                    if (! empty($driverName) && strlen($driverName) <= 50) {
                        $drivers[] = [
                            'name' => $driverName,
                            'kart' => $kartNum,
                        ];
                    }
                }
            }
        }

        // Extract "Rondetijden per piloot" (lap times per driver) table
        // This table shows ALL drivers with their lap-by-lap times
        preg_match('/Rondetijden per piloot\s+Kart\s+Piloot([\s\S]+?)Overzicht van je rondetijden/i', $content, $lapTableMatch);

        if (! empty($lapTableMatch[1])) {
            $lapTableContent = $lapTableMatch[1];
            $lapLines = explode("\n", $lapTableContent);

            $currentDriver = null;
            $currentKart = null;
            $lapNumbers = [];

            for ($i = 0; $i < count($lapLines); $i++) {
                $line = trim($lapLines[$i]);

                // Skip empty lines
                if (empty($line)) {
                    continue;
                }

                // New driver section starts with kart number then driver name
                if (is_numeric($line) && isset($lapLines[$i + 2])) {
                    $currentKart = $line;
                    $currentDriver = trim($lapLines[$i + 2]);
                    continue;
                }

                // Parse lap times (line with multiple space-separated times)
                // Example: "36.318  37.711  35.814  36.529  35.583  35.423  35.582  36.038  35.307  35.469"
                if ($currentDriver && preg_match('/^[\d\.\s]+$/', $line)) {
                    $times = preg_split('/\s+/', $line);
                    $times = array_filter($times, fn ($t) => ! empty($t));

                    if (! isset($lapNumbers[$currentDriver])) {
                        $lapNumbers[$currentDriver] = 1;
                    }

                    foreach ($times as $lapTime) {
                        if (is_numeric($lapTime) && $lapTime > 0) {
                            $laps[] = [
                                'driver_name' => $currentDriver,
                                'lap_number' => $lapNumbers[$currentDriver]++,
                                'lap_time' => (float) $lapTime,
                                'position' => array_search($currentDriver, array_column($drivers, 'name')) + 1,
                                'kart_number' => $currentKart,
                            ];
                        }
                    }
                }
            }
        }

        // Fallback: Extract "Overzicht van je rondetijden" (recipient's individual lap times)
        if (empty($laps)) {
            preg_match('/Overzicht van je rondetijden.*?Ronde\s+Tijd([\s\S]+?)Je laatste sessie/i', $content, $yourLapsMatch);

            if (! empty($yourLapsMatch[1])) {
                $yourLaps = $yourLapsMatch[1];
                $lapLines = explode("\n", $yourLaps);

                // Assume first driver is the recipient
                $recipientDriver = $drivers[0]['name'] ?? 'Unknown';

                foreach ($lapLines as $line) {
                    $line = trim($line);

                    // Match: lap_number time
                    // Example: "1               38.542  2.868"
                    if (preg_match('/^(\d+)\s+([\d\.]+)/', $line, $match)) {
                        $lapNumber = (int) $match[1];
                        $lapTime = (float) $match[2];

                        if ($lapTime > 0) {
                            $laps[] = [
                                'driver_name' => $recipientDriver,
                                'lap_number' => $lapNumber,
                                'lap_time' => $lapTime,
                                'position' => 1,
                                'kart_number' => $drivers[0]['kart'] ?? null,
                            ];
                        }
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Generic parser for unknown formats
     */
    private function parseGenericFormat(string $html): array
    {
        $laps = [];
        $sessionInfo = [];

        // Try to find any table with lap times
        if (preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $html, $rows)) {
            foreach ($rows[1] as $row) {
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $row, $cells)) {
                    $data = array_map('strip_tags', $cells[1]);
                    $data = array_map('trim', $data);

                    // Look for time patterns (MM:SS.mmm or M:SS.mmm)
                    foreach ($data as $index => $value) {
                        if (preg_match('/\d{1,2}:\d{2}\.\d{3}/', $value)) {
                            // Found a lap time, try to extract driver name
                            $driverName = $data[$index - 1] ?? 'Unknown';

                            $laps[] = [
                                'driver_name' => $driverName,
                                'best_lap_time' => $this->convertLapTimeToSeconds($value),
                            ];
                        }
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Parse Spanish format from Fastkart Elche
     * Format: "RESULTADOS DETALLADOS" section with lap numbers and times
     */
    private function parseSpanishFormat(string $content): array
    {
        $laps = [];
        $sessionInfo = [];

        // Extract date (format: DD/MM/YYYY HH:MM)
        if (preg_match('/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/', $content, $dateMatch)) {
            $sessionInfo['date'] = $dateMatch[3] . '-' . $dateMatch[2] . '-' . $dateMatch[1];
        }

        // Extract driver name - look for pattern after "Pos." in detailed results section
        $driverName = 'Unknown';
        $lines = preg_split('/\r?\n/', $content);
        $foundPos = false;

        foreach ($lines as $i => $line) {
            $line = trim($line);

            // Look for the "Pos." line followed by number and driver info
            if (preg_match('/^Pos\.\s*(\d+)/', $line)) {
                $foundPos = true;
                continue;
            }

            // After "Pos.", next non-empty line starting with "V." has the driver name
            if ($foundPos && preg_match('/^V\.\s+(.+)/', $line, $nameMatch)) {
                $driverName = trim($nameMatch[1]);
                break;
            }
        }

        // Extract kart number (format: TB 29 or similar)
        $kartNumber = null;

        if (preg_match('/([A-Z]{1,2}\s+\d+)/', $content, $kartMatch)) {
            $kartNumber = trim($kartMatch[1]);
        }

        $inDetailedResults = false;
        $lapNumber = 1;

        foreach ($lines as $line) {
            $line = trim($line);

            if (str_contains($line, 'RESULTADOS DETALLADOS')) {
                $inDetailedResults = true;
                continue;
            }

            if ($inDetailedResults && ! empty($line)) {
                // Look for lap times (format: MM:SS.mmm or just lap number followed by time)
                if (preg_match('/^(\d+)\s+(\d{2}:\d{2}\.\d{3})/', $line, $matches)) {
                    // Line has both lap number and time
                    $lapNumber = (int) $matches[1];
                    $lapTime = $this->convertLapTimeToSeconds($matches[2]);

                    if ($lapTime > 0) {
                        $laps[] = [
                            'driver_name' => $driverName,
                            'lap_number' => $lapNumber,
                            'lap_time' => $lapTime,
                            'position' => 1,
                            'kart_number' => $kartNumber,
                        ];
                    }
                } elseif (preg_match('/^(\d{2}:\d{2}\.\d{3})$/', $line, $matches)) {
                    // Line has only time (lap number increments)
                    $lapTime = $this->convertLapTimeToSeconds($matches[1]);

                    if ($lapTime > 0) {
                        $laps[] = [
                            'driver_name' => $driverName,
                            'lap_number' => $lapNumber,
                            'lap_time' => $lapTime,
                            'position' => 1,
                            'kart_number' => $kartNumber,
                        ];
                        $lapNumber++;
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps,
        ];
    }

    /**
     * Convert lap time string to seconds
     * Format: "1:23.456" or "01:23.456"
     */
    private function convertLapTimeToSeconds(string $lapTime): float
    {
        $lapTime = trim($lapTime);

        // Remove any non-numeric characters except : and .
        $lapTime = preg_replace('/[^\d:.]/', '', $lapTime);

        // Pattern: M:SS.mmm or MM:SS.mmm
        if (preg_match('/^(\d{1,2}):(\d{2})\.(\d{3})$/', $lapTime, $matches)) {
            $minutes = (int) $matches[1];
            $seconds = (int) $matches[2];
            $milliseconds = (int) $matches[3];

            return $minutes * 60 + $seconds + ($milliseconds / 1000);
        }

        // Pattern: SS.mmm (seconds only)
        if (preg_match('/^(\d{1,2})\.(\d{3})$/', $lapTime, $matches)) {
            $seconds = (int) $matches[1];
            $milliseconds = (int) $matches[2];

            return $seconds + ($milliseconds / 1000);
        }

        // Fallback: try to parse as float
        return (float) $lapTime;
    }

    /**
     * Validate parsed data
     */
    public function validate(array $data): array
    {
        $errors = [];

        if (empty($data['laps'])) {
            $errors[] = 'No lap data found in file';
        }

        foreach ($data['laps'] as $index => $lap) {
            if (empty($lap['driver_name'])) {
                $errors[] = "Lap {$index}: Missing driver name";
            }

            if (! isset($lap['best_lap_time']) || $lap['best_lap_time'] <= 0) {
                $errors[] = "Lap {$index}: Invalid lap time";
            }
        }

        return $errors;
    }
}
