<?php

namespace App\Providers;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

/**
 * Logs slow database queries for performance monitoring.
 *
 * Queries exceeding the threshold (default 1000ms) are logged
 * with full SQL, bindings, and execution time.
 */
class SlowQueryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Only enable in non-local environments or when explicitly enabled
        if (! config('database.log_slow_queries', false)) {
            return;
        }

        $threshold = config('database.slow_query_threshold', 1000); // milliseconds

        DB::listen(function (QueryExecuted $query) use ($threshold) {
            if ($query->time > $threshold) {
                Log::warning('Slow query detected', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'time' => $query->time . 'ms',
                    'connection' => $query->connectionName,
                    'user_id' => auth()->id(),
                    'url' => request()->fullUrl(),
                ]);
            }
        });
    }
}
