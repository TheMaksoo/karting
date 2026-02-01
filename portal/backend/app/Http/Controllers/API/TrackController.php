<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AllowedDriversTrait;
use App\Http\Requests\StoreTrackRequest;
use App\Http\Requests\UpdateTrackRequest;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class TrackController extends Controller
{
    use AllowedDriversTrait;

    /**
     * Get all tracks with session counts.
     */
    #[OA\Get(
        path: '/tracks',
        summary: 'List all tracks',
        description: 'Retrieve all tracks with their session counts. Supports pagination.',
        tags: ['Tracks'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50, maximum: 100)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'country', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated list of tracks'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request)
    {
        $query = Track::with('kartingSessions')
            ->withCount('kartingSessions');

        // Search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('country', 'like', "%{$search}%");
            });
        }

        // Country filter
        if ($request->has('country')) {
            $query->where('country', $request->input('country'));
        }

        // Pagination
        $perPage = min($request->input('per_page', 50), 100); // Max 100 items per page

        if ($request->has('page') || $request->has('per_page')) {
            return response()->json($query->orderBy('name')->paginate($perPage));
        }

        // Return all if no pagination params (backward compatibility)
        return response()->json($query->orderBy('name')->get());
    }

    /**
     * Create a new track.
     */
    #[OA\Post(
        path: '/tracks',
        summary: 'Create a new track',
        description: 'Create a new karting track',
        tags: ['Tracks'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'city', 'country', 'distance'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'city', type: 'string', maxLength: 255),
                    new OA\Property(property: 'country', type: 'string', maxLength: 255),
                    new OA\Property(property: 'distance', type: 'number'),
                    new OA\Property(property: 'corners', type: 'integer', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Track created'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(StoreTrackRequest $request)
    {
        $validated = $request->validated();

        // Auto-generate track_id if not provided
        if (empty($validated['track_id'])) {
            $validated['track_id'] = \Illuminate\Support\Str::slug($validated['name'] . '-' . uniqid());
        }

        $track = Track::create($validated);

        return response()->json($track, 201);
    }

    /**
     * Get a specific track by ID.
     */
    #[OA\Get(
        path: '/tracks/{id}',
        summary: 'Get track details',
        description: 'Retrieve a track with its sessions and laps',
        tags: ['Tracks'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Track details'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Track not found'),
        ]
    )]
    public function show(string $id)
    {
        $track = Track::with(['kartingSessions.laps'])->findOrFail($id);

        return response()->json($track);
    }

    /**
     * Update an existing track.
     */
    #[OA\Put(
        path: '/tracks/{id}',
        summary: 'Update a track',
        description: 'Update an existing track record',
        tags: ['Tracks'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Track updated'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Track not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(UpdateTrackRequest $request, string $id)
    {
        $track = Track::findOrFail($id);

        $validated = $request->validated();

        $track->update($validated);

        return response()->json($track);
    }

    /**
     * Delete a track.
     */
    #[OA\Delete(
        path: '/tracks/{id}',
        summary: 'Delete a track',
        description: 'Remove a track from the system',
        tags: ['Tracks'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Track deleted'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Track not found'),
        ]
    )]
    public function destroy(string $id)
    {
        $track = Track::findOrFail($id);
        $track->delete();

        return response()->json(['message' => 'Track deleted successfully']);
    }

    /**
     * Get track statistics aggregated by account.
     */
    #[OA\Get(
        path: '/stats/tracks',
        summary: 'Get track statistics',
        description: 'Retrieve aggregated statistics for all tracks',
        tags: ['Stats'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Track statistics'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function stats(Request $request)
    {
        $user = $request->user();
        $allowedDriverIds = $this->getAllowedDriverIds($user);
        $accounts = $this->getDriverIdsByAccount($user);
        $cacheKey = 'track_stats_account_' . $user->id;

        $stats = Cache::remember($cacheKey, 300, function () use ($allowedDriverIds, $accounts) {
            $tracks = Track::all();
            $allLaps = $this->fetchLapsByTrack($allowedDriverIds);
            $sessionCounts = $this->fetchSessionCounts($allowedDriverIds);
            $driverToAccount = $this->buildDriverToAccountMap($accounts);

            return $tracks->map(function ($track) use ($allLaps, $sessionCounts, $driverToAccount) {
                return $this->buildTrackStats($track, $allLaps, $sessionCounts, $driverToAccount);
            })->filter()->values();
        });

        return response()->json($stats);
    }

    private function fetchLapsByTrack(array $allowedDriverIds)
    {
        return Lap::whereIn('driver_id', $allowedDriverIds)
            ->with(['kartingSession.track', 'driver.user'])
            ->get()
            ->groupBy(fn ($lap) => $lap->kartingSession?->track_id);
    }

    private function fetchSessionCounts(array $allowedDriverIds)
    {
        return KartingSession::whereHas('laps', function ($q) use ($allowedDriverIds) {
            $q->whereIn('driver_id', $allowedDriverIds);
        })
            ->select('track_id', DB::raw('COUNT(*) as count'))
            ->groupBy('track_id')
            ->pluck('count', 'track_id');
    }

    private function buildDriverToAccountMap(array $accounts): array
    {
        $driverToAccount = [];

        foreach ($accounts as $account) {
            foreach ($account['driver_ids'] as $driverId) {
                $driverToAccount[$driverId] = $account['user_name'];
            }
        }

        return $driverToAccount;
    }

    private function buildTrackStats($track, $allLaps, $sessionCounts, array $driverToAccount): ?array
    {
        $laps = $allLaps->get($track->id, collect());

        if ($laps->count() === 0) {
            return null;
        }

        $bestLap = $laps->sortBy('lap_time')->first();
        $allLapTimes = $laps->pluck('lap_time')->filter();

        $avgSpeed = $this->calculateAverageSpeed($laps, $track);
        $uniqueAccounts = $laps->pluck('driver_id')
            ->map(fn ($driverId) => $driverToAccount[$driverId] ?? 'Unknown')
            ->unique()
            ->count();

        $recordHolderAccount = $bestLap
            ? ($driverToAccount[$bestLap->driver_id] ?? $bestLap->driver?->name)
            : null;

        return [
            'track_id' => $track->id,
            'track_name' => $track->name,
            'city' => $track->city,
            'country' => $track->country,
            'region' => $track->region,
            'distance' => $track->distance,
            'corners' => $track->corners,
            'indoor' => $track->indoor,
            'latitude' => $track->latitude ? (float) $track->latitude : null,
            'longitude' => $track->longitude ? (float) $track->longitude : null,
            'total_sessions' => $sessionCounts->get($track->id, 0),
            'total_laps' => $laps->count(),
            'unique_accounts' => $uniqueAccounts,
            'track_record' => $bestLap ? (float) $bestLap->lap_time : null,
            'record_holder' => $recordHolderAccount,
            'avg_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->avg() : null,
            'median_lap_time' => $allLapTimes->count() > 0 ? (float) $allLapTimes->median() : null,
            'avg_speed_kmh' => $avgSpeed ? round($avgSpeed, 2) : null,
            'total_distance_km' => $laps->count() > 0 && $track->distance
                ? round(($laps->count() * $track->distance) / 1000, 2)
                : null,
        ];
    }

    private function calculateAverageSpeed($laps, $track): ?float
    {
        if ($laps->count() === 0 || ! $track->distance) {
            return null;
        }

        $speeds = $laps->map(fn ($lap) => ($track->distance / $lap->lap_time) * 3.6);

        return $speeds->avg();
    }
}
