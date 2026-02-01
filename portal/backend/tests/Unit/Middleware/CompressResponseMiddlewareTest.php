<?php

use App\Http\Middleware\CompressResponseMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

beforeEach(function () {
    $this->middleware = new CompressResponseMiddleware();
    $this->request = Request::create('/test', 'GET');
    $this->request->headers->set('Accept-Encoding', 'gzip, deflate');
});

it('compresses response when gzip encoding is accepted', function () {
    $largeContent = json_encode(['data' => str_repeat('This is test content. ', 1000)]);
    $next = function ($request) use ($largeContent) {
        $response = new Response($largeContent);
        $response->headers->set('Content-Type', 'application/json');

        return $response;
    };

    $response = $this->middleware->handle($this->request, $next);

    expect($response->headers->get('Content-Encoding'))->toBe('gzip');
    expect($response->headers->has('Vary'))->toBeTrue();
    expect($response->headers->get('Vary'))->toContain('Accept-Encoding');
});

it('does not compress small responses', function () {
    $smallContent = 'Small';
    $next = fn ($request) => new Response($smallContent);

    $response = $this->middleware->handle($this->request, $next);

    expect($response->headers->has('Content-Encoding'))->toBeFalse();
});

it('does not compress when gzip not accepted', function () {
    $request = Request::create('/test', 'GET');
    // No Accept-Encoding header

    $largeContent = str_repeat('This is test content. ', 1000);
    $next = fn ($request) => new Response($largeContent);

    $response = $this->middleware->handle($request, $next);

    expect($response->headers->has('Content-Encoding'))->toBeFalse();
});

it('does not compress already compressed responses', function () {
    $largeContent = str_repeat('This is test content. ', 1000);
    $next = function ($request) use ($largeContent) {
        $response = new Response($largeContent);
        $response->headers->set('Content-Encoding', 'br'); // Brotli

        return $response;
    };

    $response = $this->middleware->handle($this->request, $next);

    expect($response->headers->get('Content-Encoding'))->toBe('br');
});
