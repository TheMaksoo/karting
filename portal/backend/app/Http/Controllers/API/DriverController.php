<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    public function index()
    {
        // Return all drivers without pagination for dropdown/list usage
        $drivers = Driver::withCount('laps')->get();
        
        // Add sessions count manually using a subquery for better performance
        $drivers->each(function ($driver) {
            $driver->sessions_count = $driver->laps()->distinct('karting_session_id')->count('karting_session_id');
        });
        
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
        
        // Build base query
        $query = Driver::query();
        
        if ($driverId) {
            $query->where('id', $driverId);
        } elseif ($friendsOnly) {
            // Keep backward compatibility with friends_only parameter
            $query->whereIn('id', $allowedDriverIds);
        } else {
            // By default, filter to user + friends only
            $query->whereIn('id', $allowedDriverIds);
        }
        
        $drivers = $query->get();

        $stats = $drivers->map(function ($driver) {
            $laps = Lap::where('driver_id', $driver->id)->with('kartingSession.track')->get();
            $bestLap = $laps->where('is_best_lap', true)->first();
            $allLapTimes = $laps->pluck('lap_time')->filter();
            
            // Group laps by track to find track-specific stats
            $trackLaps = $laps->groupBy('kartingSession.track_id');

            return [
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'nickname' => $driver->nickname,
                'display_name' => $driver->nickname ?: $driver->name,
                'color' => $driver->color,
                'total_laps' => $laps->count(),
                'total_sessions' => $laps->pluck('karting_session_id')->unique()->count(),
                'total_tracks' => $trackLaps->count(),
                'best_lap_time' => $bestLap ? (float)$bestLap->lap_time : null,
                'best_lap_track' => $bestLap ? $bestLap->kartingSession->track->name : null,
                'average_lap_time' => $allLapTimes->count() > 0 ? (float)$allLapTimes->avg() : null,
                'median_lap_time' => $allLapTimes->count() > 0 ? (float)$allLapTimes->median() : null,
                'total_cost' => (float)$laps->sum('cost_per_lap'),
                'consistency_score' => null, // Will be calculated on frontend
                'avg_gap_to_record' => null, // Will be calculated on frontend
                'lap_times' => $allLapTimes->values(),
            ];
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
