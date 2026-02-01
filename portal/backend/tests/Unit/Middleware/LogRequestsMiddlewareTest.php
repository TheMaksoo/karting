<?php

use App\Http\Middleware\LogRequestsMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

beforeEach(function () {
    $this->middleware = new LogRequestsMiddleware();
});

it('logs api requests', function () {
    Log::shouldReceive('info')
        ->once()
        ->with('Request completed', Mockery::on(function ($context) {
            return isset($context['method'])
                && isset($context['url'])
                && isset($context['status'])
                && isset($context['duration_ms']);
        }));

    $request = Request::create('/api/test', 'GET');
    $next = fn ($request) => new Response('OK', 200);

    $response = $this->middleware->handle($request, $next);

    expect($response)->toBeInstanceOf(Response::class);
});

it('does not log non-api requests', function () {
    Log::shouldReceive('info')->never();
    Log::shouldReceive('warning')->never();

    $request = Request::create('/home', 'GET');
    $next = fn ($request) => new Response('OK', 200);

    $response = $this->middleware->handle($request, $next);

    expect($response)->toBeInstanceOf(Response::class);
});

it('logs slow requests with warning', function () {
    Log::shouldReceive('warning')
        ->once()
        ->with('Slow request detected', Mockery::on(function ($context) {
            return isset($context['duration_ms']);
        }));

    $request = Request::create('/api/test', 'GET');
    $next = function ($request) {
        sleep(2); // Force slow request

        return new Response('OK', 200);
    };

    $response = $this->middleware->handle($request, $next);

    expect($response)->toBeInstanceOf(Response::class);
});
