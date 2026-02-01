<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Track;

/**
 * Service for detecting karting tracks from file content and email data.
 *
 * This service handles track identification using pattern matching on:
 * - Filenames
 * - Email headers (subject, from)
 * - Email body content
 */
class TrackDetectorService
{
    /**
     * Track detection patterns mapped to track names.
     *
     * @var array<string, array<string>>
     */
    private array $trackPatterns = [
        'De Voltage' => ['devoltage', 'de voltage', 'karten sessie'],
        'Experience Factory' => ['experience factory', 'experiencefactory', 'experience_factory', 'antwerp'],
        'Goodwill Karting' => ['goodwill', 'goodwillkarting'],
        'Circuit Park Berghem' => ['berghem', 'circuit park', 'circuitpark', 'circuitparkberghem', 'race overzicht', 'jouw rondetijden', 'smstiming'],
        'Fastkart Elche' => ['fastkart', 'elche', 'resumen de tu carrera'],
        'Lot66' => ['lot66', 'lot 66'],
        'Racing Center Gilesias' => ['gilesias', 'racing center'],
    ];

    /**
     * City mappings for track names.
     *
     * @var array<string, string>
     */
    private array $trackCities = [
        'De Voltage' => 'Tilburg',
        'Experience Factory' => 'Antwerp',
        'Goodwill Karting' => 'Veenendaal',
        'Circuit Park Berghem' => 'Berghem',
        'Fastkart Elche' => 'Elche',
        'Lot66' => 'Oosterhout',
        'Racing Center Gilesias' => 'Gilesias',
    ];

    /**
     * Country mappings for track names.
     *
     * @var array<string, string>
     */
    private array $trackCountries = [
        'De Voltage' => 'Netherlands',
        'Experience Factory' => 'Belgium',
        'Goodwill Karting' => 'Netherlands',
        'Circuit Park Berghem' => 'Netherlands',
        'Fastkart Elche' => 'Spain',
        'Lot66' => 'Netherlands',
        'Racing Center Gilesias' => 'Spain',
    ];

    /**
     * Detect track from filename and file content.
     *
     * @param  string  $fileName  The original filename
     * @param  string  $content  The file content
     *
     * @return Track|null The detected track or null if not found
     */
    public function detectFromFile(string $fileName, string $content): ?Track
    {
        // Search a larger slice of the raw content (some EMLs embed useful text later)
        $searchText = strtolower($fileName . ' ' . substr($content, 0, 20000));

        foreach ($this->trackPatterns as $trackName => $patterns) {
            foreach ($patterns as $pattern) {
                if (stripos($searchText, $pattern) !== false) {
                    return $this->findOrCreateTrack($trackName);
                }
            }
        }

        return null;
    }

    /**
     * Detect track from parsed email data.
     *
     * @param  array{subject?: string, from?: string, body?: string}  $emailData  Parsed email data
     *
     * @return Track|null The detected track or null if not found
     */
    public function detectFromEmailData(array $emailData): ?Track
    {
        $subject = strtolower($emailData['subject'] ?? '');
        $from = strtolower($emailData['from'] ?? '');
        $body = strtolower($emailData['body'] ?? '');

        foreach ($this->trackPatterns as $trackName => $patterns) {
            foreach ($patterns as $pattern) {
                if (stripos($subject, $pattern) !== false
                    || stripos($from, $pattern) !== false
                    || stripos($body, $pattern) !== false) {
                    return $this->findOrCreateTrack($trackName);
                }
            }
        }

        return null;
    }

    /**
     * Get the city for a track name.
     *
     * @param  string  $trackName  The track name
     *
     * @return string|null The city or null if unknown
     */
    public function getTrackCity(string $trackName): ?string
    {
        return $this->trackCities[$trackName] ?? null;
    }

    /**
     * Get the country for a track name.
     *
     * @param  string  $trackName  The track name
     *
     * @return string The country (defaults to Netherlands)
     */
    public function getTrackCountry(string $trackName): string
    {
        return $this->trackCountries[$trackName] ?? 'Netherlands';
    }

    /**
     * Find existing track by name or create a new one.
     *
     * @param  string  $trackName  The track name to find or create
     *
     * @return Track|null The track model or null on failure
     */
    private function findOrCreateTrack(string $trackName): ?Track
    {
        try {
            $track = Track::whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($trackName) . '%'])->first();

            if ($track) {
                return $track;
            }

            return Track::create([
                'track_id' => 'TRK-' . strtoupper(substr(md5($trackName), 0, 6)),
                'name' => $trackName,
                'city' => $this->getTrackCity($trackName),
                'country' => $this->getTrackCountry($trackName),
            ]);
        } catch (\Throwable $e) {
            // Return null if DB not available
            return null;
        }
    }

    /**
     * Get all available track patterns.
     *
     * @return array<string, array<string>>
     */
    public function getTrackPatterns(): array
    {
        return $this->trackPatterns;
    }

    /**
     * Add a custom track pattern.
     *
     * @param  string  $trackName  The track name
     * @param  array<string>  $patterns  The patterns to match
     */
    public function addTrackPattern(string $trackName, array $patterns): void
    {
        $this->trackPatterns[$trackName] = $patterns;
    }

    /**
     * Match track name from text content.
     *
     * @param  string  $text  The text to search for track patterns
     *
     * @return string|null The matched track name or null if not found
     */
    public function matchTrackName(string $text): ?string
    {
        $searchText = strtolower($text);

        foreach ($this->trackPatterns as $trackName => $patterns) {
            foreach ($patterns as $pattern) {
                if (stripos($searchText, $pattern) !== false) {
                    return $trackName;
                }
            }
        }

        return null;
    }
}
