<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lap;
use App\Models\KartingSession;
use Illuminate\Http\Request;

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
            $query->whereHas('kartingSession', function($q) use ($request) {
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

    public function overview(Request $request)
    {
        // Get driver_id from request (for logged-in driver filtering)
        $driverId = $request->input('driver_id');
        
        // Base query for laps
        $lapQuery = Lap::query();
        if ($driverId) {
            $lapQuery->where('driver_id', $driverId);
        }
        
        $totalLaps = $lapQuery->count();
        $totalDrivers = Lap::distinct('driver_id')->count('driver_id');
        
        // Best lap for this driver (or global)
        $bestLapQuery = Lap::where('is_best_lap', true)->orderBy('lap_time')->with(['driver', 'kartingSession.track']);
        if ($driverId) {
            $bestLapQuery->where('driver_id', $driverId);
        }
        $bestLapGlobal = $bestLapQuery->first();
        
        // Average lap time and speed
        $avgLapTime = (clone $lapQuery)->avg('lap_time');
        
        // Median lap time
        $allLapTimes = (clone $lapQuery)->pluck('lap_time')->sort()->values();
        $medianLapTime = null;
        if ($allLapTimes->count() > 0) {
            $mid = (int)floor($allLapTimes->count() / 2);
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
            $sessionQuery->whereHas('laps', function($q) use ($driverId) {
                $q->where('driver_id', $driverId);
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
}
