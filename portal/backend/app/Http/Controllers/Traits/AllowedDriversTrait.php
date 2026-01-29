<?php

namespace App\Http\Controllers\Traits;

use App\Models\User;
use Illuminate\Support\Facades\DB;

trait AllowedDriversTrait
{
    /**
     * Get allowed driver IDs for the authenticated user (user's own drivers + friends' drivers)
     * Account = group of drivers. Friends are linked via a driver, but we include ALL of that friend's drivers.
     */
    protected function getAllowedDriverIds($user): array
    {
        $driverIds = [];

        // Add user's own driver_id if exists (legacy single driver)
        if ($user->driver_id) {
            $driverIds[] = $user->driver_id;
        }

        // Add all drivers connected to user (many-to-many)
        $connectedDriverIds = DB::table('driver_user')
            ->where('user_id', $user->id)
            ->pluck('driver_id')
            ->toArray();
        $driverIds = array_merge($driverIds, $connectedDriverIds);

        // Get friend driver IDs and expand to include all drivers of each friend's account
        $friendDriverIds = DB::table('friends')
            ->where('user_id', $user->id)
            ->where('friendship_status', 'active')
            ->pluck('friend_driver_id')
            ->toArray();

        // For each friend driver, find their user account and get ALL their linked drivers
        $processedUserIds = [];

        foreach ($friendDriverIds as $friendDriverId) {
            // Find user who owns this driver (via legacy driver_id)
            $friendUser = User::where('driver_id', $friendDriverId)->first();

            if (! $friendUser) {
                // Try to find via driver_user pivot table
                $friendUser = User::whereHas('drivers', function ($q) use ($friendDriverId) {
                    $q->where('drivers.id', $friendDriverId);
                })->first();
            }

            if ($friendUser && ! in_array($friendUser->id, $processedUserIds)) {
                $processedUserIds[] = $friendUser->id;

                // Get all drivers linked to this friend's account
                if ($friendUser->driver_id) {
                    $driverIds[] = $friendUser->driver_id;
                }
                $friendConnectedDriverIds = DB::table('driver_user')
                    ->where('user_id', $friendUser->id)
                    ->pluck('driver_id')
                    ->toArray();
                $driverIds = array_merge($driverIds, $friendConnectedDriverIds);
            } else {
                // If no user found, just include this single driver
                $driverIds[] = $friendDriverId;
            }
        }

        return array_unique($driverIds);
    }
}
