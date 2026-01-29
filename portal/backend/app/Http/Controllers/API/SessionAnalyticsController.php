<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\AllowedDriversTrait;
use App\Models\KartingSession;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SessionAnalyticsController extends Controller
{
    use AllowedDriversTrait;

    /**
     * Cache TTL for analytics endpoints (5 minutes)
     */
    private const CACHE_TTL = 300;

    /**
     * Get cumulative lap count per ACCOUNT over time (for activity chart)
     * Aggregates all drivers in an account into one line
     */
    public function driverActivityOverTime(Request $request)
    {
        $user = $request->user();
        $cacheKey = 'activity_over_time_' . $user->id;

        $result = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            $accounts = $this->getDriverIdsByAccount($user);
            $data = [];

            foreach ($accounts as $account) {
                // Get laps grouped by session date for this account's drivers
                $accountData = Lap::select(
                    'karting_sessions.session_date',
                    DB::raw('COUNT(laps.id) as laps_in_session')
                )
                    ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                    ->whereIn('laps.driver_id', $account['driver_ids'])
                    ->groupBy('karting_sessions.session_date')
                    ->orderBy('karting_sessions.session_date')
                    ->get();

                // Calculate cumulative laps
                $cumulativeLaps = 0;

                foreach ($accountData as $row) {
                    $cumulativeLaps += $row->laps_in_session;
                    $data[] = [
                        'driver_id' => $account['user_id'],
                        'driver_name' => $account['user_name'],
                        'session_date' => $row->session_date,
                        'laps_added' => $row->laps_in_session,
                        'cumulative_laps' => $cumulativeLaps,
                    ];
                }
            }

            // Sort by session_date, then by name
            usort($data, function ($a, $b) {
                $dateCompare = strcmp($a['session_date'], $b['session_date']);

                return $dateCompare !== 0 ? $dateCompare : strcmp($a['driver_name'], $b['driver_name']);
            });

            return $data;
        });

        return response()->json($result);
    }

    /**
     * Get best lap per ACCOUNT per track (for heatmap)
     * Returns: tracks horizontal, accounts (users) vertical
     * Aggregates all drivers in an account - shows best lap across all account's drivers
     */
    public function driverTrackHeatmap(Request $request)
    {
        $user = $request->user();
        $cacheKey = 'heatmap_' . $user->id;

        $result = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            $accounts = $this->getDriverIdsByAccount($user);
            $allowedDriverIds = $this->getAllowedDriverIds($user);

            // Get all unique tracks (filtered by allowed drivers)
            $tracks = DB::table('tracks')
                ->join('karting_sessions', 'tracks.id', '=', 'karting_sessions.track_id')
                ->join('laps', 'karting_sessions.id', '=', 'laps.karting_session_id')
                ->whereIn('laps.driver_id', $allowedDriverIds)
                ->select('tracks.id', 'tracks.name')
                ->distinct()
                ->orderBy('tracks.name')
                ->get();

            // Get track records (filtered by allowed drivers)
            $trackRecords = Lap::select(
                'tracks.id as track_id',
                DB::raw('MIN(laps.lap_time) as track_record')
            )
                ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
                ->whereIn('laps.driver_id', $allowedDriverIds)
                ->groupBy('tracks.id')
                ->get()
                ->pluck('track_record', 'track_id');

            // Get stats per ACCOUNT per track (aggregate all drivers in account)
            $accountTrackStats = [];

            foreach ($accounts as $account) {
                $stats = Lap::select(
                    'tracks.id as track_id',
                    DB::raw('MIN(laps.lap_time) as best_lap_time'),
                    DB::raw('AVG(laps.lap_time) as avg_lap_time'),
                    DB::raw('MAX(laps.lap_time) as worst_lap_time'),
                    DB::raw('COUNT(*) as lap_count'),
                    DB::raw('MAX(laps.lap_time) - MIN(laps.lap_time) as consistency_range')
                )
                    ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                    ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
                    ->whereIn('laps.driver_id', $account['driver_ids'])
                    ->groupBy('tracks.id')
                    ->get();

                $accountTrackStats[$account['user_id']] = $stats->keyBy('track_id');
            }

            // Calculate track average speeds
            $trackAvgSpeeds = [];

            foreach ($tracks as $track) {
                $avgTime = Lap::join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                    ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
                    ->where('tracks.id', $track->id)
                    ->whereIn('laps.driver_id', $allowedDriverIds)
                    ->avg('laps.lap_time');

                $distance = DB::table('tracks')->where('id', $track->id)->value('distance');
                $trackAvgSpeeds[$track->id] = $avgTime && $distance ? round(($distance / $avgTime) * 3.6, 2) : 0;
            }

            // Find the maximum gap for percentage calculations
            $allGaps = [];

            foreach ($accounts as $account) {
                foreach ($tracks as $track) {
                    $stats = $accountTrackStats[$account['user_id']][$track->id] ?? null;

                    if ($stats) {
                        $trackRecord = $trackRecords[$track->id] ?? $stats->best_lap_time;
                        $gap = $stats->best_lap_time - $trackRecord;
                        $allGaps[] = $gap;
                    }
                }
            }
            $maxGap = ! empty($allGaps) ? max($allGaps) : 1;

            // Build response - use accounts instead of drivers
            $data = [
                'tracks' => $tracks->map(function ($track) use ($trackAvgSpeeds) {
                    return [
                        'id' => $track->id,
                        'name' => $track->name,
                        'avg_speed_kmh' => $trackAvgSpeeds[$track->id] ?? 0,
                    ];
                })->values(),
                'drivers' => collect($accounts)->map(function ($account) {
                    return [
                        'id' => $account['user_id'],
                        'name' => $account['user_name'],
                        'is_account' => true,
                    ];
                })->values(),
                'heatmap_data' => [],
                'max_gap' => $maxGap,
            ];

            // Build heatmap matrix - one row per account
            foreach ($accounts as $account) {
                $row = [];

                foreach ($tracks as $track) {
                    $stats = $accountTrackStats[$account['user_id']][$track->id] ?? null;

                    if ($stats) {
                        $trackRecord = $trackRecords[$track->id] ?? $stats->best_lap_time;
                        $gap = $stats->best_lap_time - $trackRecord;
                        $gapPercentage = $maxGap > 0 ? ($gap / $maxGap) * 100 : 0;

                        $row[] = [
                            'best_lap_time' => (float) $stats->best_lap_time,
                            'gap' => (float) $gap,
                            'gap_percentage' => round($gapPercentage, 2),
                            'has_data' => true,
                            'lap_count' => $stats->lap_count,
                            'avg_lap_time' => (float) $stats->avg_lap_time,
                            'worst_lap_time' => (float) $stats->worst_lap_time,
                            'consistency_range' => (float) $stats->consistency_range,
                            'track_record' => (float) $trackRecord,
                        ];
                    } else {
                        $row[] = [
                            'best_lap_time' => null,
                            'gap' => null,
                            'gap_percentage' => null,
                            'has_data' => false,
                            'lap_count' => 0,
                        ];
                    }
                }
                $data['heatmap_data'][] = $row;
            }

            return $data;
        });

        return response()->json($result);
    }

    /**
     * Get trophy case for a driver (Emblems, Gold, Silver, Bronze, Coal)
     */
    public function trophyCase(Request $request)
    {
        $driverId = $request->input('driver_id');

        if (! $driverId) {
            return response()->json(['error' => 'driver_id is required'], 400);
        }

        Log::info("🏆 Trophy Case for driver: {$driverId}");

        $trophies = [
            'emblems' => 0,  // Track records
            'gold' => 0,     // Session fastest
            'silver' => 0,   // Session 2nd fastest
            'bronze' => 0,   // Session 3rd fastest
            'coal' => 0,     // Session slowest
        ];

        // Get all sessions this driver participated in
        $sessions = KartingSession::whereHas('laps', function ($q) use ($driverId) {
            $q->where('driver_id', $driverId);
        })->get();

        Log::info("📊 Found {$sessions->count()} sessions");

        foreach ($sessions as $session) {
            // Get all drivers' best laps in this session
            $sessionLaps = Lap::where('karting_session_id', $session->id)
                ->select('driver_id', DB::raw('MIN(lap_time) as best_lap'))
                ->groupBy('driver_id')
                ->orderBy('best_lap')
                ->get();

            Log::info("Session {$session->id}: {$sessionLaps->count()} drivers");

            // Find this driver's position
            $position = $sessionLaps->search(function ($item) use ($driverId) {
                return $item->driver_id == $driverId;
            });

            if ($position !== false) {
                $position++; // Convert 0-based index to 1-based position
                $totalDrivers = $sessionLaps->count();

                Log::info("Driver position: {$position}/{$totalDrivers}");

                if ($position === 1) {
                    $trophies['gold']++;
                }

                if ($position === 2 && $totalDrivers >= 2) {
                    $trophies['silver']++;
                }

                if ($position === 3 && $totalDrivers >= 3) {
                    $trophies['bronze']++;
                }

                if ($position === $totalDrivers && $totalDrivers > 1) {
                    $trophies['coal']++;
                }
            }
        }

        // Count track records (emblems)
        // A track record is when driver's best lap is the fastest ever on that track
        $trackRecords = Lap::select('tracks.id', 'tracks.name')
            ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
            ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
            ->where('laps.driver_id', $driverId)
            ->groupBy('tracks.id', 'tracks.name')
            ->get();

        Log::info("🏁 Checking {$trackRecords->count()} tracks for records");

        foreach ($trackRecords as $track) {
            $driverBestOnTrack = Lap::join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                ->where('karting_sessions.track_id', $track->id)
                ->where('laps.driver_id', $driverId)
                ->min('laps.lap_time');

            $trackRecord = Lap::join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                ->where('karting_sessions.track_id', $track->id)
                ->min('laps.lap_time');

            if ($driverBestOnTrack == $trackRecord) {
                $trophies['emblems']++;
            }
        }

        Log::info('🏆 Final trophies:', $trophies);

        return response()->json($trophies);
    }

    public function trophyDetails(Request $request)
    {
        $driverId = $request->input('driver_id');
        $type = $request->input('type');

        if (! $driverId || ! $type) {
            return response()->json([]);
        }

        $details = [];

        if ($type === 'emblems') {
            // Track records - driver's best lap is the fastest ever on that track
            $trackRecords = Lap::select('tracks.id', 'tracks.name')
                ->join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
                ->where('laps.driver_id', $driverId)
                ->groupBy('tracks.id', 'tracks.name')
                ->get();

            foreach ($trackRecords as $track) {
                // Get driver's best lap on this track
                $driverBestOnTrack = Lap::join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                    ->where('karting_sessions.track_id', $track->id)
                    ->where('laps.driver_id', $driverId)
                    ->min('laps.lap_time');

                // Get overall track record (fastest lap by anyone)
                $trackRecord = Lap::join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                    ->where('karting_sessions.track_id', $track->id)
                    ->min('laps.lap_time');

                // If driver's best equals the track record, they have the record
                if ($driverBestOnTrack == $trackRecord) {
                    // Get the date when they set this record
                    $recordSession = Lap::join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                        ->where('karting_sessions.track_id', $track->id)
                        ->where('laps.driver_id', $driverId)
                        ->where('laps.lap_time', $driverBestOnTrack)
                        ->select('karting_sessions.session_date', 'karting_sessions.id as session_id')
                        ->first();

                    if ($recordSession) {
                        // Get all drivers who have raced on this track
                        $allDriversOnTrack = Lap::join('karting_sessions', 'laps.karting_session_id', '=', 'karting_sessions.id')
                            ->join('drivers', 'laps.driver_id', '=', 'drivers.id')
                            ->where('karting_sessions.track_id', $track->id)
                            ->select('drivers.name as driver_name', \DB::raw('MIN(laps.lap_time) as best_time'))
                            ->groupBy('laps.driver_id', 'drivers.name')
                            ->orderBy('best_time', 'asc')
                            ->get();

                        $allDriversWithPositions = [];

                        foreach ($allDriversOnTrack as $index => $driver) {
                            $allDriversWithPositions[] = [
                                'name' => $driver->driver_name,
                                'position' => $index + 1,
                                'time' => $driver->best_time,
                                'is_current_driver' => $driver->driver_name === \DB::table('drivers')->where('id', $driverId)->value('name'),
                            ];
                        }

                        $details[] = [
                            'track_name' => $track->name,
                            'session_date' => $recordSession->session_date,
                            'time' => $driverBestOnTrack,
                            'all_drivers' => $allDriversWithPositions,
                            'position' => 1,
                            'total_drivers' => count($allDriversWithPositions),
                            'gap_ahead' => null,
                            'gap_behind' => count($allDriversWithPositions) > 1 ? '+' . number_format($allDriversOnTrack[1]->best_time - $driverBestOnTrack, 3) . 's' : null,
                            'driver_ahead' => null,
                            'driver_behind' => count($allDriversWithPositions) > 1 ? $allDriversOnTrack[1]->driver_name : null,
                        ];
                    }
                }
            }
        } elseif ($type === 'gold' || $type === 'silver' || $type === 'bronze' || $type === 'coal') {
            $sessions = \DB::table('karting_sessions')
                ->join('tracks', 'karting_sessions.track_id', '=', 'tracks.id')
                ->whereIn('karting_sessions.id', function ($query) use ($driverId) {
                    $query->select('karting_session_id')
                        ->from('laps')
                        ->where('driver_id', $driverId);
                })
                ->select('karting_sessions.id', 'karting_sessions.session_date', 'tracks.name as track_name')
                ->orderBy('karting_sessions.session_date', 'desc')
                ->get();

            foreach ($sessions as $session) {
                // Get all drivers with their best times, ordered by best lap
                $sessionLaps = Lap::where('karting_session_id', $session->id)
                    ->join('drivers', 'laps.driver_id', '=', 'drivers.id')
                    ->select('laps.driver_id', 'drivers.name as driver_name', \DB::raw('MIN(laps.lap_time) as best_time'))
                    ->groupBy('laps.driver_id', 'drivers.name')
                    ->orderBy('best_time', 'asc')
                    ->get();

                // Find the driver's position
                $position = null;
                $driverBestTime = null;

                foreach ($sessionLaps as $index => $lap) {
                    if ($lap->driver_id == $driverId) {
                        $position = $index + 1; // 1-based position
                        $driverBestTime = $lap->best_time;
                        break;
                    }
                }

                if ($position === null) {
                    continue; // Driver didn't participate in this session
                }

                $totalDrivers = $sessionLaps->count();

                // Check if this session matches the trophy type
                $matchesPosition = false;

                if ($type === 'gold' && $position === 1) {
                    $matchesPosition = true;
                }

                if ($type === 'silver' && $position === 2) {
                    $matchesPosition = true;
                }

                if ($type === 'bronze' && $position === 3) {
                    $matchesPosition = true;
                }

                if ($type === 'coal' && $position === $totalDrivers && $totalDrivers > 1) {
                    $matchesPosition = true;
                }

                if ($matchesPosition) {
                    // Build gaps and opponent information
                    $gapAhead = null;
                    $gapBehind = null;
                    $driverAhead = null;
                    $driverBehind = null;

                    // For 1st place: show gap to 2nd place (how much they won by)
                    if ($position === 1 && $totalDrivers > 1) {
                        $secondPlace = $sessionLaps[1];
                        $gapSeconds = $secondPlace->best_time - $driverBestTime;
                        $gapAhead = '+' . number_format($gapSeconds, 3) . 's';
                        $driverBehind = $secondPlace->driver_name;
                    }
                    // For other positions: show gap ahead (red) and behind (green)
                    elseif ($position > 1) {
                        // Gap to driver ahead (red - losing)
                        $aheadDriver = $sessionLaps[$position - 2]; // -2 because 0-indexed and we want previous
                        $gapSeconds = $driverBestTime - $aheadDriver->best_time;
                        $gapAhead = '+' . number_format($gapSeconds, 3) . 's';
                        $driverAhead = $aheadDriver->driver_name;

                        // Gap to driver behind (green - winning)
                        if ($position < $totalDrivers) {
                            $behindDriver = $sessionLaps[$position]; // +0 because 0-indexed and we want next
                            $gapSeconds = $behindDriver->best_time - $driverBestTime;
                            $gapBehind = '+' . number_format($gapSeconds, 3) . 's';
                            $driverBehind = $behindDriver->driver_name;
                        }
                    }

                    // Get list of all drivers in the session with their positions
                    $allDriversWithPositions = [];
                    $driversList = [];

                    foreach ($sessionLaps as $index => $lap) {
                        $driverPosition = $index + 1;
                        $allDriversWithPositions[] = [
                            'name' => $lap->driver_name,
                            'position' => $driverPosition,
                            'time' => $lap->best_time,
                            'is_current_driver' => $lap->driver_id == $driverId,
                        ];

                        // Also build simple list for backward compatibility
                        if ($lap->driver_id != $driverId) {
                            $driversList[] = $lap->driver_name;
                        }
                    }

                    $details[] = [
                        'track_name' => $session->track_name,
                        'session_date' => $session->session_date,
                        'opponents' => ! empty($driversList) ? implode(', ', $driversList) : 'Solo',
                        'all_drivers' => $allDriversWithPositions,
                        'time' => $driverBestTime,
                        'gap_ahead' => $gapAhead,
                        'gap_behind' => $gapBehind,
                        'driver_ahead' => $driverAhead,
                        'driver_behind' => $driverBehind,
                        'position' => $position,
                        'total_drivers' => $totalDrivers,
                    ];
                }
            }
        }

        return response()->json($details);
    }
}
