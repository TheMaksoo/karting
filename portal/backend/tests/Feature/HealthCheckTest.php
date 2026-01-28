<?php

/*
|--------------------------------------------------------------------------
| Health Check Tests (PEST Style)
|--------------------------------------------------------------------------
|
| These tests verify that all health check endpoints work correctly.
| They demonstrate the clean, expressive PEST testing syntax.
|
*/

describe('Health Check Endpoints', function () {

    test('basic health check returns healthy status', function () {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'healthy',
            ])
            ->assertJsonStructure([
                'status',
                'timestamp',
            ]);
    });

    test('detailed health check includes all components', function () {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
                'version',
                'environment',
                'checks' => [
                    'database',
                    'cache',
                    'storage',
                ],
                'metrics' => [
                    'memory_usage_mb',
                    'memory_peak_mb',
                    'php_version',
                    'laravel_version',
                ],
            ]);
    });

    test('readiness check verifies database connection', function () {
        $response = $this->getJson('/api/health/ready');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ready',
            ]);
    });

    test('liveness check always returns alive', function () {
        $response = $this->getJson('/api/health/live');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'alive',
            ]);
    });

});

describe('Health Check Component Verification', function () {

    test('database check returns response time', function () {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200);

        $data = $response->json();

        expect($data['checks']['database'])
            ->toHaveKey('status')
            ->toHaveKey('response_time_ms');

        expect($data['checks']['database']['status'])->toBe('healthy');
    });

    test('cache check can read and write', function () {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200);

        $data = $response->json();

        expect($data['checks']['cache']['status'])->toBe('healthy');
    });

    test('storage check can write files', function () {
        $response = $this->getJson('/api/health/detailed');

        $response->assertStatus(200);

        $data = $response->json();

        expect($data['checks']['storage']['status'])->toBe('healthy');
    });

});

describe('Health Check Metrics', function () {

    test('metrics include memory usage', function () {
        $response = $this->getJson('/api/health/detailed');

        $data = $response->json();

        expect($data['metrics']['memory_usage_mb'])->toBeFloat();
        expect($data['metrics']['memory_peak_mb'])->toBeFloat();
        expect($data['metrics']['memory_usage_mb'])->toBeLessThan(1024); // Sanity check
    });

    test('metrics include version information', function () {
        $response = $this->getJson('/api/health/detailed');

        $data = $response->json();

        expect($data['metrics']['php_version'])->toBeString();
        expect($data['metrics']['laravel_version'])->toBeString();
    });

});
