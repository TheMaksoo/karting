<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class HealthController extends Controller
{
    /**
     * Basic health check endpoint for load balancers and monitoring
     */
    public function check(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Detailed health check with system component status
     */
    public function detailed(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
        ];

        $isHealthy = collect($checks)->every(fn ($check) => $check['status'] === 'healthy');

        return response()->json([
            'status' => $isHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
            'environment' => config('app.env'),
            'checks' => $checks,
            'metrics' => $this->getMetrics(),
        ], $isHealthy ? 200 : 503);
    }

    /**
     * Readiness probe for Kubernetes/container orchestration
     */
    public function ready(): JsonResponse
    {
        $dbCheck = $this->checkDatabase();
        
        if ($dbCheck['status'] !== 'healthy') {
            return response()->json([
                'status' => 'not_ready',
                'reason' => 'Database connection failed',
            ], 503);
        }

        return response()->json([
            'status' => 'ready',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Liveness probe for Kubernetes/container orchestration
     */
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'alive',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    private function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            DB::select('SELECT 1');
            $responseTime = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'healthy',
                'response_time_ms' => $responseTime,
                'driver' => config('database.default'),
            ];
        } catch (\Exception $e) {
            Log::error('Health check - Database failed', ['error' => $e->getMessage()]);
            
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function checkCache(): array
    {
        try {
            $start = microtime(true);
            $key = 'health_check_' . time();
            Cache::put($key, 'test', 10);
            $value = Cache::get($key);
            Cache::forget($key);
            $responseTime = round((microtime(true) - $start) * 1000, 2);

            if ($value !== 'test') {
                throw new \Exception('Cache read/write mismatch');
            }

            return [
                'status' => 'healthy',
                'response_time_ms' => $responseTime,
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            Log::error('Health check - Cache failed', ['error' => $e->getMessage()]);
            
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function checkStorage(): array
    {
        try {
            $start = microtime(true);
            $testFile = 'health_check_' . time() . '.txt';
            Storage::disk('local')->put($testFile, 'health check');
            $exists = Storage::disk('local')->exists($testFile);
            Storage::disk('local')->delete($testFile);
            $responseTime = round((microtime(true) - $start) * 1000, 2);

            if (!$exists) {
                throw new \Exception('Storage write verification failed');
            }

            return [
                'status' => 'healthy',
                'response_time_ms' => $responseTime,
                'disk' => config('filesystems.default'),
            ];
        } catch (\Exception $e) {
            Log::error('Health check - Storage failed', ['error' => $e->getMessage()]);
            
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function getMetrics(): array
    {
        return [
            'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            'memory_peak_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'uptime_seconds' => defined('LARAVEL_START') 
                ? round(microtime(true) - LARAVEL_START, 2) 
                : null,
        ];
    }
}
