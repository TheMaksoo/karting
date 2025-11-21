<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Track;
use App\Models\KartingSession;
use App\Models\Lap;
use Illuminate\Http\Request;

class TrackController extends Controller
{
    public function index()
    {
        $tracks = Track::with('kartingSessions')->get();
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
        $tracks = Track::all();

        $stats = $tracks->map(function ($track) {
            $sessions = KartingSession::where('track_id', $track->id)->get();
            $sessionIds = $sessions->pluck('id');
            $laps = Lap::whereIn('karting_session_id', $sessionIds)->with('driver')->get();
            
            $bestLap = $laps->sortBy('lap_time')->first();
            $allLapTimes = $laps->pluck('lap_time')->filter();

            return [
                'track' => [
                    'id' => $track->id,
                    'track_id' => $track->track_id,
                    'name' => $track->name,
                    'city' => $track->city,
                    'country' => $track->country,
                    'distance' => $track->distance,
                    'corners' => $track->corners,
                    'indoor' => $track->indoor,
                ],
                'total_sessions' => $sessions->count(),
                'total_laps' => $laps->count(),
                'unique_drivers' => $laps->pluck('driver_id')->unique()->count(),
                'best_lap_time' => $bestLap ? $bestLap->lap_time : null,
                'best_lap_driver' => $bestLap ? $bestLap->driver->name : null,
                'average_lap_time' => $allLapTimes->avg(),
                'median_lap_time' => $allLapTimes->median(),
                'fastest_speed' => $laps->max('avg_speed'),
            ];
        });

        return response()->json($stats);
    }
}
