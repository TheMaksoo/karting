<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest().extend()" function to bind a different classes or traits.
|
*/

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->extend(TestCase::class)
    ->in('Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

expect()->extend('toBeValidResponse', function () {
    return $this->toBeArray()
        ->toHaveKey('success');
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Create an authenticated user for testing
 */
function createAuthenticatedUser(array $attributes = []): \App\Models\User
{
    return \App\Models\User::factory()->create($attributes);
}

/**
 * Create a test driver
 */
function createDriver(array $attributes = []): \App\Models\Driver
{
    return \App\Models\Driver::factory()->create($attributes);
}

/**
 * Create a test track
 */
function createTrack(array $attributes = []): \App\Models\Track
{
    return \App\Models\Track::factory()->create($attributes);
}

/**
 * Create a test karting session
 */
function createSession(array $attributes = []): \App\Models\KartingSession
{
    return \App\Models\KartingSession::factory()->create($attributes);
}

/**
 * Authenticate as user and return token
 */
function actingAsUser(\App\Models\User $user): string
{
    return $user->createToken('test-token')->plainTextToken;
}
