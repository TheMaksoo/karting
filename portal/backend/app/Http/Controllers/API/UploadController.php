<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\EmlParser;
use App\Models\Track;
use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UploadController extends Controller
{
    protected $emlParser;

    public function __construct(EmlParser $emlParser)
    {
        $this->emlParser = $emlParser;
    }

    /**
     * Preview data from uploaded file without importing
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function preview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:eml,txt,csv|max:10240', // 10MB max
            'track_id' => 'required|exists:tracks,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Store file temporarily
            $file = $request->file('file');
            $path = $file->store('temp-uploads');
            $fullPath = Storage::path($path);

            // Parse the file
            $extension = $file->getClientOriginalExtension();
            
            if ($extension === 'eml') {
                $parsed = $this->emlParser->parse($fullPath, $request->track_id);
            } else {
                $parsed = $this->emlParser->parseTextFile($fullPath, $request->track_id);
            }

            // Validate parsed data
            $validationErrors = $this->emlParser->validate($parsed);
            
            if (!empty($validationErrors)) {
                Storage::delete($path);
                return response()->json([
                    'success' => false,
                    'errors' => $validationErrors
                ], 422);
            }

            // Get track info
            $track = Track::find($request->track_id);

            // Prepare preview data
            $preview = [
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $extension,
                'track' => [
                    'id' => $track->id,
                    'name' => $track->name,
                    'city' => $track->city,
                    'country' => $track->country,
                ],
                'session_info' => $parsed['session_info'] ?? [],
                'laps_count' => count($parsed['laps']),
                'drivers_detected' => count(array_unique(array_column($parsed['laps'], 'driver_name'))),
                'laps' => $parsed['laps'],
                'temp_path' => $path, // Keep for import step
            ];

            return response()->json([
                'success' => true,
                'data' => $preview
            ]);

        } catch (\Exception $e) {
            if (isset($path)) {
                Storage::delete($path);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import previewed data to database
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'track_id' => 'required|exists:tracks,id',
            'session_date' => 'required|date',
            'session_type' => 'nullable|in:practice,qualifying,race,heat',
            'laps' => 'required|array|min:1',
            'laps.*.driver_name' => 'required|string',
            'laps.*.best_lap_time' => 'required|numeric|min:0',
            'laps.*.lap_number' => 'nullable|integer',
            'laps.*.kart_number' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $track = Track::find($request->track_id);
            
            // Create session
            $session = KartingSession::create([
                'track_id' => $track->id,
                'session_date' => $request->session_date,
                'session_type' => $request->session_type ?? 'practice',
                'session_time' => $request->session_time ?? now()->format('H:i:s'),
                'weather_condition' => $this->guessWeatherCondition($track->indoor),
                'temperature' => null,
                'humidity' => null,
                'notes' => $request->notes ?? 'Imported via upload',
            ]);

            // Process each lap
            $lapsImported = 0;
            $driversProcessed = [];

            foreach ($request->laps as $lapData) {
                // Get or create driver
                $driver = $this->getOrCreateDriver($lapData['driver_name']);
                $driversProcessed[$driver->id] = $driver->name;

                // Create lap
                Lap::create([
                    'session_id' => $session->id,
                    'driver_id' => $driver->id,
                    'lap_number' => $lapData['lap_number'] ?? 1,
                    'lap_time' => $lapData['best_lap_time'],
                    'sector_1_time' => $lapData['sector_1_time'] ?? null,
                    'sector_2_time' => $lapData['sector_2_time'] ?? null,
                    'sector_3_time' => $lapData['sector_3_time'] ?? null,
                    'kart_number' => $lapData['kart_number'] ?? null,
                    'position' => $lapData['position'] ?? null,
                    'is_best_lap' => $lapData['is_best_lap'] ?? false,
                    'notes' => $lapData['notes'] ?? null,
                ]);

                $lapsImported++;
            }

            // Clean up temp file if provided
            if ($request->has('temp_path')) {
                Storage::delete($request->temp_path);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully imported {$lapsImported} laps",
                'data' => [
                    'session_id' => $session->id,
                    'laps_imported' => $lapsImported,
                    'drivers_processed' => count($driversProcessed),
                    'drivers' => array_values($driversProcessed),
                    'session' => $session,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to import data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manual lap entry
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function manualEntry(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'track_id' => 'required|exists:tracks,id',
            'driver_id' => 'required|exists:drivers,id',
            'session_date' => 'required|date',
            'lap_time' => 'required|numeric|min:0',
            'lap_number' => 'nullable|integer|min:1',
            'kart_number' => 'nullable|integer',
            'session_type' => 'nullable|in:practice,qualifying,race,heat',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Find or create session for this date/track
            $session = KartingSession::firstOrCreate(
                [
                    'track_id' => $request->track_id,
                    'session_date' => $request->session_date,
                ],
                [
                    'session_type' => $request->session_type ?? 'practice',
                    'session_time' => now()->format('H:i:s'),
                    'weather_condition' => $this->guessWeatherCondition(
                        Track::find($request->track_id)->indoor
                    ),
                    'notes' => 'Manual entry session',
                ]
            );

            // Create lap
            $lap = Lap::create([
                'session_id' => $session->id,
                'driver_id' => $request->driver_id,
                'lap_number' => $request->lap_number ?? 1,
                'lap_time' => $request->lap_time,
                'kart_number' => $request->kart_number,
                'notes' => $request->notes,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lap added successfully',
                'data' => [
                    'lap' => $lap->load(['driver', 'session.track']),
                    'session' => $session,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add lap: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get or create driver by name
     */
    private function getOrCreateDriver(string $name): Driver
    {
        // Clean up name
        $name = trim($name);
        
        // Try to find existing driver (case-insensitive)
        $driver = Driver::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();
        
        if ($driver) {
            return $driver;
        }

        // Create new driver
        return Driver::create([
            'name' => $name,
            'email' => null, // Will be updated later
            'role' => 'driver',
        ]);
    }

    /**
     * Guess weather condition based on track type
     */
    private function guessWeatherCondition(bool $indoor): string
    {
        if ($indoor) {
            return 'Indoor';
        }

        // Default to dry for outdoor tracks
        // Could be enhanced with weather API
        return 'Dry';
    }
}
