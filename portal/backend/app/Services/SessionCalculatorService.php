<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KartingSession;
use App\Models\Lap;

/**
 * Service for calculating session-related statistics and derived fields.
 *
 * This service handles:
 * - Best lap identification
 * - Gap calculations (to leader, to previous driver)
 * - Position rankings
 * - Speed calculations
 * - Cost calculations
 */
class SessionCalculatorService
{
    /**
     * Calculate all derived fields for a session.
     *
     * @param  int  $sessionId  The session ID to process
     */
    public function calculateSessionFields(int $sessionId): void
    {
        $session = KartingSession::with(['laps' => function ($query) {
            $query->orderBy('driver_id')->orderBy('lap_number');
        }, 'laps.driver', 'track'])->find($sessionId);

        if (! $session) {
            return;
        }

        $this->calculateDriverBestLaps($session);
        $this->calculateGapsToDriver($session);
        $this->calculatePositions($session);
    }

    /**
     * Calculate best laps and gaps for each driver.
     *
     * @param  KartingSession  $session  The session to process
     */
    private function calculateDriverBestLaps(KartingSession $session): void
    {
        // Group laps by driver
        $lapsByDriver = $session->laps->groupBy('driver_id');

        foreach ($lapsByDriver as $driverLaps) {
            // Find best lap for this driver
            $bestLap = $driverLaps->sortBy('lap_time')->first();
            $bestLapTime = $bestLap->lap_time;

            $previousLapTime = null;

            foreach ($driverLaps->sortBy('lap_number') as $lap) {
                $updates = [];

                // Mark best lap
                $updates['is_best_lap'] = ($lap->lap_time == $bestLapTime);

                // Calculate gap to best lap
                $updates['gap_to_best_lap'] = round($lap->lap_time - $bestLapTime, 3);

                // Calculate interval (time difference from previous lap by THIS driver)
                if ($previousLapTime !== null) {
                    $updates['interval'] = round($lap->lap_time - $previousLapTime, 3);
                }
                $previousLapTime = $lap->lap_time;

                // Calculate average speed if track distance is known
                if ($session->track && $session->track->distance) {
                    // Speed = distance / time = (distance_meters / lap_time) * 3.6 for km/h
                    $updates['avg_speed'] = round(($session->track->distance / $lap->lap_time) * 3.6, 2);
                }

                // Calculate cost per lap if track pricing is known
                if ($session->track && isset($session->track->pricing['costPerLap'])) {
                    $updates['cost_per_lap'] = $session->track->pricing['costPerLap'];
                }

                // Update lap
                $lap->update($updates);
            }
        }
    }

    /**
     * Calculate gaps to the driver ahead at each lap.
     *
     * @param  KartingSession  $session  The session to process
     */
    private function calculateGapsToDriver(KartingSession $session): void
    {
        // Group all session laps by lap_number
        $allLaps = $session->laps;

        foreach ($allLaps->groupBy('lap_number') as $lapsAtSameNumber) {
            $sortedLaps = $lapsAtSameNumber->sortBy('lap_time');

            $previousLapTime = null;

            foreach ($sortedLaps as $lap) {
                if ($previousLapTime !== null) {
                    $lap->update([
                        'gap_to_previous' => round($lap->lap_time - $previousLapTime, 3),
                    ]);
                }
                $previousLapTime = $lap->lap_time;
            }
        }
    }

    /**
     * Calculate overall session positions based on best lap times.
     *
     * @param  KartingSession  $session  The session to process
     */
    private function calculatePositions(KartingSession $session): void
    {
        $allBestLaps = $session->laps()
            ->where('is_best_lap', true)
            ->orderBy('lap_time')
            ->get();

        foreach ($allBestLaps as $index => $bestLap) {
            // Update position for ALL laps of this driver in this session
            Lap::where('karting_session_id', $session->id)
                ->where('driver_id', $bestLap->driver_id)
                ->update(['position' => $index + 1]);
        }
    }

    /**
     * Calculate gap to session leader for a specific lap.
     *
     * @param  float  $lapTime  The lap time to calculate
     * @param  float  $leaderTime  The leader's best lap time
     *
     * @return float The gap in seconds
     */
    public function calculateGapToLeader(float $lapTime, float $leaderTime): float
    {
        return round($lapTime - $leaderTime, 3);
    }

    /**
     * Calculate average speed for a lap.
     *
     * @param  float  $lapTime  The lap time in seconds
     * @param  float  $trackDistance  The track distance in meters
     *
     * @return float The average speed in km/h
     */
    public function calculateAverageSpeed(float $lapTime, float $trackDistance): float
    {
        if ($lapTime <= 0 || $trackDistance <= 0) {
            return 0.0;
        }

        return round(($trackDistance / $lapTime) * 3.6, 2);
    }

    /**
     * Calculate interval between current and previous lap.
     *
     * @param  float  $currentLapTime  Current lap time in seconds
     * @param  float  $previousLapTime  Previous lap time in seconds
     *
     * @return float The interval (positive = slower, negative = faster)
     */
    public function calculateInterval(float $currentLapTime, float $previousLapTime): float
    {
        return round($currentLapTime - $previousLapTime, 3);
    }

    /**
     * Format lap time as a string.
     *
     * @param  float  $lapTime  Lap time in seconds
     *
     * @return string Formatted lap time (e.g., "45.123" or "1:15.456")
     */
    public function formatLapTime(float $lapTime): string
    {
        if ($lapTime < 60) {
            return number_format($lapTime, 3);
        }

        $minutes = floor($lapTime / 60);
        $seconds = fmod($lapTime, 60);

        return sprintf('%d:%06.3f', $minutes, $seconds);
    }

    /**
     * Find the index of the best (fastest) lap.
     *
     * @param  array  $laps  Array of laps with 'lap_time' key
     *
     * @return int Index of fastest lap, or -1 if empty
     */
    public function findBestLapIndex(array $laps): int
    {
        if (empty($laps)) {
            return -1;
        }

        $bestIndex = 0;
        $bestTime = $laps[0]['lap_time'] ?? PHP_FLOAT_MAX;

        foreach ($laps as $index => $lap) {
            $lapTime = $lap['lap_time'] ?? PHP_FLOAT_MAX;

            if ($lapTime < $bestTime) {
                $bestTime = $lapTime;
                $bestIndex = $index;
            }
        }

        return $bestIndex;
    }
}
