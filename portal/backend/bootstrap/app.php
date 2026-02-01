<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            // Add API versioning - v1 routes
            Route::prefix('api/v1')
                ->middleware('api')
                ->group(base_path('routes/api_v1.php'));
        }
    )
    ->withMiddleware(function (Middleware $middleware) {
        // For SPA authentication with httpOnly cookies, enable CSRF on API routes
        $middleware->validateCsrfTokens(except: [
            // Allow public endpoints without CSRF
            'api/auth/login',
            'api/auth/register',
            'api/health',
            'api/health/*',
        ]);

        // Append security headers middleware to all requests
        $middleware->append(App\Http\Middleware\SecurityHeaders::class);

        // Register middleware aliases
        $middleware->alias([
            'admin' => App\Http\Middleware\CheckAdmin::class,
            'per.user.rate.limit' => App\Http\Middleware\PerUserRateLimit::class,
        ]);
    })
    ->withExceptions(function () {
        // Exception handling configured via Laravel's defaults
    })->create();
