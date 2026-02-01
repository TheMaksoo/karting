# ADR-010: Error Tracking with Sentry

## Status

**Accepted**

## Date

2025-12-01

## Context

For production error monitoring, we needed:

- Automatic error capture and reporting
- Performance monitoring (slow transactions)
- Release tracking
- User context for debugging
- Alerting capabilities

## Decision

We chose **Sentry** for error tracking and performance monitoring.

### Configuration

```php
// config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    
    'release' => trim(exec('git log --pretty="%h" -n1 HEAD')),
    
    'environment' => env('APP_ENV', 'production'),
    
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.1),
    
    'send_default_pii' => env('SENTRY_SEND_DEFAULT_PII', false),
    
    'breadcrumbs' => [
        'logs' => true,
        'sql_queries' => true,
        'sql_bindings' => true,
        'queue_info' => true,
        'command_info' => true,
    ],
];
```

### Environment Variables

```bash
# .env
SENTRY_LARAVEL_DSN=https://xxx@sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_SEND_DEFAULT_PII=false
```

### Integration Points

```php
// app/Exceptions/Handler.php
public function report(Throwable $exception)
{
    if ($this->shouldReport($exception) && app()->bound('sentry')) {
        app('sentry')->captureException($exception);
    }
    
    parent::report($exception);
}

// Adding user context
Sentry\configureScope(function (Scope $scope): void {
    $scope->setUser([
        'id' => auth()->id(),
        'email' => auth()->user()?->email,
    ]);
});
```

### Reasons

1. **Industry Standard**: Widely used, well-documented, proven reliability.

2. **Laravel Integration**: Official `sentry/sentry-laravel` package.

3. **Performance Monitoring**: Built-in APM with transaction tracing.

4. **Release Tracking**: Correlate errors with deployments.

5. **Alerting**: Slack/Email notifications for new errors.

6. **Free Tier**: Generous free tier for small projects.

## Alternatives Considered

### Option 1: Bugsnag
- **Pros**: Good Laravel support, simple pricing
- **Cons**: Less feature-rich, smaller community

### Option 2: Rollbar
- **Pros**: Good error grouping, AI features
- **Cons**: Expensive at scale, less Laravel-specific

### Option 3: Self-hosted (Sentry)
- **Pros**: Full control, no data sharing
- **Cons**: Infrastructure overhead, maintenance burden

### Option 4: Laravel Telescope
- **Pros**: Built-in, no external service
- **Cons**: Development only, no production alerting

## Consequences

### Positive
- Instant error notifications
- Stack traces with local variables
- User impact analysis
- Performance bottleneck identification
- Release health monitoring

### Negative
- External dependency (SaaS)
- Cost at high volume
- Data sent to third party

### Neutral
- Need to filter sensitive data
- Sample rate tuning for performance data

## Sentry Features Used

| Feature | Usage |
|---------|-------|
| Error Tracking | ✅ All exceptions |
| Performance | ✅ 10% sampling |
| Releases | ✅ Git commit SHA |
| User Context | ✅ User ID only |
| Breadcrumbs | ✅ SQL, Logs, Queue |
| Alerts | ✅ Slack integration |

## Data Privacy

```php
// Scrub sensitive data
'before_send' => function (\Sentry\Event $event): ?\Sentry\Event {
    // Remove password from request data
    $request = $event->getRequest();
    if (isset($request['data']['password'])) {
        $request['data']['password'] = '[Filtered]';
        $event->setRequest($request);
    }
    return $event;
},
```

## References

- [Sentry Laravel Documentation](https://docs.sentry.io/platforms/php/guides/laravel/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Privacy and Data](https://sentry.io/privacy/)
