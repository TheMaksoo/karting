<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Friend;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\User;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Get latest activity (recent sessions with results)
     * Shows sessions for the user's account (all linked drivers) and friends' accounts
     */
    public function latestActivity(Request $request)
    {
        $friendsOnly = $request->query('friends_only', false);
        $limit = $request->query('limit', 10);

        $user = $request->user();
        $driverIds = [];

        // Get ALL driver IDs linked to the current user (account = group of drivers)
        $userDriverIds = $this->getUserDriverIds($user);
        $driverIds = array_merge($driverIds, $userDriverIds);

        if ($friendsOnly) {
            // Get friend driver IDs from the friends table
            $friendDriverIds = Friend::where('user_id', $user->id)
                ->where('friendship_status', 'active')
                ->pluck('friend_driver_id')
                ->toArray();

            // For each friend driver, find the user account they belong to
            // and get ALL drivers linked to that user (account = group of drivers)
            $processedUserIds = [];

            foreach ($friendDriverIds as $friendDriverId) {
                // Find user who owns this driver
                $friendUser = User::where('driver_id', $friendDriverId)->first();

                if (! $friendUser) {
                    // Try to find via driver_user pivot table
                    $friendUser = User::whereHas('drivers', function ($q) use ($friendDriverId) {
                        $q->where('drivers.id', $friendDriverId);
                    })->first();
                }

                if ($friendUser && ! in_array($friendUser->id, $processedUserIds)) {
                    $processedUserIds[] = $friendUser->id;
                    $friendAllDriverIds = $this->getUserDriverIds($friendUser);
                    $driverIds = array_merge($driverIds, $friendAllDriverIds);
                } else {
                    // If no user found, just include this single driver
                    $driverIds[] = $friendDriverId;
                }
            }
        }

        // Remove duplicates
        $driverIds = array_unique($driverIds);

        // If no drivers found, return empty
        if (empty($driverIds)) {
            return response()->json([]);
        }

        // Get recent sessions where any of these drivers participated
        $sessionsQuery = KartingSession::with(['track', 'laps.driver'])
            ->whereHas('laps', function ($q) use ($driverIds) {
                $q->whereIn('driver_id', $driverIds);
            })
            ->orderBy('session_date', 'desc')
            ->orderBy('created_at', 'desc');

        $sessions = $sessionsQuery->limit($limit)->get();

        $activities = $sessions->map(function ($session) use ($driverIds) {
            // Get results for drivers we care about in this session
            $bestLaps = Lap::where('karting_session_id', $session->id)
                ->with('driver')
                ->whereIn('driver_id', $driverIds)
                ->where('is_best_lap', true)
                ->orderBy('position')
                ->get();

            // Get positions
            $results = $bestLaps->map(function ($lap) {
                return [
                    'driver_name' => $lap->driver->name,
                    'driver_id' => $lap->driver_id,
                    'position' => $lap->position,
                    'best_lap_time' => (float) $lap->lap_time,
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

    /**
     * Get all driver IDs linked to a user (from both driver_user table and legacy driver_id)
     */
    private function getUserDriverIds(User $user): array
    {
        $driverIds = [];

        // Get drivers from many-to-many relationship
        $linkedDriverIds = $user->drivers()->pluck('drivers.id')->toArray();
        $driverIds = array_merge($driverIds, $linkedDriverIds);

        // Also include legacy driver_id if set
        if ($user->driver_id) {
            $driverIds[] = $user->driver_id;
        }

        return array_unique($driverIds);
    }
}
