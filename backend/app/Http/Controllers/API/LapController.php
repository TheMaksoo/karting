<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lap;
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

        $laps = $query->orderBy('created_at', 'desc')->paginate(50);
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

    public function overview()
    {
        $totalLaps = Lap::count();
        $totalDrivers = Lap::distinct('driver_id')->count('driver_id');
        $bestLapGlobal = Lap::where('is_best_lap', true)->orderBy('lap_time')->with(['driver', 'kartingSession.track'])->first();
        
        $avgLapTime = Lap::avg('lap_time');
        $avgSpeed = Lap::avg('avg_speed');
        
        return response()->json([
            'total_laps' => $totalLaps,
            'total_drivers' => $totalDrivers,
            'best_lap' => $bestLapGlobal,
            'average_lap_time' => $avgLapTime,
            'average_speed' => $avgSpeed,
        ]);
    }
}
