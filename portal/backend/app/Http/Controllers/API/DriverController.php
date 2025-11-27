<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Lap;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index()
    {
        $drivers = Driver::with('laps')->get();
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
        $drivers = $driverId ? Driver::where('id', $driverId)->get() : Driver::all();

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
}
