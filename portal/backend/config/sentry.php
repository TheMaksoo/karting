<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Sentry DSN
    |--------------------------------------------------------------------------
    |
    | The Data Source Name for your Sentry project. Get this from your
    | Sentry project settings page.
    |
    */

    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    /*
    |--------------------------------------------------------------------------
    | Environment
    |--------------------------------------------------------------------------
    |
    | The environment your application is currently running in.
    |
    */

    'environment' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Release
    |--------------------------------------------------------------------------
    |
    | The release version of your application. This should be a unique identifier
    | for the current version.
    |
    */

    'release' => env('APP_VERSION', null),

    /*
    |--------------------------------------------------------------------------
    | Server Name
    |--------------------------------------------------------------------------
    |
    | The server name can help identify which server an error occurred on.
    |
    */

    'server_name' => env('SENTRY_SERVER_NAME', gethostname()),

    /*
    |--------------------------------------------------------------------------
    | Sample Rate
    |--------------------------------------------------------------------------
    |
    | The percentage of errors to send to Sentry. 1.0 = 100%, 0.1 = 10%.
    |
    */

    'sample_rate' => (float) (env('SENTRY_SAMPLE_RATE', 1.0)),

    /*
    |--------------------------------------------------------------------------
    | Traces Sample Rate
    |--------------------------------------------------------------------------
    |
    | The percentage of transactions to send to Sentry for performance monitoring.
    | 1.0 = 100%, 0.1 = 10%.
    |
    */

    'traces_sample_rate' => (float) (env('SENTRY_TRACES_SAMPLE_RATE', 0.0)),

    /*
    |--------------------------------------------------------------------------
    | Breadcrumbs
    |--------------------------------------------------------------------------
    |
    | Configure which breadcrumbs should be captured.
    |
    */

    'breadcrumbs' => [
        'logs' => true,
        'sql_queries' => true,
        'sql_bindings' => env('SENTRY_BREADCRUMBS_SQL_BINDINGS_ENABLED', true),
        'sql_transaction_as_query_origin' => false,
        'queue_info' => true,
        'command_info' => true,
        'http_client_requests' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | User Context
    |--------------------------------------------------------------------------
    |
    | Automatically send user context with errors.
    |
    */

    'send_default_pii' => env('SENTRY_SEND_DEFAULT_PII', false),

    /*
    |--------------------------------------------------------------------------
    | Before Send Callback
    |--------------------------------------------------------------------------
    |
    | A callback function to filter or modify events before they are sent.
    |
    */

    'before_send' => function (Sentry\Event $event): ?Sentry\Event {
        // Don't send events in local development
        if (app()->environment('local')) {
            return null;
        }

        // Add custom user context
        if ($user = auth()->user()) {
            $event->setUser([
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role ?? 'driver',
            ]);
        }

        return $event;
    },

    /*
    |--------------------------------------------------------------------------
    | Ignored Exceptions
    |--------------------------------------------------------------------------
    |
    | Exception classes that should not be sent to Sentry.
    |
    */

    'ignore_exceptions' => [
        Illuminate\Auth\AuthenticationException::class,
        Illuminate\Auth\Access\AuthorizationException::class,
        Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
        Illuminate\Session\TokenMismatchException::class,
        Illuminate\Validation\ValidationException::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Integrations
    |--------------------------------------------------------------------------
    |
    | Configure Sentry integrations.
    |
    */

    'integrations' => [
        Sentry\Laravel\Integration::class,
    ],

];
