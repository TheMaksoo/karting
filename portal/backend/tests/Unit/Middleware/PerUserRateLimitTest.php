<?php

use App\Http\Middleware\PerUserRateLimit;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

beforeEach(function () {
    $this->limiter = Mockery::mock(RateLimiter::class);
    $this->middleware = new PerUserRateLimit($this->limiter);
    $this->next = fn ($request) => new Response('OK');
});

afterEach(function () {
    Mockery::close();
});

it('allows unauthenticated requests to pass through without rate limiting', function () {
    $request = Request::create('/api/test', 'GET');
    // No user set on request
    
    $response = $this->middleware->handle($request, $this->next);

    expect($response->getStatusCode())->toBe(200);
    expect($response->getContent())->toBe('OK');
});

it('rate limits authenticated users', function () {
    $request = Request::create('/api/test', 'GET');
    
    $user = new class {
        public int $id = 1;
    };
    $request->setUserResolver(fn () => $user);
    
    $this->limiter->shouldReceive('tooManyAttempts')
        ->once()
        ->andReturn(false);
    
    $this->limiter->shouldReceive('hit')
        ->once();
    
    $this->limiter->shouldReceive('attempts')
        ->once()
        ->andReturn(1);
    
    $response = $this->middleware->handle($request, $this->next);

    expect($response->getStatusCode())->toBe(200);
    expect($response->headers->has('X-RateLimit-Limit'))->toBeTrue();
    expect($response->headers->has('X-RateLimit-Remaining'))->toBeTrue();
});

it('returns 429 when rate limit is exceeded', function () {
    $request = Request::create('/api/test', 'GET');
    
    $user = new class {
        public int $id = 1;
    };
    $request->setUserResolver(fn () => $user);
    
    $this->limiter->shouldReceive('tooManyAttempts')
        ->once()
        ->andReturn(true);
    
    $this->limiter->shouldReceive('availableIn')
        ->once()
        ->andReturn(30);
    
    $response = $this->middleware->handle($request, $this->next);

    expect($response->getStatusCode())->toBe(429);
    expect($response->headers->get('Retry-After'))->toBe('30');
    expect($response->headers->get('X-RateLimit-Limit'))->toBe('60');
    expect($response->headers->get('X-RateLimit-Remaining'))->toBe('0');
    
    $content = json_decode($response->getContent(), true);
    expect($content['message'])->toBe('Too many requests. Please slow down.');
    expect($content['retry_after'])->toBe(30);
});

it('uses custom max attempts and decay minutes', function () {
    $request = Request::create('/api/test', 'GET');
    
    $user = new class {
        public int $id = 1;
    };
    $request->setUserResolver(fn () => $user);
    
    $customMaxAttempts = 100;
    $customDecayMinutes = 5;
    
    $this->limiter->shouldReceive('tooManyAttempts')
        ->with(Mockery::any(), $customMaxAttempts)
        ->once()
        ->andReturn(false);
    
    $this->limiter->shouldReceive('hit')
        ->with(Mockery::any(), $customDecayMinutes * 60)
        ->once();
    
    $this->limiter->shouldReceive('attempts')
        ->once()
        ->andReturn(10);
    
    $response = $this->middleware->handle($request, $this->next, $customMaxAttempts, $customDecayMinutes);

    expect($response->getStatusCode())->toBe(200);
    expect($response->headers->get('X-RateLimit-Limit'))->toBe((string) $customMaxAttempts);
    expect($response->headers->get('X-RateLimit-Remaining'))->toBe('90');
});

it('calculates remaining attempts correctly', function () {
    $request = Request::create('/api/test', 'GET');
    
    $user = new class {
        public int $id = 1;
    };
    $request->setUserResolver(fn () => $user);
    
    $maxAttempts = 60;
    $currentAttempts = 45;
    
    $this->limiter->shouldReceive('tooManyAttempts')
        ->once()
        ->andReturn(false);
    
    $this->limiter->shouldReceive('hit')
        ->once();
    
    $this->limiter->shouldReceive('attempts')
        ->once()
        ->andReturn($currentAttempts);
    
    $response = $this->middleware->handle($request, $this->next);

    expect($response->headers->get('X-RateLimit-Remaining'))->toBe((string) ($maxAttempts - $currentAttempts));
});

it('handles zero remaining attempts correctly', function () {
    $request = Request::create('/api/test', 'GET');
    
    $user = new class {
        public int $id = 1;
    };
    $request->setUserResolver(fn () => $user);
    
    $this->limiter->shouldReceive('tooManyAttempts')
        ->once()
        ->andReturn(false);
    
    $this->limiter->shouldReceive('hit')
        ->once();
    
    $this->limiter->shouldReceive('attempts')
        ->once()
        ->andReturn(60);
    
    $response = $this->middleware->handle($request, $this->next);

    expect($response->headers->get('X-RateLimit-Remaining'))->toBe('0');
});

it('handles attempts exceeding max without going negative', function () {
    $request = Request::create('/api/test', 'GET');
    
    $user = new class {
        public int $id = 1;
    };
    $request->setUserResolver(fn () => $user);
    
    $this->limiter->shouldReceive('tooManyAttempts')
        ->once()
        ->andReturn(false);
    
    $this->limiter->shouldReceive('hit')
        ->once();
    
    // Return more attempts than max (edge case)
    $this->limiter->shouldReceive('attempts')
        ->once()
        ->andReturn(100);
    
    $response = $this->middleware->handle($request, $this->next);

    // Should not go negative, should be 0
    expect($response->headers->get('X-RateLimit-Remaining'))->toBe('0');
});
