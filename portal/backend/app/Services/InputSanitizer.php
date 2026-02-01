<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Service for sanitizing user input to prevent XSS and HTML injection attacks.
 *
 * This service provides methods for cleaning various types of user input
 * before storage or display.
 */
class InputSanitizer
{
    /**
     * HTML tags that are allowed in rich text content.
     *
     * @var array<string>
     */
    private array $allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p'];

    /**
     * Sanitize a plain text string by removing all HTML tags.
     *
     * @param  string|null  $input  The input string to sanitize
     *
     * @return string|null The sanitized string or null if input was null
     */
    public function sanitizeText(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }

        // Remove all HTML tags
        $clean = strip_tags($input);

        // Convert special characters to HTML entities
        $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Trim whitespace
        return trim($clean);
    }

    /**
     * Sanitize a driver name by removing HTML and normalizing whitespace.
     *
     * @param  string|null  $name  The driver name to sanitize
     *
     * @return string|null The sanitized name
     */
    public function sanitizeDriverName(?string $name): ?string
    {
        if ($name === null) {
            return null;
        }

        // Remove HTML tags
        $clean = strip_tags($name);

        // Remove potentially dangerous characters but keep common name characters
        // Allows: letters (including accented), numbers, spaces, hyphens, apostrophes
        $clean = preg_replace('/[<>"\\\\\x00-\x1f]/', '', $clean);

        // Normalize whitespace (multiple spaces to single, trim)
        $clean = preg_replace('/\s+/', ' ', $clean);

        return trim($clean);
    }

    /**
     * Sanitize HTML content by allowing only specific tags.
     *
     * @param  string|null  $input  The HTML input to sanitize
     * @param  array<string>|null  $allowedTags  Custom allowed tags (uses defaults if null)
     *
     * @return string|null The sanitized HTML
     */
    public function sanitizeHtml(?string $input, ?array $allowedTags = null): ?string
    {
        if ($input === null) {
            return null;
        }

        $tags = $allowedTags ?? $this->allowedTags;
        $tagString = '<' . implode('><', $tags) . '>';

        // Remove disallowed tags
        $clean = strip_tags($input, $tagString);

        // Remove any event handlers from remaining tags
        $clean = preg_replace('/\son\w+\s*=\s*["\'][^"\']*["\']/i', '', $clean);

        // Remove javascript: URLs
        $clean = preg_replace('/javascript\s*:/i', '', $clean);

        return trim($clean);
    }

    /**
     * Sanitize a filename by removing path traversal and special characters.
     *
     * @param  string|null  $filename  The filename to sanitize
     *
     * @return string|null The sanitized filename
     */
    public function sanitizeFilename(?string $filename): ?string
    {
        if ($filename === null) {
            return null;
        }

        // Remove path components (prevent path traversal)
        $clean = basename($filename);

        // Remove null bytes
        $clean = str_replace("\0", '', $clean);

        // Replace potentially dangerous characters
        $clean = preg_replace('/[<>:"|?*\x00-\x1f]/', '_', $clean);

        // Ensure filename doesn't start with a dot (hidden files)
        $clean = ltrim($clean, '.');

        return $clean ?: 'unnamed';
    }

    /**
     * Sanitize an email address.
     *
     * @param  string|null  $email  The email to sanitize
     *
     * @return string|null The sanitized email or null if invalid
     */
    public function sanitizeEmail(?string $email): ?string
    {
        if ($email === null) {
            return null;
        }

        $clean = filter_var(trim($email), FILTER_SANITIZE_EMAIL);

        if (filter_var($clean, FILTER_VALIDATE_EMAIL) === false) {
            return null;
        }

        return $clean;
    }

    /**
     * Sanitize notes or free-form text fields.
     *
     * @param  string|null  $notes  The notes to sanitize
     *
     * @return string|null The sanitized notes
     */
    public function sanitizeNotes(?string $notes): ?string
    {
        if ($notes === null) {
            return null;
        }

        // Remove all HTML tags
        $clean = strip_tags($notes);

        // Preserve newlines but normalize line endings
        $clean = str_replace(["\r\n", "\r"], "\n", $clean);

        // Convert special characters to entities
        $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim($clean);
    }

    /**
     * Sanitize a kart number (alphanumeric only).
     *
     * @param  string|null  $kartNumber  The kart number to sanitize
     *
     * @return string|null The sanitized kart number
     */
    public function sanitizeKartNumber(?string $kartNumber): ?string
    {
        if ($kartNumber === null) {
            return null;
        }

        // Keep only alphanumeric characters and hyphens
        $clean = preg_replace('/[^a-zA-Z0-9\-]/', '', $kartNumber);

        return $clean ?: null;
    }

    /**
     * Batch sanitize an array of lap data.
     *
     * @param  array<array<string, mixed>>  $laps  Array of lap data
     *
     * @return array<array<string, mixed>> Sanitized lap data
     */
    public function sanitizeLapData(array $laps): array
    {
        return array_map(function ($lap) {
            if (isset($lap['driver_name'])) {
                $lap['driver_name'] = $this->sanitizeDriverName($lap['driver_name']);
            }

            if (isset($lap['kart_number'])) {
                $lap['kart_number'] = $this->sanitizeKartNumber($lap['kart_number']);
            }

            return $lap;
        }, $laps);
    }
}
