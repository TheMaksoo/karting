<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for auditing user CRUD actions.
 *
 * Records create, update, and delete operations performed by users
 * for compliance and debugging purposes.
 */
class AuditMiddleware
{
    /**
     * HTTP methods that indicate data modification.
     */
    private const MODIFYING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /**
     * Handle an incoming request.
     *
     * @param  Request  $request  The incoming request
     * @param  Closure  $next  The next middleware
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only audit modifying requests
        if (! in_array($request->method(), self::MODIFYING_METHODS)) {
            return $response;
        }

        // Only audit API requests
        if (! $request->is('api/*')) {
            return $response;
        }

        // Skip if request failed
        if ($response->getStatusCode() >= 400) {
            return $response;
        }

        // Get the user if authenticated
        $user = $request->user();

        // Determine the action type
        $action = match ($request->method()) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'unknown',
        };

        // Extract resource type from URL
        $path = $request->path();
        $segments = explode('/', str_replace('api/', '', $path));
        $resourceType = $segments[0] ?? 'unknown';

        // Get resource ID if available
        $resourceId = $segments[1] ?? null;

        if ($resourceId && ! is_numeric($resourceId)) {
            $resourceId = null;
        }

        // Create audit log entry
        try {
            AuditLog::create([
                'user_id' => $user?->id,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?? '', 0, 255),
                'request_data' => $this->sanitizeRequestData($request->all()),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Don't fail the request if audit logging fails
            \Log::warning('Failed to create audit log', ['error' => $e->getMessage()]);
        }

        return $response;
    }

    /**
     * Sanitize request data by removing sensitive fields.
     *
     * @param  array<string, mixed>  $data  The request data
     *
     * @return array<string, mixed> Sanitized data
     */
    private function sanitizeRequestData(array $data): array
    {
        $sensitiveFields = ['password', 'password_confirmation', 'current_password', 'new_password', 'token', 'api_key'];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        return $data;
    }
}
