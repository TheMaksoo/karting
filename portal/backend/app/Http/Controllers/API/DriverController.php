<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function index()
    {
        // Use single efficient query with subquery for session counts
        $drivers = Driver::withCount('laps')
            ->withCount(['laps as sessions_count' => function ($query) {
                $query->select(DB::raw('COUNT(DISTINCT karting_session_id)'));
            }])
            ->get();

        return response()->json($drivers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:drivers,email',
            'nickname' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
        ]);

        $driver = Driver::create($validated);

        return response()->json($driver, 201);
    }

    public function show(string $id)
    {
        $driver = Driver::with(['laps.kartingSession.track'])->findOrFail($id);

        return response()->json($driver);
    }

    public function update(Request $request, string $id)
    {
        $driver = Driver::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:drivers,email,' . $id,
            'nickname' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
            'is_active' => 'sometimes|boolean',
        ]);

        $driver->update($validated);

        return response()->json($driver);
    }

    public function destroy(string $id)
    {
        $driver = Driver::findOrFail($id);
        $driver->delete();

        return response()->json(['message' => 'Driver deleted successfully']);
    }

    public function stats(Request $request)
    {
        $driverId = $request->query('driver_id');
        $friendsOnly = $request->query('friends_only', false);

        // Get allowed driver IDs for the user (user + friends)
        $user = $request->user();
        $allowedDriverIds = $this->getAllowedDriverIds($user);

        // Create cache key based on filters
        $cacheKey = 'driver_stats_' . $user->id . '_' . ($driverId ?? 'all') . '_' . ($friendsOnly ? 'friends' : 'all');

        // Cache for 5 minutes
        $stats = Cache::remember($cacheKey, 300, function () use ($driverId, $friendsOnly, $user, $allowedDriverIds) {
            // Build base query
            $query = Driver::query();

            if ($driverId) {
                $query->where('id', $driverId);
            } elseif ($friendsOnly) {
                $query->whereIn('id', $allowedDriverIds);
            } elseif ($user->role !== 'admin') {
                $query->whereIn('id', $allowedDriverIds);
            }

            $driverIds = $query->pluck('id');

            // Fetch all laps with eager loading in ONE query
            $allLaps = Lap::whereIn('driver_id', $driverIds)
                ->with(['kartingSession.track', 'driver'])
                ->get()
                ->groupBy('driver_id');

            // Get driver info
            $drivers = Driver::whereIn('id', $driverIds)->get();

            return $drivers->map(function ($driver) use ($allLaps) {
                $laps = $allLaps->get($driver->id, collect());
                $bestLap = $laps->where('is_best_lap', true)->first();
                $allLapTimes = $laps->pluck('lap_time')->filter();

                // Group laps by track to find track-specific stats
                $trackLaps = $laps->groupBy(fn ($lap) => $lap->kartingSession?->track_id);

                return [
                    'driver_id' => $driver->id,
                    'driver_name' => $driver->name,
                    'nickname' => $driver->nickname,
                    'display_name' => $driver->nickname ?: $driver->name,
                    'color' => $driver->color,
                    'total_laps' => $laps->count(),
                    'total_sessions' => $laps->pluck('karting_session_id')->unique()->count(),
                    'total_tracks' => $trackLaps->count(),
                    'best_lap_time' => $bestLap ? (float) $bestLap->lap_time : null,
                    'best_lap_track' => $bestLap?->kartingSession?->track?->name,
                    'average_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->avg() : null,
                    'median_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->median() : null,
                    'total_cost' => (float) $laps->sum('cost_per_lap'),
                    'consistency_score' => null,
                    'avg_gap_to_record' => null,
                    'lap_times' => $allLapTimes->values(),
                ];
            });
        });

        return response()->json($stats);
    }

    /**
     * Get allowed driver IDs for the authenticated user (user's own drivers + friends)
     */
    private function getAllowedDriverIds($user)
    {
        $driverIds = [];

        // Add user's own driver_id if exists (legacy single driver)
        if ($user->driver_id) {
            $driverIds[] = $user->driver_id;
        }

        // Add all drivers connected to user (many-to-many)
        $connectedDriverIds = DB::table('driver_user')
            ->where('user_id', $user->id)
            ->pluck('driver_id')
            ->toArray();
        $driverIds = array_merge($driverIds, $connectedDriverIds);

        // Add friend driver IDs
        $friendIds = DB::table('friends')
            ->where('user_id', $user->id)
            ->pluck('friend_driver_id')
            ->toArray();

        return array_unique(array_merge($driverIds, $friendIds));
    }
}
