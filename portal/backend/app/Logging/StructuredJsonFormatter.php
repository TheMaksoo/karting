<?php

namespace App\Logging;

use Monolog\Formatter\JsonFormatter;
use Monolog\LogRecord;

/**
 * Custom JSON formatter for structured logging.
 *
 * Adds additional context fields:
 * - user_id: Current authenticated user ID
 * - request_id: Unique identifier for the request
 * - trace_id: Distributed tracing ID
 * - environment: Application environment
 * - hostname: Server hostname
 */
class StructuredJsonFormatter extends JsonFormatter
{
    /**
     * Format a log record.
     */
    public function format(LogRecord $record): string
    {
        // Add custom context fields
        $record->extra['user_id'] = auth()->id() ?? null;
        $record->extra['request_id'] = request()->header('X-Request-ID') ?? uniqid('req_', true);
        $record->extra['trace_id'] = request()->header('X-Trace-ID') ?? request()->header('X-Request-ID') ?? null;
        $record->extra['environment'] = config('app.env');
        $record->extra['hostname'] = gethostname();
        $record->extra['url'] = request()->fullUrl() ?? null;
        $record->extra['method'] = request()->method() ?? null;
        $record->extra['ip'] = request()->ip() ?? null;

        return parent::format($record);
    }
}
