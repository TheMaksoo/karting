<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for compressing HTTP responses.
 *
 * Applies gzip compression to JSON responses when the client
 * supports it and the response is large enough to benefit.
 */
class CompressResponseMiddleware
{
    /**
     * Minimum response size in bytes to apply compression.
     */
    private const MIN_SIZE_FOR_COMPRESSION = 1024;

    /**
     * Handle an incoming request.
     *
     * @param  Request  $request  The incoming request
     * @param  Closure  $next  The next middleware
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Check if client accepts gzip encoding
        if (! str_contains($request->header('Accept-Encoding', ''), 'gzip')) {
            return $response;
        }

        // Only compress JSON responses
        $contentType = $response->headers->get('Content-Type', '');

        if (! str_contains($contentType, 'application/json')) {
            return $response;
        }

        // Check if response is large enough to benefit from compression
        $content = $response->getContent();

        if ($content === false || strlen($content) < self::MIN_SIZE_FOR_COMPRESSION) {
            return $response;
        }

        // Compress the content
        $compressed = gzencode($content, 6);

        if ($compressed === false) {
            return $response;
        }

        // Only use compressed version if it's actually smaller
        if (strlen($compressed) >= strlen($content)) {
            return $response;
        }

        $response->setContent($compressed);
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Content-Length', (string) strlen($compressed));
        $response->headers->set('Vary', 'Accept-Encoding');

        return $response;
    }
}
