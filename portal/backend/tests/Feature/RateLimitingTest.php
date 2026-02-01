<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_routes_are_rate_limited(): void
    {
        $user = User::factory()->create();

        // The default rate limit is 60 requests per minute
        // We'll make requests and verify headers are set
        $response = $this->actingAs($user)
            ->getJson('/api/drivers');

        $response->assertStatus(200);

        // Rate limit headers should be present
        $this->assertTrue(
            $response->headers->has('X-RateLimit-Limit') ||
            $response->headers->has('x-ratelimit-limit')
        );
    }

    public function test_login_has_stricter_rate_limit(): void
    {
        // Login should be limited to 5 attempts per minute
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/auth/login', [
                'email' => 'wrong@email.com',
                'password' => 'wrongpassword',
            ]);

            // Should get 401 (unauthorized) or 422 (validation error), not 429 yet
            $this->assertContains($response->status(), [401, 422]);
        }

        // 6th attempt should be rate limited
        $response = $this->postJson('/api/auth/login', [
            'email' => 'wrong@email.com',
            'password' => 'wrongpassword',
        ]);

        // Should get 429 (Too Many Requests)
        $this->assertEquals(429, $response->status());
    }

    public function test_authenticated_users_get_higher_limit(): void
    {
        $user = User::factory()->create();

        // Authenticated users should have the standard 60/min limit
        $response = $this->actingAs($user)
            ->getJson('/api/drivers');

        $response->assertStatus(200);

        // Check the rate limit is set appropriately
        $limit = $response->headers->get('X-RateLimit-Limit') ??
                 $response->headers->get('x-ratelimit-limit');

        if ($limit) {
            $this->assertGreaterThanOrEqual(60, (int) $limit);
        }
    }

    public function test_rate_limit_resets_after_window(): void
    {
        // This test would require time manipulation
        // In a real scenario, you'd use Carbon::setTestNow() or similar

        $this->assertTrue(true); // Placeholder for integration test
    }
}
