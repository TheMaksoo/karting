<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserManagementController extends Controller
{
    /**
     * Get all users with their connected drivers
     */
    public function index()
    {
        $users = User::with(['drivers' => function ($query) {
            $query->withCount('laps');
        }])
            ->withCount('drivers')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'driver_id' => $user->driver_id,
                    'drivers_count' => $user->drivers_count,
                    'drivers' => $user->drivers->map(function ($driver) {
                        return [
                            'id' => $driver->id,
                            'name' => $driver->name,
                            'nickname' => $driver->nickname,
                            'color' => $driver->color,
                            'laps_count' => $driver->laps_count,
                            'is_primary' => $driver->pivot->is_primary ?? false,
                        ];
                    }),
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json($users);
    }

    /**
     * Create a new user
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', Password::defaults()],
            'role' => 'required|in:admin,driver',
            'driver_ids' => 'array',
            'driver_ids.*' => 'exists:drivers,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'must_change_password' => true,
        ]);

        // Connect drivers if provided
        if ($request->has('driver_ids') && ! empty($request->driver_ids)) {
            foreach ($request->driver_ids as $index => $driverId) {
                $user->drivers()->attach($driverId, [
                    'is_primary' => $index === 0, // First driver is primary
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Set first driver as user's driver_id
            $user->driver_id = $request->driver_ids[0];
            $user->save();
        }

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('drivers'),
        ], 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:users,email,' . $id,
            'role' => 'in:admin,driver',
            'password' => ['nullable', Password::defaults()],
        ]);

        $data = $request->only(['name', 'email', 'role']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load('drivers'),
        ]);
    }

    /**
     * Delete user
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Don't allow deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Cannot delete your own account',
            ], 400);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Connect a driver to a user
     */
    public function connectDriver(Request $request, $userId, $driverId)
    {
        $user = User::findOrFail($userId);
        $driver = Driver::findOrFail($driverId);

        // Check if already connected
        if ($user->drivers()->where('driver_id', $driverId)->exists()) {
            return response()->json([
                'message' => 'Driver already connected to this user',
            ], 409);
        }

        // If this is the first driver, make it primary
        $isPrimary = $user->drivers()->count() === 0;

        $user->drivers()->attach($driverId, [
            'is_primary' => $isPrimary,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // If primary, update user's driver_id
        if ($isPrimary) {
            $user->driver_id = $driverId;
            $user->save();
        }

        return response()->json([
            'message' => 'Driver connected successfully',
        ]);
    }

    /**
     * Disconnect a driver from a user
     */
    public function disconnectDriver($userId, $driverId)
    {
        $user = User::findOrFail($userId);

        if (! $user->drivers()->where('driver_id', $driverId)->exists()) {
            return response()->json([
                'message' => 'Driver not connected to this user',
            ], 404);
        }

        $user->drivers()->detach($driverId);

        // If this was the primary driver, clear user's driver_id
        if ($user->driver_id == $driverId) {
            // Set another driver as primary if available
            $nextDriver = $user->drivers()->first();

            if ($nextDriver) {
                DB::table('driver_user')
                    ->where('user_id', $user->id)
                    ->where('driver_id', $nextDriver->id)
                    ->update(['is_primary' => true]);

                $user->driver_id = $nextDriver->id;
            } else {
                $user->driver_id = null;
            }
            $user->save();
        }

        return response()->json([
            'message' => 'Driver disconnected successfully',
        ]);
    }

    /**
     * Get unconnected drivers (available to connect)
     */
    public function availableDrivers($userId)
    {
        $user = User::findOrFail($userId);

        $connectedDriverIds = $user->drivers()->pluck('drivers.id')->toArray();

        $drivers = Driver::whereNotIn('id', $connectedDriverIds)
            ->with(['laps.kartingSession.track'])
            ->withCount('laps')
            ->orderBy('name')
            ->get()
            ->map(function ($driver) {
                // Get unique tracks this driver has raced at
                $tracks = $driver->laps
                    ->pluck('kartingSession.track')
                    ->unique('id')
                    ->filter()
                    ->map(function ($track) {
                        return $track->name;
                    })
                    ->values()
                    ->toArray();

                return [
                    'id' => $driver->id,
                    'name' => $driver->name,
                    'nickname' => $driver->nickname,
                    'color' => $driver->color,
                    'laps_count' => $driver->laps_count,
                    'tracks' => $tracks,
                    'track_names' => implode(', ', $tracks),
                ];
            });

        return response()->json($drivers);
    }
}
