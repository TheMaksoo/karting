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
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check routes (public, no auth required)
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'check']);
    Route::get('/detailed', [HealthController::class, 'detailed']);
    Route::get('/ready', [HealthController::class, 'ready']);
    Route::get('/live', [HealthController::class, 'live']);
});

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

    // User Drivers (connect/disconnect drivers to user account)
    Route::get('/user/drivers', [UserDriverController::class, 'index']);
    Route::post('/user/drivers/{driverId}', [UserDriverController::class, 'attach']);
    Route::delete('/user/drivers/{driverId}', [UserDriverController::class, 'detach']);
    Route::post('/user/drivers/{driverId}/set-main', [UserDriverController::class, 'setPrimary']);

    // Sessions
    Route::apiResource('sessions', KartingSessionController::class);
    Route::get('/sessions/{session}/laps', [KartingSessionController::class, 'laps']);
    Route::get('/sessions/{session}/stats', [KartingSessionController::class, 'stats']);

    // Laps
    Route::get('/laps/count', [LapController::class, 'count']);
    Route::get('/laps/driver/{driver}', [LapController::class, 'byDriver']);
    Route::apiResource('laps', LapController::class);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{key}', [SettingController::class, 'update']);

    // Stats & Analytics
    Route::get('/stats/drivers', [DriverController::class, 'stats']);
    Route::get('/stats/tracks', [TrackController::class, 'stats']);
    Route::get('/stats/overview', [LapController::class, 'overview']);
    Route::get('/stats/database-metrics', [LapController::class, 'databaseMetrics']);
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
        Route::post('/upload/batch', [UploadController::class, 'batchUpload']);

        // EML Upload
        Route::post('/sessions/upload-eml', [EmlUploadController::class, 'parseEml']);
        Route::post('/sessions/save-parsed', [EmlUploadController::class, 'saveSession']);

        // User Management
        Route::get('/admin/users', [UserManagementController::class, 'index']);
        Route::post('/admin/users', [UserManagementController::class, 'store']);
        Route::put('/admin/users/{id}', [UserManagementController::class, 'update']);
        Route::delete('/admin/users/{id}', [UserManagementController::class, 'destroy']);
        Route::get('/admin/users/{userId}/available-drivers', [UserManagementController::class, 'availableDrivers']);
        Route::post('/admin/users/{userId}/drivers/{driverId}', [UserManagementController::class, 'connectDriver']);
        Route::delete('/admin/users/{userId}/drivers/{driverId}', [UserManagementController::class, 'disconnectDriver']);

        // Registration Management
        Route::get('/admin/registrations', [RegistrationController::class, 'index']);
        Route::get('/admin/registrations/pending', [RegistrationController::class, 'pending']);
        Route::post('/admin/registrations/{id}/approve', [RegistrationController::class, 'approve']);
        Route::post('/admin/registrations/{id}/reject', [RegistrationController::class, 'reject']);
        Route::delete('/admin/registrations/{id}', [RegistrationController::class, 'destroy']);
    });
});
