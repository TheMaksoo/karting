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

    /**
     * Get driver IDs for only the current user's account (not friends)
     */
    protected function getUserOwnDriverIds($user): array
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

        return array_unique($driverIds);
    }

    /**
     * Get driver IDs grouped by account (user).
     * Returns array of ['user_id' => int, 'user_name' => string, 'driver_ids' => array]
     */
    protected function getDriverIdsByAccount($user): array
    {
        $accounts = [];

        // Add current user's account
        $userDriverIds = $this->getUserOwnDriverIds($user);

        if (! empty($userDriverIds)) {
            $accounts[] = [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'driver_ids' => $userDriverIds,
                'is_current_user' => true,
            ];
        }

        // Get friend accounts
        $friendDriverIds = DB::table('friends')
            ->where('user_id', $user->id)
            ->where('friendship_status', 'active')
            ->pluck('friend_driver_id')
            ->toArray();

        $processedUserIds = [$user->id]; // Don't re-add current user

        foreach ($friendDriverIds as $friendDriverId) {
            // Find user who owns this driver
            $friendUser = User::where('driver_id', $friendDriverId)->first();

            if (! $friendUser) {
                $friendUser = User::whereHas('drivers', function ($q) use ($friendDriverId) {
                    $q->where('drivers.id', $friendDriverId);
                })->first();
            }

            if ($friendUser && ! in_array($friendUser->id, $processedUserIds)) {
                $processedUserIds[] = $friendUser->id;

                $friendAccountDriverIds = $this->getUserOwnDriverIdsForUser($friendUser);

                if (! empty($friendAccountDriverIds)) {
                    $accounts[] = [
                        'user_id' => $friendUser->id,
                        'user_name' => $friendUser->name,
                        'driver_ids' => $friendAccountDriverIds,
                        'is_current_user' => false,
                    ];
                }
            }
        }

        return $accounts;
    }

    /**
     * Helper to get driver IDs for any user (not just current)
     */
    private function getUserOwnDriverIdsForUser(User $targetUser): array
    {
        $driverIds = [];

        if ($targetUser->driver_id) {
            $driverIds[] = $targetUser->driver_id;
        }

        $connectedDriverIds = DB::table('driver_user')
            ->where('user_id', $targetUser->id)
            ->pluck('driver_id')
            ->toArray();
        $driverIds = array_merge($driverIds, $connectedDriverIds);

        return array_unique($driverIds);
    }
}
