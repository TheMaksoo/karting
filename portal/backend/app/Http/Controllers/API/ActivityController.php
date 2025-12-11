<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lap;
use App\Models\KartingSession;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Get latest activity (recent sessions with results)
     */
    public function latestActivity(Request $request)
    {
        $friendsOnly = $request->query('friends_only', false);
        $limit = $request->query('limit', 10);
        
        // Get driver IDs to filter by
        $driverIds = null;
        if ($friendsOnly) {
            $user = $request->user();
            $driverIds = \App\Models\Friend::where('user_id', $user->id)
                ->where('friendship_status', 'active')
                ->pluck('friend_driver_id')
                ->toArray();
            
            if ($user->driver_id) {
                $driverIds[] = $user->driver_id;
            }
        }
        
        // Get recent sessions
        $sessionsQuery = KartingSession::with(['track', 'laps.driver'])
            ->orderBy('session_date', 'desc')
            ->orderBy('created_at', 'desc');
        
        if ($driverIds) {
            $sessionsQuery->whereHas('laps', function($q) use ($driverIds) {
                $q->whereIn('driver_id', $driverIds);
            });
        }
        
        $sessions = $sessionsQuery->limit($limit)->get();
        
        $activities = $sessions->map(function ($session) use ($driverIds) {
            // Get results for this session (filtered by friends if needed)
            $lapsQuery = Lap::where('karting_session_id', $session->id)
                ->with('driver')
                ->orderBy('position');
            
            if ($driverIds) {
                $lapsQuery->whereIn('driver_id', $driverIds);
            }
            
            $bestLaps = $lapsQuery->where('is_best_lap', true)->get();
            
            // Get positions
            $results = $bestLaps->map(function($lap) {
                return [
                    'driver_name' => $lap->driver->name,
                    'driver_id' => $lap->driver_id,
                    'position' => $lap->position,
                    'best_lap_time' => (float)$lap->lap_time,
                ];
            })->sortBy('position')->values();
            
            return [
                'session_id' => $session->id,
                'track_name' => $session->track->name,
                'track_id' => $session->track_id,
                'session_date' => $session->session_date,
                'session_type' => $session->session_type,
                'results' => $results,
                'total_drivers' => $results->count(),
            ];
        });
        
        return response()->json($activities);
    }
}
