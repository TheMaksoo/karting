<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Track;
use App\Models\KartingSession;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrackController extends Controller
{
    public function index()
    {
        // Return all tracks without pagination for dropdown/list usage
        $tracks = Track::with('kartingSessions')
            ->withCount('kartingSessions')
            ->get();
        return response()->json($tracks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'track_id' => 'required|string|unique:tracks,track_id',
            'name' => 'required|string|max:255',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'region' => 'nullable|string',
            'distance' => 'nullable|integer',
            'corners' => 'nullable|integer',
            'width' => 'nullable|integer',
            'indoor' => 'sometimes|boolean',
            'features' => 'nullable|array',
            'website' => 'nullable|string',
            'contact' => 'nullable|array',
            'pricing' => 'nullable|array',
            'karts' => 'nullable|array',
        ]);

        $track = Track::create($validated);
        return response()->json($track, 201);
    }

    public function show(string $id)
    {
        $track = Track::with(['kartingSessions.laps'])->findOrFail($id);
        return response()->json($track);
    }

    public function update(Request $request, string $id)
    {
        $track = Track::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'region' => 'nullable|string',
            'distance' => 'nullable|integer',
            'corners' => 'nullable|integer',
            'width' => 'nullable|integer',
            'indoor' => 'sometimes|boolean',
            'features' => 'nullable|array',
            'website' => 'nullable|string',
            'contact' => 'nullable|array',
            'pricing' => 'nullable|array',
            'karts' => 'nullable|array',
        ]);

        $track->update($validated);
        return response()->json($track);
    }

    public function destroy(string $id)
    {
        $track = Track::findOrFail($id);
        $track->delete();
        return response()->json(['message' => 'Track deleted successfully']);
    }

    public function stats(Request $request)
    {
        $driverId = $request->input('driver_id');
        
        // Get allowed driver IDs for the user (user + friends)
        $user = $request->user();
        $allowedDriverIds = $this->getAllowedDriverIds($user);
        
        // Get all tracks
        $tracks = Track::all();

        $stats = $tracks->map(function ($track) use ($driverId, $allowedDriverIds) {
            $sessions = KartingSession::where('track_id', $track->id);
            
            // Filter sessions to only those the driver participated in
            if ($driverId) {
                $sessions = $sessions->whereHas('laps', function($q) use ($driverId) {
                    $q->where('driver_id', $driverId);
                });
            } else {
                // Filter to user + friends only
                $sessions = $sessions->whereHas('laps', function($q) use ($allowedDriverIds) {
                    $q->whereIn('driver_id', $allowedDriverIds);
                });
            }
            
            $sessions = $sessions->get();
            $sessionIds = $sessions->pluck('id');
            
            // Get laps (filtered by driver if provided, or by allowed driver IDs)
            $lapsQuery = Lap::whereIn('karting_session_id', $sessionIds)->with('driver');
            if ($driverId) {
                $lapsQuery->where('driver_id', $driverId);
            } else {
                $lapsQuery->whereIn('driver_id', $allowedDriverIds);
            }
            $laps = $lapsQuery->get();
            
            // Skip tracks with no laps (when filtering)
            if ($laps->count() === 0) {
                return null;
            }
            
            $bestLap = $laps->sortBy('lap_time')->first();
            $allLapTimes = $laps->pluck('lap_time')->filter();
            
            // Calculate average speed properly
            $avgSpeed = null;
            if ($laps->count() > 0 && $track->distance) {
                $speeds = $laps->map(function($lap) use ($track) {
                    return ($track->distance / $lap->lap_time) * 3.6; // m/s to km/h
                });
                $avgSpeed = $speeds->avg();
            }

            return [
                'track_id' => $track->id,
                'track_name' => $track->name,
                'city' => $track->city,
                'country' => $track->country,
                'region' => $track->region,
                'distance' => $track->distance,
                'corners' => $track->corners,
                'indoor' => $track->indoor,
                'latitude' => $track->latitude ? (float)$track->latitude : null,
                'longitude' => $track->longitude ? (float)$track->longitude : null,
                'total_sessions' => $sessions->count(),
                'total_laps' => $laps->count(),
                'unique_drivers' => $laps->pluck('driver_id')->unique()->count(),
                'track_record' => $bestLap ? (float)$bestLap->lap_time : null,
                'record_holder' => $bestLap ? $bestLap->driver->name : null,
                'avg_lap_time' => $allLapTimes->count() > 0 ? (float)$allLapTimes->avg() : null,
                'median_lap_time' => $allLapTimes->count() > 0 ? (float)$allLapTimes->median() : null,
                'avg_speed_kmh' => $avgSpeed ? round($avgSpeed, 2) : null,
                'total_distance_km' => $laps->count() > 0 && $track->distance ? round(($laps->count() * $track->distance) / 1000, 2) : null,
            ];
        })->filter(); // Remove null entries (tracks with no driver data)

        return response()->json($stats->values());
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
