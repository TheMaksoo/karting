<?php

use App\Http\Middleware\CheckAdmin;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

beforeEach(function () {
    $this->middleware = new CheckAdmin();
    $this->request = Request::create('/api/admin/test', 'GET');
    $this->next = fn ($request) => new Response('OK');
});

it('returns 401 for unauthenticated user', function () {
    // No user set on request
    $response = $this->middleware->handle($this->request, $this->next);

    expect($response->getStatusCode())->toBe(401);
    
    $content = json_decode($response->getContent(), true);
    expect($content['success'])->toBeFalse();
    expect($content['message'])->toBe('Unauthenticated');
});

it('returns 403 for non-admin user', function () {
    // Create a mock user with non-admin role
    $user = new class {
        public string $role = 'user';
        public int $id = 1;
    };
    
    $this->request->setUserResolver(fn () => $user);
    
    $response = $this->middleware->handle($this->request, $this->next);

    expect($response->getStatusCode())->toBe(403);
    
    $content = json_decode($response->getContent(), true);
    expect($content['success'])->toBeFalse();
    expect($content['message'])->toBe('Access denied. Admin privileges required.');
});

it('allows admin user to pass through', function () {
    // Create a mock admin user
    $user = new class {
        public string $role = 'admin';
        public int $id = 1;
    };
    
    $this->request->setUserResolver(fn () => $user);
    
    $response = $this->middleware->handle($this->request, $this->next);

    expect($response->getStatusCode())->toBe(200);
    expect($response->getContent())->toBe('OK');
});

it('returns 403 for driver role', function () {
    $user = new class {
        public string $role = 'driver';
        public int $id = 1;
    };
    
    $this->request->setUserResolver(fn () => $user);
    
    $response = $this->middleware->handle($this->request, $this->next);

    expect($response->getStatusCode())->toBe(403);
});

it('returns 403 for empty role', function () {
    $user = new class {
        public string $role = '';
        public int $id = 1;
    };
    
    $this->request->setUserResolver(fn () => $user);
    
    $response = $this->middleware->handle($this->request, $this->next);

    expect($response->getStatusCode())->toBe(403);
});
