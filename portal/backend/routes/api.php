<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DriverController;
use App\Http\Controllers\API\TrackController;
use App\Http\Controllers\API\KartingSessionController;
use App\Http\Controllers\API\LapController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\UploadController;
use App\Http\Controllers\API\SessionAnalyticsController;
use App\Http\Controllers\API\StyleVariableController;
use App\Http\Controllers\API\EmlUploadController;
use App\Http\Controllers\API\FriendController;
use App\Http\Controllers\API\UserSettingsController;
use App\Http\Controllers\API\ActivityController;

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
    
    // Friends
    Route::get('/friends', [FriendController::class, 'index']);
    Route::post('/friends', [FriendController::class, 'store']);
    Route::delete('/friends/{id}', [FriendController::class, 'destroy']);
    Route::get('/friends/driver-ids', [FriendController::class, 'getFriendDriverIds']);
    
    // User Settings
    Route::get('/user/settings', [UserSettingsController::class, 'index']);
    Route::put('/user/display-name', [UserSettingsController::class, 'updateDisplayName']);
    Route::post('/user/track-nickname', [UserSettingsController::class, 'setTrackNickname']);
    Route::delete('/user/track-nickname/{id}', [UserSettingsController::class, 'deleteTrackNickname']);
    
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
    Route::get('/stats/driver-activity-over-time', [SessionAnalyticsController::class, 'driverActivityOverTime']);
    Route::get('/stats/driver-track-heatmap', [SessionAnalyticsController::class, 'driverTrackHeatmap']);
    Route::get('/stats/trophy-case', [SessionAnalyticsController::class, 'trophyCase']);
    Route::get('/stats/trophy-details', [SessionAnalyticsController::class, 'trophyDetails']);
    Route::get('/activity/latest', [ActivityController::class, 'latestActivity']);
    
    // Style Variables (Read: all authenticated, Write: admin only)
    Route::get('/style-variables', [StyleVariableController::class, 'index']);
    Route::get('/styles.css', [StyleVariableController::class, 'getCSS']);
    
    Route::middleware('admin')->group(function () {
        Route::put('/style-variables/{id}', [StyleVariableController::class, 'update']);
        Route::post('/style-variables/bulk', [StyleVariableController::class, 'bulkUpdate']);
        Route::post('/style-variables/reset', [StyleVariableController::class, 'reset']);
    });
    
    // Upload & Import (Admin only)
    Route::middleware('admin')->group(function () {
        Route::post('/upload/preview', [UploadController::class, 'preview']);
        Route::post('/upload/import', [UploadController::class, 'import']);
        Route::post('/upload/manual-entry', [UploadController::class, 'manualEntry']);
        
        // EML Upload
        Route::post('/sessions/upload-eml', [EmlUploadController::class, 'parseEml']);
        Route::post('/sessions/save-parsed', [EmlUploadController::class, 'saveSession']);
    });
});
