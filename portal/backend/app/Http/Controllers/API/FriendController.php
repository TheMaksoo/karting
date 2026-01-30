<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\Friend;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class FriendController extends Controller
{
    /**
     * Get all friends for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Get pagination parameters
            $perPage = $request->input('per_page', 50);

            $friendsQuery = Friend::where('user_id', $user->id)
                ->where('friendship_status', 'active')
                ->with('driver')
                ->orderBy('created_at', 'desc');

            // Handle pagination if requested
            if ($request->has('paginate') && $request->input('paginate') === 'true') {
                $friends = $friendsQuery->paginate($perPage);

                return response()->json([
                    'data' => $friends->map(function ($friend) {
                        // Handle case where driver might be null (orphaned relationship)
                        if (! $friend->driver) {
                            Log::warning("Friend ID {$friend->id} references deleted driver {$friend->friend_driver_id}");

                            return null;
                        }

                        return [
                            'id' => $friend->id,
                            'driver_id' => $friend->friend_driver_id,
                            'name' => $friend->driver->name,
                            'added_at' => $friend->created_at->format('Y-m-d H:i:s'),
                        ];
                    })->filter(), // Remove null entries
                    'current_page' => $friends->currentPage(),
                    'last_page' => $friends->lastPage(),
                    'per_page' => $friends->perPage(),
                    'total' => $friends->total(),
                ]);
            }

            // Default: return all friends without pagination
            $friends = $friendsQuery->get()
                ->map(function ($friend) {
                    // Handle case where driver might be null (orphaned relationship)
                    if (! $friend->driver) {
                        Log::warning("Friend ID {$friend->id} references deleted driver {$friend->friend_driver_id}");

                        return null;
                    }

                    return [
                        'id' => $friend->id,
                        'driver_id' => $friend->friend_driver_id,
                        'name' => $friend->driver->name,
                        'added_at' => $friend->created_at->format('Y-m-d H:i:s'),
                    ];
                })
                ->filter() // Remove null entries
                ->values(); // Re-index array

            return response()->json($friends);
        } catch (\Exception $e) {
            Log::error('Error loading friends: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            $response = [
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Failed to load friends',
            ];

            return response()->json($response, 500);
        }
    }

    /**
     * Add a friend by driver ID
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'driver_id' => 'required|integer|exists:drivers,id',
            ]);

            $user = $request->user();

            // Check if trying to add self
            $userDriverIds = $user->drivers()->pluck('drivers.id')->toArray();

            if ($user->driver_id) {
                $userDriverIds[] = $user->driver_id;
            }

            if (in_array($validated['driver_id'], $userDriverIds)) {
                Log::info("User {$user->id} attempted to add their own driver {$validated['driver_id']} as friend");

                return response()->json([
                    'success' => false,
                    'message' => 'You cannot add your own driver as a friend',
                ], 400);
            }

            // Check if already friends
            $existing = Friend::where('user_id', $user->id)
                ->where('friend_driver_id', $validated['driver_id'])
                ->first();

            if ($existing) {
                Log::info("User {$user->id} attempted to add existing friend driver {$validated['driver_id']}");

                return response()->json([
                    'success' => false,
                    'message' => 'This driver is already in your friends list',
                ], 400);
            }

            $friend = Friend::create([
                'user_id' => $user->id,
                'friend_driver_id' => $validated['driver_id'],
                'friendship_status' => 'active',
            ]);

            $friend->load('driver');

            // Handle case where driver might be deleted between validation and loading
            if (! $friend->driver) {
                $friend->delete();
                Log::error("Driver {$validated['driver_id']} was deleted after friend creation");

                return response()->json([
                    'success' => false,
                    'message' => 'Driver not found',
                ], 404);
            }

            Log::info("User {$user->id} added driver {$validated['driver_id']} as friend");

            return response()->json([
                'success' => true,
                'message' => 'Friend added successfully',
                'friend' => [
                    'id' => $friend->id,
                    'driver_id' => $friend->friend_driver_id,
                    'name' => $friend->driver->name,
                    'added_at' => $friend->created_at->format('Y-m-d H:i:s'),
                ],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error adding friend: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'driver_id' => $request->input('driver_id'),
                'trace' => $e->getTraceAsString(),
            ]);

            $response = [
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Failed to add friend',
            ];

            return response()->json($response, 500);
        }
    }

    /**
     * Remove a friend
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();

            $friend = Friend::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (! $friend) {
                Log::warning("User {$user->id} attempted to remove non-existent friend {$id}");

                return response()->json([
                    'success' => false,
                    'message' => 'Friend not found or you do not have permission to remove this friend',
                ], 404);
            }

            $driverName = $friend->driver ? $friend->driver->name : 'Unknown Driver';
            $friend->delete();

            Log::info("User {$user->id} removed friend {$id} (driver: {$driverName})");

            return response()->json([
                'success' => true,
                'message' => 'Friend removed successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error removing friend: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'friend_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            $response = [
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Failed to remove friend',
            ];

            return response()->json($response, 500);
        }
    }

    /**
     * Get friend IDs for filtering (including all user's connected drivers)
     */
    public function getFriendDriverIds(Request $request)
    {
        try {
            $user = $request->user();

            $friendIds = Friend::where('user_id', $user->id)
                ->where('friendship_status', 'active')
                ->pluck('friend_driver_id')
                ->toArray();

            // Include ALL user's connected drivers from driver_user pivot table
            $userDriverIds = $user->drivers()->pluck('drivers.id')->toArray();

            // Also include legacy driver_id if exists
            if ($user->driver_id) {
                $userDriverIds[] = $user->driver_id;
            }

            // Merge and remove duplicates
            $allExcludedIds = array_values(array_unique(array_merge($friendIds, $userDriverIds)));

            return response()->json($allExcludedIds);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve friend driver IDs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Failed to retrieve friend driver IDs'], 500);
        }
    }

    private function oldGetFriendDriverIds(Request $request)
    {
        try {
            $user = $request->user();

            $friendIds = Friend::where('user_id', $user->id)
                ->where('friendship_status', 'active')
                ->pluck('friend_driver_id')
                ->toArray();

            // Include ALL user's connected drivers from driver_user pivot table
            $userDriverIds = $user->drivers()->pluck('drivers.id')->toArray();

            // Also include legacy driver_id if exists
            if ($user->driver_id) {
                $userDriverIds[] = $user->driver_id;
            }

            // Merge and remove duplicates
            $allExcludedIds = array_unique(array_merge($friendIds, $userDriverIds));

            Log::debug("Retrieved friend driver IDs for user {$user->id}", [
                'friend_ids' => $friendIds,
                'user_driver_ids' => $userDriverIds,
                'all_excluded_ids' => $allExcludedIds,
            ]);

            return response()->json([
                'success' => true,
                'driver_ids' => $allExcludedIds,
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving friend driver IDs: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString(),
            ]);

            $response = [
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Failed to retrieve friend driver IDs',
                'driver_ids' => [],
            ];

            return response()->json($response, 500);
        }
    }
}
