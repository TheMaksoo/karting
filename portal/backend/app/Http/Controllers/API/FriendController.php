<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Friend;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FriendController extends Controller
{
    /**
     * Get all friends for the authenticated user
     */
    public function index()
    {
        $user = Auth::user();
        
        $friends = Friend::where('user_id', $user->id)
            ->where('friendship_status', 'active')
            ->with('driver')
            ->get()
            ->map(function ($friend) {
                return [
                    'id' => $friend->id,
                    'driver_id' => $friend->friend_driver_id,
                    'name' => $friend->driver->name,
                    'added_at' => $friend->created_at->format('Y-m-d H:i:s'),
                ];
            });
        
        return response()->json($friends);
    }

    /**
     * Add a friend by driver ID
     */
    public function store(Request $request)
    {
        $request->validate([
            'driver_id' => 'required|exists:drivers,id',
        ]);

        $user = Auth::user();

        // Check if already friends
        $existing = Friend::where('user_id', $user->id)
            ->where('friend_driver_id', $request->driver_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Driver is already in your friends list',
            ], 400);
        }

        $friend = Friend::create([
            'user_id' => $user->id,
            'friend_driver_id' => $request->driver_id,
            'friendship_status' => 'active',
        ]);

        $friend->load('driver');

        return response()->json([
            'success' => true,
            'friend' => [
                'id' => $friend->id,
                'driver_id' => $friend->friend_driver_id,
                'name' => $friend->driver->name,
                'added_at' => $friend->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Remove a friend
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        $friend = Friend::where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$friend) {
            return response()->json([
                'success' => false,
                'message' => 'Friend not found',
            ], 404);
        }

        $friend->delete();

        return response()->json([
            'success' => true,
            'message' => 'Friend removed successfully',
        ]);
    }

    /**
     * Get friend IDs for filtering (including user's own driver)
     */
    public function getFriendDriverIds()
    {
        $user = Auth::user();
        
        $friendIds = Friend::where('user_id', $user->id)
            ->where('friendship_status', 'active')
            ->pluck('friend_driver_id')
            ->toArray();

        // Include user's own driver ID
        if ($user->driver_id) {
            $friendIds[] = $user->driver_id;
        }

        return response()->json(['driver_ids' => $friendIds]);
    }
}
