<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DriverController;
use App\Http\Controllers\API\TrackController;
use App\Http\Controllers\API\KartingSessionController;
use App\Http\Controllers\API\LapController;
use App\Http\Controllers\API\SettingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    
    // Drivers
    Route::apiResource('drivers', DriverController::class);
    
    // Tracks
    Route::apiResource('tracks', TrackController::class);
    
    // Sessions
    Route::apiResource('sessions', KartingSessionController::class);
    Route::get('/sessions/{session}/laps', [KartingSessionController::class, 'laps']);
    
    // Laps
    Route::apiResource('laps', LapController::class);
    Route::get('/laps/driver/{driver}', [LapController::class, 'byDriver']);
    
    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{key}', [SettingController::class, 'update']);
    
    // Stats & Analytics
    Route::get('/stats/drivers', [DriverController::class, 'stats']);
    Route::get('/stats/tracks', [TrackController::class, 'stats']);
    Route::get('/stats/overview', [LapController::class, 'overview']);
});
