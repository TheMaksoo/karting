<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\KartingSession;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LapController extends Controller
{
    public function index(Request $request)
    {
        $query = Lap::with(['driver', 'kartingSession.track']);

        if ($request->has('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        if ($request->has('session_id')) {
            $query->where('karting_session_id', $request->session_id);
        }

        if ($request->has('track_id')) {
            $query->whereHas('kartingSession', function ($q) use ($request) {
                $q->where('track_id', $request->track_id);
            });
        }

        // Default ordering: Session → Driver → Lap Number
        $query->orderBy('karting_session_id', 'desc')
            ->orderBy('driver_id', 'asc')
            ->orderBy('lap_number', 'asc');

        $perPage = $request->get('per_page', 25);
        $laps = $query->paginate($perPage);

        return response()->json($laps);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'karting_session_id' => 'required|exists:karting_sessions,id',
            'driver_id' => 'required|exists:drivers,id',
            'lap_number' => 'required|integer',
            'lap_time' => 'required|numeric',
            'position' => 'nullable|integer',
            'sector1' => 'nullable|numeric',
            'sector2' => 'nullable|numeric',
            'sector3' => 'nullable|numeric',
            'is_best_lap' => 'sometimes|boolean',
            'gap_to_best_lap' => 'nullable|numeric',
            'interval' => 'nullable|numeric',
            'gap_to_previous' => 'nullable|numeric',
            'avg_speed' => 'nullable|numeric',
            'kart_number' => 'nullable|string',
            'tyre' => 'nullable|string',
            'cost_per_lap' => 'nullable|numeric',
        ]);

        $lap = Lap::create($validated);

        return response()->json($lap, 201);
    }

    public function show(string $id)
    {
        $lap = Lap::with(['driver', 'kartingSession.track'])->findOrFail($id);

        return response()->json($lap);
    }

    public function update(Request $request, string $id)
    {
        $lap = Lap::findOrFail($id);

        $validated = $request->validate([
            'lap_time' => 'sometimes|numeric',
            'position' => 'nullable|integer',
            'is_best_lap' => 'sometimes|boolean',
        ]);

        $lap->update($validated);

        return response()->json($lap);
    }

    public function destroy(string $id)
    {
        $lap = Lap::findOrFail($id);
        $lap->delete();

        return response()->json(['message' => 'Lap deleted successfully']);
    }

    public function byDriver(string $driverId)
    {
        $laps = Lap::where('driver_id', $driverId)
            ->with(['kartingSession.track'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($laps);
    }

    public function count(Request $request)
    {
        $total = Lap::count();

        return response()->json(['total' => $total]);
    }

    public function databaseMetrics(Request $request)
    {
        // Count rows in each table
        $lapsCount = \DB::table('laps')->count();
        $sessionsCount = \DB::table('karting_sessions')->count();
        $driversCount = \DB::table('drivers')->count();
        $tracksCount = \DB::table('tracks')->count();
        $usersCount = \DB::table('users')->count();
        $uploadsCount = \DB::table('uploads')->count();
        $friendsCount = \DB::table('friends')->count();
        $userTrackNicknamesCount = \DB::table('user_track_nicknames')->count();
        $settingsCount = \DB::table('settings')->count();
        $styleVariablesCount = \DB::table('style_variables')->count();

        // Define field counts per table (actual database schema)
        $fieldsPerTable = [
            'laps' => 19, // id, driver_id, karting_session_id, lap_number, lap_time, position, kart_number, sector1, sector2, sector3, is_best_lap, gap_to_best_lap, interval, gap_to_previous, avg_speed, cost_per_lap, tyre, created_at, updated_at
            'karting_sessions' => 13, // id, track_id, session_date, session_number, session_type, heat_price, file_name, file_hash, best_lap_time, total_laps, drivers_count, created_at, updated_at
            'drivers' => 7, // id, name, email, nickname, color, created_at, updated_at
            'tracks' => 17, // id, name, city, country, distance, corners, width, elevation_change, record_lap_time, features, pricing, contact, coordinates, description, record_holder, created_at, updated_at
            'users' => 10, // id, name, email, email_verified_at, password, role, driver_id, must_change_password, remember_token, created_at, updated_at (11 if including updated_at)
            'uploads' => 12, // id, file_name, file_hash, upload_date, session_date, track_id, laps_count, drivers_count, status, file_path, metadata, created_at, updated_at
            'friends' => 5, // id, user_id, friend_driver_id, created_at, updated_at
            'user_track_nicknames' => 5, // id, user_id, track_id, nickname, created_at, updated_at
            'settings' => 6, // id, key, value, type, description, created_at, updated_at
            'style_variables' => 6, // id, variable_name, value, default_value, category, description, created_at, updated_at (8 if including timestamps)
        ];

        // Calculate total data points (rows × fields for each table)
        $totalDataPoints =
            ($lapsCount * $fieldsPerTable['laps']) +
            ($sessionsCount * $fieldsPerTable['karting_sessions']) +
            ($driversCount * $fieldsPerTable['drivers']) +
            ($tracksCount * $fieldsPerTable['tracks']) +
            ($usersCount * $fieldsPerTable['users']) +
            ($uploadsCount * $fieldsPerTable['uploads']) +
            ($friendsCount * $fieldsPerTable['friends']) +
            ($userTrackNicknamesCount * $fieldsPerTable['user_track_nicknames']) +
            ($settingsCount * $fieldsPerTable['settings']) +
            ($styleVariablesCount * $fieldsPerTable['style_variables']);

        return response()->json([
            'total_data_points' => $totalDataPoints,
            'breakdown' => [
                'laps' => [
                    'rows' => $lapsCount,
                    'fields' => $fieldsPerTable['laps'],
                    'data_points' => $lapsCount * $fieldsPerTable['laps'],
                ],
                'sessions' => [
                    'rows' => $sessionsCount,
                    'fields' => $fieldsPerTable['karting_sessions'],
                    'data_points' => $sessionsCount * $fieldsPerTable['karting_sessions'],
                ],
                'drivers' => [
                    'rows' => $driversCount,
                    'fields' => $fieldsPerTable['drivers'],
                    'data_points' => $driversCount * $fieldsPerTable['drivers'],
                ],
                'tracks' => [
                    'rows' => $tracksCount,
                    'fields' => $fieldsPerTable['tracks'],
                    'data_points' => $tracksCount * $fieldsPerTable['tracks'],
                ],
                'users' => [
                    'rows' => $usersCount,
                    'fields' => $fieldsPerTable['users'],
                    'data_points' => $usersCount * $fieldsPerTable['users'],
                ],
                'uploads' => [
                    'rows' => $uploadsCount,
                    'fields' => $fieldsPerTable['uploads'],
                    'data_points' => $uploadsCount * $fieldsPerTable['uploads'],
                ],
                'friends' => [
                    'rows' => $friendsCount,
                    'fields' => $fieldsPerTable['friends'],
                    'data_points' => $friendsCount * $fieldsPerTable['friends'],
                ],
                'user_track_nicknames' => [
                    'rows' => $userTrackNicknamesCount,
                    'fields' => $fieldsPerTable['user_track_nicknames'],
                    'data_points' => $userTrackNicknamesCount * $fieldsPerTable['user_track_nicknames'],
                ],
                'settings' => [
                    'rows' => $settingsCount,
                    'fields' => $fieldsPerTable['settings'],
                    'data_points' => $settingsCount * $fieldsPerTable['settings'],
                ],
                'style_variables' => [
                    'rows' => $styleVariablesCount,
                    'fields' => $fieldsPerTable['style_variables'],
                    'data_points' => $styleVariablesCount * $fieldsPerTable['style_variables'],
                ],
            ],
        ]);
    }

    public function overview(Request $request)
    {
        // Get driver_id from request (for logged-in driver filtering)
        $driverId = $request->input('driver_id');

        // Get allowed driver IDs for the user (user + friends)
        $user = $request->user();
        $allowedDriverIds = $this->getAllowedDriverIds($user);

        // Base query for laps
        $lapQuery = Lap::query();

        if ($driverId) {
            $lapQuery->where('driver_id', $driverId);
        } else {
            // Filter to user + friends only
            $lapQuery->whereIn('driver_id', $allowedDriverIds);
        }

        $totalLaps = $lapQuery->count();

        // Count distinct drivers from allowed list only
        $totalDrivers = $driverId
            ? 1
            : Lap::whereIn('driver_id', $allowedDriverIds)->distinct('driver_id')->count('driver_id');

        // Best lap for this driver (or from allowed drivers)
        $bestLapQuery = Lap::where('is_best_lap', true)->orderBy('lap_time')->with(['driver', 'kartingSession.track']);

        if ($driverId) {
            $bestLapQuery->where('driver_id', $driverId);
        } else {
            $bestLapQuery->whereIn('driver_id', $allowedDriverIds);
        }
        $bestLapGlobal = $bestLapQuery->first();

        // Average lap time and speed
        $avgLapTime = (clone $lapQuery)->avg('lap_time');

        // Median lap time
        $allLapTimes = (clone $lapQuery)->pluck('lap_time')->sort()->values();
        $medianLapTime = null;

        if ($allLapTimes->count() > 0) {
            $mid = (int) floor($allLapTimes->count() / 2);

            if ($allLapTimes->count() % 2 == 0) {
                $medianLapTime = ($allLapTimes[$mid - 1] + $allLapTimes[$mid]) / 2;
            } else {
                $medianLapTime = $allLapTimes[$mid];
            }
        }

        // Calculate average speed properly: avg(distance / lap_time)
        $lapsWithSpeed = (clone $lapQuery)
            ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
            ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
            ->selectRaw('(tracks.distance / laps.lap_time) as speed_mps')
            ->get();

        $avgSpeedMps = $lapsWithSpeed->avg('speed_mps');
        $avgSpeedKmh = $avgSpeedMps ? round($avgSpeedMps * 3.6, 2) : 0;

        // Calculate total distance (sum of laps × track distance)
        $totalDistanceQuery = (clone $lapQuery)
            ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
            ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
            ->selectRaw('SUM(tracks.distance) as total');
        $totalDistance = $totalDistanceQuery->value('total');
        $totalDistanceKm = $totalDistance ? round($totalDistance / 1000, 2) : 0;

        // Calculate total corners (sum of laps × track corners)
        $totalCornersQuery = (clone $lapQuery)
            ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
            ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
            ->selectRaw('SUM(tracks.corners) as total');
        $totalCorners = $totalCornersQuery->value('total');

        // Get sessions for this driver
        $sessionQuery = KartingSession::query();

        if ($driverId) {
            $sessionQuery->whereHas('laps', function ($q) use ($driverId) {
                $q->where('driver_id', $driverId);
            });
        } else {
            $sessionQuery->whereHas('laps', function ($q) use ($allowedDriverIds) {
                $q->whereIn('driver_id', $allowedDriverIds);
            });
        }

        // Calculate total cost (sum of heat_price from sessions)
        $totalCost = (clone $sessionQuery)->sum('heat_price');

        // Calculate cost per lap
        $costPerLap = $totalLaps > 0 ? round($totalCost / $totalLaps, 2) : 0;

        // Calculate cost per km
        $costPerKm = $totalDistanceKm > 0 ? round($totalCost / $totalDistanceKm, 2) : 0;

        // Calculate total sessions
        $totalSessions = $sessionQuery->count();

        // Calculate cost per session
        $costPerSession = $totalSessions > 0 ? round($totalCost / $totalSessions, 2) : 0;

        // Calculate CO₂ emissions (rough estimate: 0.15 kg per km for electric karts, 0.25 for gas)
        // Using average of 0.2 kg/km
        $co2Emissions = round($totalDistanceKm * 0.2, 2);

        // Get unique tracks count
        $uniqueTracks = (clone $lapQuery)
            ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
            ->distinct('karting_sessions.track_id')
            ->count('karting_sessions.track_id');

        return response()->json([
            'total_laps' => $totalLaps,
            'total_drivers' => $totalDrivers,
            'best_lap' => $bestLapGlobal,
            'average_lap_time' => $avgLapTime,
            'median_lap_time' => $medianLapTime,
            'average_speed_kmh' => $avgSpeedKmh,
            'total_distance_km' => $totalDistanceKm,
            'total_corners' => $totalCorners ?? 0,
            'total_cost' => round($totalCost, 2),
            'cost_per_lap' => $costPerLap,
            'cost_per_km' => $costPerKm,
            'total_sessions' => $totalSessions,
            'cost_per_session' => $costPerSession,
            'co2_emissions_kg' => $co2Emissions,
            'unique_tracks' => $uniqueTracks,
        ]);
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
