<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\KartingSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class KartingSessionController extends Controller
{
    /**
     * Cache TTL for session stats (5 minutes)
     */
    private const CACHE_TTL = 300;

    public function index(Request $request)
    {
        $query = KartingSession::with(['track', 'laps.driver']);

        // Track filter
        if ($request->has('track_id')) {
            $query->where('track_id', $request->track_id);
        }

        // Session type filter
        if ($request->has('session_type')) {
            $query->where('session_type', $request->session_type);
        }

        // Date range filters
        if ($request->has('date_from')) {
            $query->whereDate('session_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('session_date', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 25);
        $sessions = $query->orderBy('session_date', 'desc')->paginate($perPage);

        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'track_id' => 'required|exists:tracks,id',
            'session_date' => 'required|date',
            'session_time' => 'nullable|date_format:H:i',
            'session_type' => 'required|string',
            'heat' => 'sometimes|integer',
            'weather' => 'nullable|string',
            'temperature' => 'nullable|numeric',
            'source' => 'nullable|string',
            'heat_price' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $session = KartingSession::create($validated);

        return response()->json($session, 201);
    }

    public function show(string $id)
    {
        $session = KartingSession::with(['track', 'laps.driver'])->findOrFail($id);

        return response()->json($session);
    }

    public function update(Request $request, string $id)
    {
        $session = KartingSession::findOrFail($id);

        $validated = $request->validate([
            'track_id' => 'sometimes|exists:tracks,id',
            'session_date' => 'sometimes|date_format:Y-m-d',
            'session_time' => 'nullable|date_format:H:i',
            'session_type' => 'sometimes|string',
            'heat' => 'sometimes|integer',
            'weather' => 'nullable|string',
            'temperature' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $session->update($validated);

        return response()->json($session);
    }

    public function destroy(string $id)
    {
        $session = KartingSession::findOrFail($id);

        // Soft delete all associated laps first
        $session->laps()->delete();

        // Then delete the session
        $session->delete();

        return response()->json(['message' => 'Session deleted successfully']);
    }

    public function laps(string $id)
    {
        $session = KartingSession::findOrFail($id);
        $laps = $session->laps()->with('driver')->orderBy('lap_number')->get();

        return response()->json($laps);
    }

    /**
     * Get comprehensive statistics for a specific session
     * Cached for 5 minutes to improve performance
     */
    public function stats(string $id)
    {
        $cacheKey = "session_stats_{$id}";

        $stats = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($id) {
            $session = KartingSession::with(['track', 'laps.driver'])->findOrFail($id);

            $laps = $session->laps;

            if ($laps->isEmpty()) {
                return [
                    'session' => $session,
                    'total_laps' => 0,
                    'drivers' => [],
                    'fastest_lap' => null,
                    'average_lap_time' => null,
                ];
            }

            // Calculate overall stats
            $totalLaps = $laps->count();
            $fastestLap = $laps->sortBy('lap_time')->first();
            $avgLapTime = $laps->avg('lap_time');

            // Calculate per-driver stats
            $driverStats = $laps->groupBy('driver_id')->map(function ($driverLaps, $driverId) {
                $driver = $driverLaps->first()->driver;
                $lapTimes = $driverLaps->pluck('lap_time');

                return [
                    'driver' => $driver,
                    'total_laps' => $driverLaps->count(),
                    'fastest_lap' => $lapTimes->min(),
                    'slowest_lap' => $lapTimes->max(),
                    'average_lap_time' => $lapTimes->avg(),
                    'median_lap_time' => $this->calculateMedian($lapTimes->toArray()),
                    'consistency' => $lapTimes->count() > 1 ? $this->calculateStdDev($lapTimes->toArray()) : 0,
                ];
            })->values();

            return [
                'session' => $session,
                'total_laps' => $totalLaps,
                'drivers' => $driverStats,
                'fastest_lap' => [
                    'lap_time' => $fastestLap->lap_time,
                    'driver' => $fastestLap->driver,
                    'lap_number' => $fastestLap->lap_number,
                ],
                'average_lap_time' => round($avgLapTime, 3),
                'lap_time_distribution' => $this->calculateLapTimeDistribution($laps),
            ];
        });

        return response()->json($stats);
    }

    /**
     * Calculate median of array
     */
    private function calculateMedian(array $values): float
    {
        if (empty($values)) {
            return 0;
        }

        sort($values);
        $count = count($values);
        $middle = floor($count / 2);

        if ($count % 2 === 0) {
            return ($values[$middle - 1] + $values[$middle]) / 2;
        }

        return $values[$middle];
    }

    /**
     * Calculate standard deviation (consistency metric)
     */
    private function calculateStdDev(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }

        $mean = array_sum($values) / count($values);
        $variance = array_reduce($values, function ($carry, $value) use ($mean) {
            return $carry + pow($value - $mean, 2);
        }, 0) / count($values);

        return round(sqrt($variance), 3);
    }

    /**
     * Calculate lap time distribution (fast/medium/slow buckets)
     */
    private function calculateLapTimeDistribution($laps): array
    {
        $lapTimes = $laps->pluck('lap_time');
        $min = $lapTimes->min();
        $max = $lapTimes->max();
        $range = $max - $min;

        if ($range == 0) {
            return ['fast' => $laps->count(), 'medium' => 0, 'slow' => 0];
        }

        $fastThreshold = $min + ($range * 0.33);
        $mediumThreshold = $min + ($range * 0.67);

        return [
            'fast' => $laps->filter(fn ($lap) => $lap->lap_time <= $fastThreshold)->count(),
            'medium' => $laps->filter(fn ($lap) => $lap->lap_time > $fastThreshold && $lap->lap_time <= $mediumThreshold)->count(),
            'slow' => $laps->filter(fn ($lap) => $lap->lap_time > $mediumThreshold)->count(),
        ];
    }
}
