<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
            'track_id' => 'nullable|string|unique:tracks,track_id',
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

        // Auto-generate track_id if not provided
        if (empty($validated['track_id'])) {
            $validated['track_id'] = \Illuminate\Support\Str::slug($validated['name'] . '-' . uniqid());
        }

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

        // Create cache key based on filters
        $cacheKey = 'track_stats_' . $user->id . '_' . ($driverId ?? 'all');

        // Cache for 5 minutes
        $stats = Cache::remember($cacheKey, 300, function () use ($driverId, $allowedDriverIds) {
            // Get all tracks with eager loading
            $tracks = Track::all();

            // Build driver filter
            $filterDriverIds = $driverId ? [$driverId] : $allowedDriverIds;

            // Fetch all relevant laps in ONE query with eager loading
            $allLaps = Lap::whereIn('driver_id', $filterDriverIds)
                ->with(['kartingSession.track', 'driver'])
                ->get()
                ->groupBy(fn ($lap) => $lap->kartingSession?->track_id);

            // Get session counts by track using aggregation
            $sessionCounts = KartingSession::whereHas('laps', function ($q) use ($filterDriverIds) {
                $q->whereIn('driver_id', $filterDriverIds);
            })
                ->select('track_id', DB::raw('COUNT(*) as count'))
                ->groupBy('track_id')
                ->pluck('count', 'track_id');

            return $tracks->map(function ($track) use ($allLaps, $sessionCounts) {
                $laps = $allLaps->get($track->id, collect());

                // Skip tracks with no laps
                if ($laps->count() === 0) {
                    return null;
                }

                $bestLap = $laps->sortBy('lap_time')->first();
                $allLapTimes = $laps->pluck('lap_time')->filter();

                // Calculate average speed
                $avgSpeed = null;

                if ($laps->count() > 0 && $track->distance) {
                    $speeds = $laps->map(fn ($lap) => ($track->distance / $lap->lap_time) * 3.6);
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
                    'latitude' => $track->latitude ? (float) $track->latitude : null,
                    'longitude' => $track->longitude ? (float) $track->longitude : null,
                    'total_sessions' => $sessionCounts->get($track->id, 0),
                    'total_laps' => $laps->count(),
                    'unique_drivers' => $laps->pluck('driver_id')->unique()->count(),
                    'track_record' => $bestLap ? (float) $bestLap->lap_time : null,
                    'record_holder' => $bestLap?->driver?->name,
                    'avg_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->avg() : null,
                    'median_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->median() : null,
                    'avg_speed_kmh' => $avgSpeed ? round($avgSpeed, 2) : null,
                    'total_distance_km' => $laps->count() > 0 && $track->distance
                        ? round(($laps->count() * $track->distance) / 1000, 2)
                        : null,
                ];
            })->filter()->values();
        });

        return response()->json($stats);
    }

    /**
     * Get allowed driver IDs for the authenticated user (user's own drivers + friends' drivers)
     * Account = group of drivers. Friends are linked via a driver, but we include ALL of that friend's drivers.
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

        // Get friend driver IDs and expand to include all drivers of each friend's account
        $friendDriverIds = DB::table('friends')
            ->where('user_id', $user->id)
            ->where('friendship_status', 'active')
            ->pluck('friend_driver_id')
            ->toArray();

        // For each friend driver, find their user account and get ALL their linked drivers
        $processedUserIds = [];

        foreach ($friendDriverIds as $friendDriverId) {
            // Find user who owns this driver (via legacy driver_id)
            $friendUser = \App\Models\User::where('driver_id', $friendDriverId)->first();

            if (! $friendUser) {
                // Try to find via driver_user pivot table
                $friendUser = \App\Models\User::whereHas('drivers', function ($q) use ($friendDriverId) {
                    $q->where('drivers.id', $friendDriverId);
                })->first();
            }

            if ($friendUser && ! in_array($friendUser->id, $processedUserIds)) {
                $processedUserIds[] = $friendUser->id;

                // Get all drivers linked to this friend's account
                if ($friendUser->driver_id) {
                    $driverIds[] = $friendUser->driver_id;
                }
                $friendConnectedDriverIds = DB::table('driver_user')
                    ->where('user_id', $friendUser->id)
                    ->pluck('driver_id')
                    ->toArray();
                $driverIds = array_merge($driverIds, $friendConnectedDriverIds);
            } else {
                // If no user found, just include this single driver
                $driverIds[] = $friendDriverId;
            }
        }

        return array_unique($driverIds);
    }
}
