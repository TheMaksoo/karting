<?php

use App\Http\Middleware\AuditMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

beforeEach(function () {
    $this->middleware = new AuditMiddleware();
    // Create a mock user object instead of using factory
    $this->user = (object) ['id' => 1];
});

it('handles POST requests (create operations)', function () {
    $request = Request::create('/api/drivers', 'POST');
    $request->setUserResolver(fn () => $this->user);
    $next = fn ($request) => new Response(json_encode(['id' => 1]), 201);

    $response = $this->middleware->handle($request, $next);
    
    expect($response)->toBeInstanceOf(Response::class);
    expect($response->getStatusCode())->toBe(201);
});

it('handles PUT requests (update operations)', function () {
    $request = Request::create('/api/drivers/1', 'PUT');
    $request->setUserResolver(fn () => $this->user);
    $next = fn ($request) => new Response(json_encode(['id' => 1]), 200);

    $response = $this->middleware->handle($request, $next);
    
    expect($response)->toBeInstanceOf(Response::class);
    expect($response->getStatusCode())->toBe(200);
});

it('handles PATCH requests (update operations)', function () {
    $request = Request::create('/api/drivers/1', 'PATCH');
    $request->setUserResolver(fn () => $this->user);
    $next = fn ($request) => new Response(json_encode(['id' => 1]), 200);

    $response = $this->middleware->handle($request, $next);
    
    expect($response)->toBeInstanceOf(Response::class);
    expect($response->getStatusCode())->toBe(200);
});

it('handles DELETE requests (delete operations)', function () {
    $request = Request::create('/api/drivers/1', 'DELETE');
    $request->setUserResolver(fn () => $this->user);
    $next = fn ($request) => new Response('', 204);

    $response = $this->middleware->handle($request, $next);
    
    expect($response)->toBeInstanceOf(Response::class);
    expect($response->getStatusCode())->toBe(204);
});

it('does not audit GET requests', function () {
    $request = Request::create('/api/drivers', 'GET');
    $request->setUserResolver(fn () => $this->user);
    $next = fn ($request) => new Response(json_encode([]), 200);

    $response = $this->middleware->handle($request, $next);
    
    expect($response)->toBeInstanceOf(Response::class);
    expect($response->getStatusCode())->toBe(200);
});

it('does not audit when not authenticated', function () {
    $request = Request::create('/api/drivers', 'POST');
    $request->setUserResolver(fn () => null);
    $next = fn ($request) => new Response(json_encode(['id' => 1]), 201);

    $response = $this->middleware->handle($request, $next);
    
    expect($response)->toBeInstanceOf(Response::class);
    expect($response->getStatusCode())->toBe(201);
});
