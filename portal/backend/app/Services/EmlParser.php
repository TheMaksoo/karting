<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

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
        
        // Extract HTML body
        $html = $this->extractHtmlBody($parsed);
        
        if (!$html) {
            throw new Exception("Could not extract HTML from EML file");
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
    private function extractHtmlBody(array $parsed): ?string
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
        
        // Extract HTML from multipart if needed
        if (isset($parsed['headers']['content-type']) &&
            str_contains($parsed['headers']['content-type'], 'multipart')) {
            $body = $this->extractFromMultipart($body);
        }
        
        return $body;
    }

    /**
     * Extract HTML from multipart MIME
     */
    private function extractFromMultipart(string $body): string
    {
        // Find boundary
        if (preg_match('/boundary="([^"]+)"/', $body, $matches)) {
            $boundary = $matches[1];
            $parts = explode("--{$boundary}", $body);
            
            foreach ($parts as $part) {
                if (str_contains($part, 'text/html')) {
                    // Extract content after headers
                    $content = preg_split('/\r?\n\r?\n/', $part, 2);
                    if (isset($content[1])) {
                        return $content[1];
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
        // Get track information
        $track = \App\Models\Track::find($trackId);
        
        if (!$track) {
            throw new Exception("Track not found");
        }

        // Parse based on track name patterns
        $trackName = strtolower($track->name);

        if (str_contains($trackName, 'de voltage') || str_contains($trackName, 'voltage')) {
            return $this->parseDeVoltageFormat($html);
        }
        
        if (str_contains($trackName, 'lot66') || str_contains($trackName, 'lot 66')) {
            return $this->parseLot66Format($html);
        }
        
        if (str_contains($trackName, 'circuit park') || str_contains($trackName, 'berghem')) {
            return $this->parseCircuitParkBerghemFormat($html);
        }
        
        if (str_contains($trackName, 'experience factory') || str_contains($trackName, 'antwerp')) {
            return $this->parseExperienceFactoryFormat($html);
        }
        
        if (str_contains($trackName, 'goodwill')) {
            return $this->parseGoodwillKartingFormat($html);
        }

        // Generic fallback parser
        return $this->parseGenericFormat($html);
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
