<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AllowedDriversTrait;
use App\Models\Driver;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    use AllowedDriversTrait;

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

    /**
     * Get stats aggregated by ACCOUNT (all drivers combined per user)
     * Returns one stat block per account, not per individual driver
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        // Create cache key based on user
        $cacheKey = 'account_stats_' . $user->id;

        // Cache for 5 minutes
        $stats = Cache::remember($cacheKey, 300, function () use ($user) {
            $accounts = $this->getDriverIdsByAccount($user);

            return collect($accounts)->map(function ($account) {
                // Get all laps for this account's drivers
                $laps = Lap::whereIn('driver_id', $account['driver_ids'])
                    ->with(['kartingSession.track', 'driver'])
                    ->get();

                $bestLap = $laps->where('is_best_lap', true)->sortBy('lap_time')->first();
                $allLapTimes = $laps->pluck('lap_time')->filter();

                // Group laps by track
                $trackLaps = $laps->groupBy(fn ($lap) => $lap->kartingSession?->track_id);

                return [
                    'account_id' => $account['user_id'],
                    'account_name' => $account['user_name'],
                    'is_current_user' => $account['is_current_user'],
                    'driver_count' => count($account['driver_ids']),
                    'driver_ids' => $account['driver_ids'],
                    'total_laps' => $laps->count(),
                    'total_sessions' => $laps->pluck('karting_session_id')->unique()->count(),
                    'total_tracks' => $trackLaps->count(),
                    'best_lap_time' => $bestLap ? (float) $bestLap->lap_time : null,
                    'best_lap_track' => $bestLap?->kartingSession?->track?->name,
                    'best_lap_driver' => $bestLap?->driver?->name,
                    'average_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->avg() : null,
                    'median_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->median() : null,
                    'total_cost' => (float) $laps->sum('cost_per_lap'),
                    'lap_times' => $allLapTimes->values(),
                ];
            });
        });

        return response()->json($stats);
    }
}
