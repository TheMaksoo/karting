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
     * @param string $filePath Path to the EML file
     * @param int $trackId Track ID for context-specific parsing
     * @return array Parsed lap data
     * @throws Exception
     */
    public function parse(string $filePath, int $trackId): array
    {
        if (!file_exists($filePath)) {
            throw new Exception("EML file not found: {$filePath}");
        }

        $content = file_get_contents($filePath);
        
        // Parse the EML structure
        $parsed = $this->parseEmlStructure($content);
        
        // Extract HTML body - pass full content for multipart parsing
        $html = $this->extractHtmlBody($parsed, $content);
        
        // If no HTML found, try using the body directly as plain text
        if (!$html && !empty($parsed['body'])) {
            $html = $parsed['body'];
        }
        
        // If still no content, use full file content
        if (!$html) {
            $html = $content;
        }

        // Parse lap data based on track format
        return $this->parseTrackSpecificFormat($html, $trackId);
    }

    /**
     * Parse a plain text file with lap data
     *
     * @param string $filePath Path to the text file
     * @param int $trackId Track ID for context-specific parsing
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
     * @param string $filePath Path to the PDF file
     * @param int $trackId Track ID for context-specific parsing
     * @return array Parsed lap data
     * @throws Exception
     */
    public function parsePdfFile(string $filePath, int $trackId): array
    {
        if (!file_exists($filePath)) {
            throw new Exception("PDF file not found: {$filePath}");
        }

        try {
            // Use smalot/pdfparser library for robust PDF text extraction
            $parser = new PdfParser();
            $pdf = $parser->parseFile($filePath);
            $text = $pdf->getText();
            
            // If we couldn't extract text, throw an exception
            if (empty(trim($text))) {
                throw new Exception("Could not extract text from PDF.");
            }
            
            // Parse the extracted text using track-specific format
            return $this->parseTrackSpecificFormat($text, $trackId);
            
        } catch (Exception $e) {
            Log::error("PDF parsing failed: " . $e->getMessage());
            throw new Exception("PDF parsing failed: " . $e->getMessage());
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
            'body' => $body
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
            $parts = explode("--" . $boundary, $body);
            
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
        // UNIVERSAL PARSER - works with ANY karting format
        return $this->parseUniversalFormat($html);
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
        if (!empty($detailedLaps)) {
            return [
                'session_info' => $sessionInfo,
                'laps' => $detailedLaps
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
                    
                    if (count($data) < 2) continue;
                    
                    // Look for position number, name, and time pattern
                    $position = null;
                    $driverName = null;
                    $lapTime = null;
                    $kartNumber = null;
                    
                    foreach ($data as $index => $value) {
                        // Check if it's a position (small number at start)
                        if ($index === 0 && is_numeric($value) && $value < 100) {
                            $position = (int)$value;
                        }
                        
                        // Check if it's a lap time (MM:SS.mmm or SS.mmm format)
                        if (preg_match('/^\d{1,2}:\d{2}\.\d{2,3}$/', $value) || 
                            preg_match('/^\d{2}\.\d{2,3}$/', $value) ||
                            preg_match('/^\d{2}\.\d{1,3}$/', $value)) {
                            $lapTime = $this->convertLapTimeToSeconds($value);
                        }
                        
                        // Check if it's a kart number (usually small int)
                        if (is_numeric($value) && $value > 0 && $value < 200 && !$position) {
                            $kartNumber = $value;
                        }
                        
                        // Likely a driver name (has letters, not a time)
                        if (preg_match('/[a-zA-Z]{3,}/', $value) && 
                            !preg_match('/^\d+[:\.]\d+/', $value) &&
                            !str_contains(strtolower($value), 'pos') &&
                            !str_contains(strtolower($value), 'name') &&
                            !str_contains(strtolower($value), 'best') &&
                            !str_contains(strtolower($value), 'lap')) {
                            $driverName = $value;
                        }
                    }
                    
                    // If we found a name and a time, it's a lap!
                    if ($driverName && $lapTime) {
                        $laps[] = [
                            'driver_name' => $driverName,
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
                    'laps' => $laps
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
            if (!empty($line) && 
                !preg_match('/\d{2}\.\d{2}\.\d{4}/', $line) &&
                !str_contains($line, 'Lot66') &&
                !str_contains($line, 'At ') &&
                !str_contains($line, 'Lap') &&
                !str_contains($line, 'S1') &&
                !str_contains($line, 'Time') &&
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
                $lapNumber = (int)$line;
                
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
        if (!empty($laps)) {
            return [
                'session_info' => $sessionInfo,
                'laps' => $laps
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
                $lapNumber = (int)$matches[1];
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
                        $position = (int)$posMatch[1];
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
            'laps' => $laps
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
        if (!preg_match('/Detailed\s+results/i', $content)) {
            return [];
        }
        
        // Find all table rows after "Detailed results"
        $detailedSection = substr($content, stripos($content, 'Detailed'));
        
        if (!preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $detailedSection, $rows)) {
            return [];
        }
        
        $driverNames = [];
        $driverPositions = [];
        
        // Process rows
        foreach ($rows[1] as $rowIndex => $row) {
            if (preg_match_all('/<t[hd][^>]*>(.*?)<\/t[hd]>/is', $row, $cells)) {
                $cellData = array_map('strip_tags', $cells[1]);
                $cellData = array_map('trim', $cellData);
                $cellData = array_filter($cellData, fn($v) => $v !== '&nbsp;' && $v !== '');
                $cellData = array_values($cellData);
                
                // First data row contains driver names
                if (empty($driverNames) && count($cellData) > 2) {
                    // Check if this row has driver names (has letters, not just numbers)
                    $hasNames = false;
                    foreach ($cellData as $cell) {
                        if (preg_match('/[a-zA-Z]{3,}/', $cell) && !preg_match('/^\d+[:\.]\d+/', $cell)) {
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
                if (!empty($driverNames) && count($cellData) > 1) {
                    $lapNumber = null;
                    
                    // First cell should be lap number
                    if (is_numeric($cellData[0]) && $cellData[0] > 0 && $cellData[0] < 100) {
                        $lapNumber = (int)$cellData[0];
                        
                        // Remaining cells are lap times for each driver
                        $lapTimes = array_slice($cellData, 1);
                        
                        foreach ($lapTimes as $driverIndex => $lapTimeStr) {
                            if (!isset($driverNames[$driverIndex])) continue;
                            if (empty($lapTimeStr)) continue;
                            
                            // Convert lap time to seconds
                            $lapTime = $this->convertLapTimeToSeconds($lapTimeStr);
                            
                            if ($lapTime > 0) {
                                // Track driver position if not set
                                if (!isset($driverPositions[$driverIndex])) {
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
     * Format: HTML table with columns: Pos, Kart, Name, Laps, Best, Gap
     */
    private function parseDeVoltageFormat(string $html): array
    {
        $laps = [];
        $sessionInfo = [];

        // Extract session date from email
        if (preg_match('/(\d{4}-\d{2}-\d{2})/', $html, $dateMatch)) {
            $sessionInfo['date'] = $dateMatch[1];
        }

        // Extract session number
        if (preg_match('/Sessie\s+(\d+)/i', $html, $sessionMatch)) {
            $sessionInfo['session_number'] = $sessionMatch[1];
        }

        // Parse table rows
        if (preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $html, $rows)) {
            foreach ($rows[1] as $row) {
                // Extract cells
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $row, $cells)) {
                    $data = array_map('strip_tags', $cells[1]);
                    $data = array_map('trim', $data);

                    // Skip header rows
                    if (count($data) >= 4 && !str_contains($data[0], 'Pos')) {
                        $driverName = $data[2] ?? '';
                        $bestLap = $data[4] ?? '';

                        if ($driverName && $bestLap) {
                            // Convert lap time to seconds
                            $lapTime = $this->convertLapTimeToSeconds($bestLap);

                            $laps[] = [
                                'driver_name' => $driverName,
                                'kart_number' => $data[1] ?? null,
                                'position' => (int)($data[0] ?? 0),
                                'best_lap_time' => $lapTime,
                                'total_laps' => (int)($data[3] ?? 0),
                            ];
                        }
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps
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
                            'best_lap_time' => $this->convertLapTimeToSeconds($data[2] ?? '0:00.000'),
                            'position' => (int)$data[0],
                        ];
                    }
                }
            }
        }

        return [
            'session_info' => $sessionInfo,
            'laps' => $laps
        ];
    }

    /**
     * Parse Circuit Park Berghem format
     */
    private function parseCircuitParkBerghemFormat(string $html): array
    {
        // Similar structure to De Voltage but outdoor track
        return $this->parseDeVoltageFormat($html);
    }

    /**
     * Parse Experience Factory Antwerp format
     */
    private function parseExperienceFactoryFormat(string $html): array
    {
        $laps = [];
        $sessionInfo = [];

        // Extract PDF-based data (if available)
        // This format typically comes as PDF, so we'd need to extract text first
        
        return [
            'session_info' => $sessionInfo,
            'laps' => $laps
        ];
    }

    /**
     * Parse Goodwill Karting format
     */
    private function parseGoodwillKartingFormat(string $html): array
    {
        return $this->parseDeVoltageFormat($html);
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
            'laps' => $laps
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
        
        // Extract driver name (after "Pos." and before kart number)
        $driverName = 'Unknown';
        if (preg_match('/V\.\s+([^\r\n]+)/', $content, $nameMatch)) {
            $driverName = trim($nameMatch[1]);
        }
        
        // Extract kart number (format: TB 29 or similar)
        $kartNumber = null;
        if (preg_match('/([A-Z]{2}\s+\d+)/', $content, $kartMatch)) {
            $kartNumber = trim($kartMatch[1]);
        }
        
        $lines = preg_split('/\r?\n/', $content);
        $inDetailedResults = false;
        $lapNumber = 1;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            if (str_contains($line, 'RESULTADOS DETALLADOS')) {
                $inDetailedResults = true;
                continue;
            }
            
            if ($inDetailedResults && !empty($line)) {
                // Look for lap times (format: MM:SS.mmm or just lap number followed by time)
                if (preg_match('/^(\d+)\s+(\d{2}:\d{2}\.\d{3})/', $line, $matches)) {
                    // Line has both lap number and time
                    $lapNumber = (int)$matches[1];
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
            'laps' => $laps
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
            $minutes = (int)$matches[1];
            $seconds = (int)$matches[2];
            $milliseconds = (int)$matches[3];
            
            return $minutes * 60 + $seconds + ($milliseconds / 1000);
        }

        // Pattern: SS.mmm (seconds only)
        if (preg_match('/^(\d{1,2})\.(\d{3})$/', $lapTime, $matches)) {
            $seconds = (int)$matches[1];
            $milliseconds = (int)$matches[2];
            
            return $seconds + ($milliseconds / 1000);
        }

        // Fallback: try to parse as float
        return (float)$lapTime;
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
            
            if (!isset($lap['best_lap_time']) || $lap['best_lap_time'] <= 0) {
                $errors[] = "Lap {$index}: Invalid lap time";
            }
        }

        return $errors;
    }
}
