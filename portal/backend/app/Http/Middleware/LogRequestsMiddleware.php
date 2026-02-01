<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for logging HTTP requests.
 *
 * Logs request method, URL, IP, user agent, and response time
 * for monitoring and debugging purposes.
 */
class LogRequestsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request  The incoming request
     * @param  Closure  $next  The next middleware
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // Only log API requests
        if ($request->is('api/*')) {
            $logData = [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
                'user_agent' => substr($request->userAgent() ?? '', 0, 100),
                'status' => $response->getStatusCode(),
                'duration_ms' => $duration,
            ];

            // Log slow requests with warning level
            if ($duration > 1000) {
                Log::warning('Slow request detected', $logData);
            } else {
                Log::info('Request completed', $logData);
            }
        }

        return $response;
    }
}
