<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\KartingSession;
use App\Models\Lap;
use Illuminate\Http\Request;

class KartingSessionController extends Controller
{
    public function index(Request $request)
    {
        $query = KartingSession::with(['track', 'laps.driver']);
        
        if ($request->has('track_id')) {
            $query->where('track_id', $request->track_id);
        }
        
        $sessions = $query->orderBy('session_date', 'desc')->paginate(20);
        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'track_id' => 'required|exists:tracks,id',
            'session_date' => 'required|date',
            'session_time' => 'nullable|date_format:H:i',
            'session_type' => 'required|string',
            'heat' => 'sometimes|integer',
            'weather' => 'nullable|string',
            'source' => 'nullable|string',
            'heat_price' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $session = KartingSession::create($validated);
        return response()->json($session, 201);
    }

    public function show(string $id)
    {
        $session = KartingSession::with(['track', 'laps.driver'])->findOrFail($id);
        return response()->json($session);
    }

    public function update(Request $request, string $id)
    {
        $session = KartingSession::findOrFail($id);
        
        $validated = $request->validate([
            'session_date' => 'sometimes|date',
            'session_time' => 'nullable|date_format:H:i',
            'session_type' => 'sometimes|string',
            'heat' => 'sometimes|integer',
            'weather' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $session->update($validated);
        return response()->json($session);
    }

    public function destroy(string $id)
    {
        $session = KartingSession::findOrFail($id);
        $session->delete();
        return response()->json(['message' => 'Session deleted successfully']);
    }

    public function laps(string $id)
    {
        $session = KartingSession::findOrFail($id);
        $laps = $session->laps()->with('driver')->orderBy('lap_number')->get();
        
        return response()->json($laps);
    }
}
