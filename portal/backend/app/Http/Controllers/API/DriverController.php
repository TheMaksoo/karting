<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AllowedDriversTrait;
use App\Models\Driver;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class DriverController extends Controller
{
    use AllowedDriversTrait;

    /**
     * Get all drivers with lap and session counts.
     */
    #[OA\Get(
        path: '/drivers',
        summary: 'List all drivers',
        description: 'Retrieve all drivers with their lap and session counts',
        tags: ['Drivers'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'List of drivers'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function index()
    {
        // Use single efficient query with subquery for session counts
        $drivers = Driver::withCount('laps')
            ->withCount(['laps as sessions_count' => function ($query) {
                $query->select(DB::raw('COUNT(DISTINCT karting_session_id)'));
            }])
            ->get();

        return response()->json($drivers);
    }

    /**
     * Create a new driver.
     */
    #[OA\Post(
        path: '/drivers',
        summary: 'Create a new driver',
        description: 'Create a new driver record',
        tags: ['Drivers'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true),
                    new OA\Property(property: 'nickname', type: 'string', maxLength: 255, nullable: true),
                    new OA\Property(property: 'color', type: 'string', maxLength: 7, nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Driver created'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:drivers,email',
            'nickname' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
        ]);

        $driver = Driver::create($validated);

        return response()->json($driver, 201);
    }

    /**
     * Get a specific driver by ID.
     */
    #[OA\Get(
        path: '/drivers/{id}',
        summary: 'Get driver details',
        description: 'Retrieve a driver with their laps and sessions',
        tags: ['Drivers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Driver details'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Driver not found'),
        ]
    )]
    public function show(string $id)
    {
        $driver = Driver::with(['laps.kartingSession.track'])->findOrFail($id);

        return response()->json($driver);
    }

    /**
     * Update an existing driver.
     */
    #[OA\Put(
        path: '/drivers/{id}',
        summary: 'Update a driver',
        description: 'Update an existing driver record',
        tags: ['Drivers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true),
                    new OA\Property(property: 'nickname', type: 'string', maxLength: 255, nullable: true),
                    new OA\Property(property: 'color', type: 'string', maxLength: 7, nullable: true),
                    new OA\Property(property: 'is_active', type: 'boolean'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Driver updated'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Driver not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(Request $request, string $id)
    {
        $driver = Driver::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:drivers,email,' . $id,
            'nickname' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
            'is_active' => 'sometimes|boolean',
        ]);

        $driver->update($validated);

        return response()->json($driver);
    }

    /**
     * Delete a driver.
     */
    #[OA\Delete(
        path: '/drivers/{id}',
        summary: 'Delete a driver',
        description: 'Remove a driver from the system',
        tags: ['Drivers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Driver deleted'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Driver not found'),
        ]
    )]
    public function destroy(string $id)
    {
        $driver = Driver::findOrFail($id);
        $driver->delete();

        return response()->json(['message' => 'Driver deleted successfully']);
    }

    /**
     * Get stats aggregated by ACCOUNT (all drivers combined per user)
     * Returns one stat block per account, not per individual driver
     */
    #[OA\Get(
        path: '/stats/drivers',
        summary: 'Get driver statistics by account',
        description: 'Retrieve aggregated statistics for all drivers, grouped by user account',
        tags: ['Stats'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Driver statistics'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function stats(Request $request)
    {
        $user = $request->user();

        // Create cache key based on user
        $cacheKey = 'account_stats_' . $user->id;

        // Cache for 5 minutes
        $stats = Cache::remember($cacheKey, 300, function () use ($user) {
            $accounts = $this->getDriverIdsByAccount($user);

            return collect($accounts)->map(function ($account) {
                // Get all laps for this account's drivers
                $laps = Lap::whereIn('driver_id', $account['driver_ids'])
                    ->with(['kartingSession.track', 'driver'])
                    ->get();

                $bestLap = $laps->where('is_best_lap', true)->sortBy('lap_time')->first();
                $allLapTimes = $laps->pluck('lap_time')->filter();

                // Group laps by track
                $trackLaps = $laps->groupBy(fn ($lap) => $lap->kartingSession?->track_id);

                return [
                    'account_id' => $account['user_id'],
                    'account_name' => $account['user_name'],
                    'is_current_user' => $account['is_current_user'],
                    'driver_count' => count($account['driver_ids']),
                    'driver_ids' => $account['driver_ids'],
                    'total_laps' => $laps->count(),
                    'total_sessions' => $laps->pluck('karting_session_id')->unique()->count(),
                    'total_tracks' => $trackLaps->count(),
                    'best_lap_time' => $bestLap ? (float) $bestLap->lap_time : null,
                    'best_lap_track' => $bestLap?->kartingSession?->track?->name,
                    'best_lap_driver' => $bestLap?->driver?->name,
                    'average_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->avg() : null,
                    'median_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->median() : null,
                    'total_cost' => (float) $laps->sum('cost_per_lap'),
                    'lap_times' => $allLapTimes->values(),
                ];
            });
        });

        return response()->json($stats);
    }
}
