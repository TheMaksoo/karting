<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserDriverController extends Controller
{
    /**
     * Get all drivers connected to the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $drivers = $user->drivers()
            ->withCount('laps')
            ->get()
            ->map(function ($driver) {
                return [
                    'id' => $driver->id,
                    'name' => $driver->name,
                    'nickname' => $driver->nickname,
                    'email' => $driver->email,
                    'color' => $driver->color,
                    'is_active' => $driver->is_active,
                    'is_primary' => $driver->pivot->is_primary,
                    'laps_count' => $driver->laps_count,
                    'created_at' => $driver->created_at,
                ];
            });

        return response()->json($drivers);
    }

    /**
     * Connect a driver to the authenticated user
     */
    public function attach(Request $request, $driverId)
    {
        $user = $request->user();

        // Check if already connected
        if ($user->drivers()->where('driver_id', $driverId)->exists()) {
            return response()->json([
                'message' => 'Driver already connected to your account',
            ], 409);
        }

        // If this is the first driver, make it primary
        $isPrimary = $user->drivers()->count() === 0;

        // Attach driver
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
            'driver' => Driver::find($driverId),
        ]);
    }

    /**
     * Disconnect a driver from the authenticated user
     */
    public function detach(Request $request, $driverId)
    {
        $user = $request->user();

        // Check if driver is connected
        if (! $user->drivers()->where('driver_id', $driverId)->exists()) {
            return response()->json([
                'message' => 'Driver not connected to your account',
            ], 404);
        }

        // Don't allow disconnecting the primary driver if there are others
        $isPrimary = $user->drivers()->where('driver_id', $driverId)->first()->pivot->is_primary;

        if ($isPrimary && $user->drivers()->count() > 1) {
            return response()->json([
                'message' => 'Cannot disconnect primary driver. Set another driver as primary first.',
            ], 400);
        }

        // Detach driver
        $user->drivers()->detach($driverId);

        // If this was the primary driver, clear user's driver_id
        if ($isPrimary) {
            $user->driver_id = null;
            $user->save();
        }

        return response()->json([
            'message' => 'Driver disconnected successfully',
        ]);
    }

    /**
     * Set a driver as primary for the authenticated user
     */
    public function setPrimary(Request $request, $driverId)
    {
        $user = $request->user();

        // Check if driver is connected
        if (! $user->drivers()->where('driver_id', $driverId)->exists()) {
            return response()->json([
                'message' => 'Driver not connected to your account',
            ], 404);
        }

        // Remove primary from all drivers
        DB::table('driver_user')
            ->where('user_id', $user->id)
            ->update(['is_primary' => false]);

        // Set this driver as primary
        DB::table('driver_user')
            ->where('user_id', $user->id)
            ->where('driver_id', $driverId)
            ->update(['is_primary' => true]);

        // Update user's driver_id
        $user->driver_id = $driverId;
        $user->save();

        return response()->json([
            'message' => 'Primary driver updated successfully',
        ]);
    }
}
