<?php

use App\Http\Controllers\API\ActivityController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DriverController;
use App\Http\Controllers\API\EmlUploadController;
use App\Http\Controllers\API\FriendController;
use App\Http\Controllers\API\KartingSessionController;
use App\Http\Controllers\API\LapController;
use App\Http\Controllers\API\RegistrationController;
use App\Http\Controllers\API\SessionAnalyticsController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\StyleVariableController;
use App\Http\Controllers\API\TrackController;
use App\Http\Controllers\API\UploadController;
use App\Http\Controllers\API\UserDriverController;
use App\Http\Controllers\API\UserManagementController;
use App\Http\Controllers\API\UserSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
|
| Version 1 of the API. This allows future versions to maintain
| backward compatibility while introducing breaking changes.
|
*/

// Public routes with brute-force protection
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [RegistrationController::class, 'register']);
});

// Protected routes with rate limiting (IP + per-user)
Route::middleware(['auth:sanctum', 'throttle:60,1', 'per.user.rate.limit:120,1'])->group(function () {
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
    Route::get('/sessions/{session}/stats', [KartingSessionController::class, 'stats']);
    Route::post('/sessions/upload-eml', [EmlUploadController::class, 'parseEml']);
    Route::post('/sessions/save-parsed', [EmlUploadController::class, 'saveParsedSession']);

    // Laps
    Route::apiResource('laps', LapController::class);
    Route::get('/laps/driver/{driver}', [LapController::class, 'byDriver']);
    Route::get('/laps/count', [LapController::class, 'count']);

    // Friends
    Route::get('/friends', [FriendController::class, 'index']);
    Route::post('/friends', [FriendController::class, 'store']);
    Route::delete('/friends/{friend}', [FriendController::class, 'destroy']);
    Route::get('/friends/driver-ids', [FriendController::class, 'driverIds']);

    // User Settings
    Route::get('/user/settings', [UserSettingsController::class, 'show']);
    Route::put('/user/display-name', [UserSettingsController::class, 'updateDisplayName']);
    Route::post('/user/track-nickname', [UserSettingsController::class, 'setTrackNickname']);
    Route::delete('/user/track-nickname/{nickname}', [UserSettingsController::class, 'deleteTrackNickname']);

    // User Drivers
    Route::get('/user/drivers', [UserDriverController::class, 'index']);
    Route::post('/user/drivers/{driver}', [UserDriverController::class, 'connect']);
    Route::delete('/user/drivers/{driver}', [UserDriverController::class, 'disconnect']);
    Route::post('/user/drivers/{driver}/set-main', [UserDriverController::class, 'setMain']);

    // Statistics
    Route::prefix('stats')->group(function () {
        Route::get('/overview', [SessionAnalyticsController::class, 'overview']);
        Route::get('/database-metrics', [SessionAnalyticsController::class, 'databaseMetrics']);
        Route::get('/drivers', [DriverController::class, 'stats']);
        Route::get('/tracks', [TrackController::class, 'stats']);
        Route::get('/driver-activity-over-time', [SessionAnalyticsController::class, 'driverActivityOverTime']);
        Route::get('/driver-track-heatmap', [SessionAnalyticsController::class, 'driverTrackHeatmap']);
        Route::get('/trophy-case', [SessionAnalyticsController::class, 'trophyCase']);
        Route::get('/trophy-details', [SessionAnalyticsController::class, 'trophyDetails']);
    });

    // Activity
    Route::get('/activity/latest', [ActivityController::class, 'latestActivity']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{key}', [SettingController::class, 'update']);

    // Style Variables
    Route::get('/style-variables', [StyleVariableController::class, 'index']);
    Route::get('/styles.css', [StyleVariableController::class, 'getCSS']);
    Route::put('/style-variables/{styleVariable}', [StyleVariableController::class, 'update'])->middleware('admin');

    // Upload
    Route::post('/upload/batch', [UploadController::class, 'batchUpload']);
    Route::post('/upload/manual-entry', [UploadController::class, 'manualEntry']);

    // Admin routes (admin only)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::apiResource('users', UserManagementController::class);
        Route::post('/users/{user}/drivers/{driver}', [UserManagementController::class, 'connectDriver']);
        Route::delete('/users/{user}/drivers/{driver}', [UserManagementController::class, 'disconnectDriver']);
        Route::get('/users/{user}/available-drivers', [UserManagementController::class, 'availableDrivers']);
    });
});
