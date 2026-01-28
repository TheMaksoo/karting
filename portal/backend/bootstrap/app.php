<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Exclude API routes from CSRF verification (stateless token authentication)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Append security headers middleware to all requests
        $middleware->append(App\Http\Middleware\SecurityHeaders::class);

        // Register middleware aliases
        $middleware->alias([
            'admin' => App\Http\Middleware\CheckAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
