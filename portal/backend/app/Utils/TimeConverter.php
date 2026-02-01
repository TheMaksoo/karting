<?php

namespace App\Utils;

/**
 * Utility class for converting time formats used in karting lap times
 */
class TimeConverter
{
    /**
     * Convert lap time string to seconds (float)
     * Supports formats: "1:23.456", "23.456", "83.456"
     *
     * @param  string  $timeString  Time in format "M:SS.mmm" or "SS.mmm"
     *
     * @return float Time in seconds
     */
    public static function toSeconds(string $timeString): float
    {
        $timeString = trim($timeString);

        // Format: "1:23.456" (minutes:seconds.milliseconds)
        if (str_contains($timeString, ':')) {
            [$minutes, $seconds] = explode(':', $timeString);

            return (float) $minutes * 60 + (float) $seconds;
        }

        // Format: "23.456" or "83.456" (seconds.milliseconds)
        return (float) $timeString;
    }

    /**
     * Convert seconds to formatted time string
     *
     * @param  float  $seconds  Time in seconds
     * @param  int  $decimals  Number of decimal places (default: 3)
     *
     * @return string Formatted time string "M:SS.mmm" or "SS.mmm"
     */
    public static function fromSeconds(float $seconds, int $decimals = 3): string
    {
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds - ($minutes * 60);

        if ($minutes > 0) {
            return sprintf('%d:%0' . ($decimals + 3) . '.' . $decimals . 'f', $minutes, $remainingSeconds);
        }

        return number_format($remainingSeconds, $decimals, '.', '');
    }

    /**
     * Format lap time for display with consistent formatting
     *
     * @param  float  $seconds  Time in seconds
     *
     * @return string Formatted time string
     */
    public static function format(float $seconds): string
    {
        return self::fromSeconds($seconds);
    }

    /**
     * Parse multiple time formats and return seconds
     * Handles various input formats gracefully
     *
     * @param  string|float|int  $time  Time in various formats
     *
     * @return float Time in seconds
     */
    public static function parse(string|float|int $time): float
    {
        if (is_numeric($time)) {
            return (float) $time;
        }

        return self::toSeconds((string) $time);
    }

    /**
     * Calculate time difference in seconds
     *
     * @param  float  $time1  First time in seconds
     * @param  float  $time2  Second time in seconds
     *
     * @return float Difference in seconds
     */
    public static function difference(float $time1, float $time2): float
    {
        return abs($time1 - $time2);
    }

    /**
     * Format time difference with +/- prefix
     *
     * @param  float  $time1  First time in seconds
     * @param  float  $time2  Second time in seconds (baseline)
     *
     * @return string Formatted difference "+1.234" or "-0.567"
     */
    public static function formatDifference(float $time1, float $time2): string
    {
        $diff = $time1 - $time2;
        $sign = $diff >= 0 ? '+' : '';

        return $sign . number_format($diff, 3, '.', '');
    }

    /**
     * Convert milliseconds to seconds
     *
     * @param  int  $milliseconds  Time in milliseconds
     *
     * @return float Time in seconds
     */
    public static function millisecondsToSeconds(int $milliseconds): float
    {
        return $milliseconds / 1000;
    }

    /**
     * Convert seconds to milliseconds
     *
     * @param  float  $seconds  Time in seconds
     *
     * @return int Time in milliseconds
     */
    public static function secondsToMilliseconds(float $seconds): int
    {
        return (int) round($seconds * 1000);
    }

    /**
     * Validate if a time string is valid
     *
     * @param  string  $timeString  Time string to validate
     *
     * @return bool True if valid, false otherwise
     */
    public static function isValid(string $timeString): bool
    {
        $timeString = trim($timeString);

        // Empty string is invalid
        if (empty($timeString)) {
            return false;
        }

        // Check format: M:SS.mmm or SS.mmm
        if (str_contains($timeString, ':')) {
            // Format: "1:23.456"
            return (bool) preg_match('/^\d+:\d{1,2}(\.\d+)?$/', $timeString);
        }

        // Format: "23.456" or "83.456"
        return is_numeric($timeString);
    }

    /**
     * Calculate average time from array of times
     *
     * @param  array  $times  Array of times in seconds
     *
     * @return float Average time in seconds
     */
    public static function average(array $times): float
    {
        if (empty($times)) {
            return 0.0;
        }

        return array_sum($times) / count($times);
    }

    /**
     * Find fastest time from array
     *
     * @param  array  $times  Array of times in seconds
     *
     * @return float|null Fastest time in seconds, or null if empty
     */
    public static function fastest(array $times): ?float
    {
        if (empty($times)) {
            return null;
        }

        return min($times);
    }

    /**
     * Find slowest time from array
     *
     * @param  array  $times  Array of times in seconds
     *
     * @return float|null Slowest time in seconds, or null if empty
     */
    public static function slowest(array $times): ?float
    {
        if (empty($times)) {
            return null;
        }

        return max($times);
    }
}
