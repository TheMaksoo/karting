<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\UserTrackNickname;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserSettingsController extends Controller
{
    /**
     * Get user settings including display name and track nicknames
     */
    public function index()
    {
        $user = Auth::user();
        
        $trackNicknames = UserTrackNickname::where('user_id', $user->id)
            ->with('track:id,name')
            ->get()
            ->map(function ($tn) {
                return [
                    'id' => $tn->id,
                    'track_id' => $tn->track_id,
                    'track_name' => $tn->track->name,
                    'nickname' => $tn->nickname,
                ];
            });

        return response()->json([
            'display_name' => $user->display_name,
            'track_nicknames' => $trackNicknames,
        ]);
    }

    /**
     * Update display name
     */
    public function updateDisplayName(Request $request)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
        ]);

        $user = Auth::user();
        $user->update(['display_name' => $request->display_name]);

        return response()->json([
            'success' => true,
            'display_name' => $user->display_name,
        ]);
    }

    /**
     * Add or update track nickname
     */
    public function setTrackNickname(Request $request)
    {
        $request->validate([
            'track_id' => 'required|exists:tracks,id',
            'nickname' => 'required|string|max:255',
        ]);

        $user = Auth::user();

        $trackNickname = UserTrackNickname::updateOrCreate(
            [
                'user_id' => $user->id,
                'track_id' => $request->track_id,
            ],
            [
                'nickname' => $request->nickname,
            ]
        );

        $trackNickname->load('track:id,name');

        return response()->json([
            'success' => true,
            'track_nickname' => [
                'id' => $trackNickname->id,
                'track_id' => $trackNickname->track_id,
                'track_name' => $trackNickname->track->name,
                'nickname' => $trackNickname->nickname,
            ],
        ]);
    }

    /**
     * Delete track nickname
     */
    public function deleteTrackNickname($id)
    {
        $user = Auth::user();
        
        $trackNickname = UserTrackNickname::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$trackNickname) {
            return response()->json([
                'success' => false,
                'message' => 'Track nickname not found',
            ], 404);
        }

        $trackNickname->delete();

        return response()->json([
            'success' => true,
            'message' => 'Track nickname deleted successfully',
        ]);
    }
}
