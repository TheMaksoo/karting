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

class TrackController extends Controller
{
    use AllowedDriversTrait;

    public function index()
    {
        // Return all tracks without pagination for dropdown/list usage
        $tracks = Track::with('kartingSessions')
            ->withCount('kartingSessions')
            ->get();

        return response()->json($tracks);
    }

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

    public function show(string $id)
    {
        $track = Track::with(['kartingSessions.laps'])->findOrFail($id);

        return response()->json($track);
    }

    public function update(UpdateTrackRequest $request, string $id)
    {
        $track = Track::findOrFail($id);

        $validated = $request->validated();

        $track->update($validated);

        return response()->json($track);
    }

    public function destroy(string $id)
    {
        $track = Track::findOrFail($id);
        $track->delete();

        return response()->json(['message' => 'Track deleted successfully']);
    }

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
