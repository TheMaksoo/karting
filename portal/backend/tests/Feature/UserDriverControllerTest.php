<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDriverControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    // ==================== Index Tests ====================

    public function test_index_returns_empty_for_user_without_drivers(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/user/drivers');

        $response->assertStatus(200)->assertJson([]);
    }

    public function test_index_returns_connected_drivers(): void
    {
        $driver = Driver::factory()->create();
        $this->user->drivers()->attach($driver->id, ['is_primary' => true]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/user/drivers');

        $response->assertStatus(200)
            ->assertJsonCount(1);

        $data = $response->json();
        $this->assertEquals($driver->id, $data[0]['id']);
        $this->assertTrue((bool) $data[0]['is_primary']);
    }

    public function test_index_includes_lap_count(): void
    {
        $driver = Driver::factory()->create();
        $this->user->drivers()->attach($driver->id);

        $response = $this->actingAs($this->user)
            ->getJson('/api/user/drivers');

        $response->assertStatus(200)
            ->assertJsonStructure([['id', 'name', 'laps_count', 'is_primary']]);
    }

    // ==================== Attach Tests ====================

    public function test_attach_connects_driver_to_user(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->postJson("/api/user/drivers/{$driver->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Driver connected successfully']);

        $this->assertTrue($this->user->drivers()->where('driver_id', $driver->id)->exists());
    }

    public function test_attach_first_driver_becomes_primary(): void
    {
        $driver = Driver::factory()->create();

        $this->actingAs($this->user)
            ->postJson("/api/user/drivers/{$driver->id}");

        $this->user->refresh();
        $this->assertEquals($driver->id, $this->user->driver_id);
        $this->assertTrue(
            (bool) $this->user->drivers()->where('driver_id', $driver->id)->first()->pivot->is_primary
        );
    }

    public function test_attach_second_driver_is_not_primary(): void
    {
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();

        // Attach first driver
        $this->user->drivers()->attach($driver1->id, ['is_primary' => true]);
        $this->user->driver_id = $driver1->id;
        $this->user->save();

        // Attach second driver
        $this->actingAs($this->user)
            ->postJson("/api/user/drivers/{$driver2->id}");

        $this->assertFalse(
            (bool) $this->user->drivers()->where('driver_id', $driver2->id)->first()->pivot->is_primary
        );
    }

    public function test_attach_prevents_duplicate_connection(): void
    {
        $driver = Driver::factory()->create();
        $this->user->drivers()->attach($driver->id);

        $response = $this->actingAs($this->user)
            ->postJson("/api/user/drivers/{$driver->id}");

        $response->assertStatus(409)
            ->assertJson(['message' => 'Driver already connected to your account']);
    }

    // ==================== Detach Tests ====================

    public function test_detach_removes_driver_connection(): void
    {
        $driver = Driver::factory()->create();
        $this->user->drivers()->attach($driver->id, ['is_primary' => true]);
        $this->user->driver_id = $driver->id;
        $this->user->save();

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/user/drivers/{$driver->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Driver disconnected successfully']);

        $this->assertFalse($this->user->drivers()->where('driver_id', $driver->id)->exists());
    }

    public function test_detach_clears_primary_driver_id(): void
    {
        $driver = Driver::factory()->create();
        $this->user->drivers()->attach($driver->id, ['is_primary' => true]);
        $this->user->driver_id = $driver->id;
        $this->user->save();

        $this->actingAs($this->user)
            ->deleteJson("/api/user/drivers/{$driver->id}");

        $this->user->refresh();
        $this->assertNull($this->user->driver_id);
    }

    public function test_detach_fails_for_nonconnected_driver(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/user/drivers/{$driver->id}");

        $response->assertStatus(404)
            ->assertJson(['message' => 'Driver not connected to your account']);
    }

    public function test_detach_primary_fails_when_other_drivers_exist(): void
    {
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();

        $this->user->drivers()->attach($driver1->id, ['is_primary' => true]);
        $this->user->drivers()->attach($driver2->id, ['is_primary' => false]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/user/drivers/{$driver1->id}");

        $response->assertStatus(400)
            ->assertJson(['message' => 'Cannot disconnect primary driver. Set another driver as primary first.']);
    }

    // ==================== Set Primary Tests ====================

    public function test_set_primary_updates_primary_driver(): void
    {
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();

        $this->user->drivers()->attach($driver1->id, ['is_primary' => true]);
        $this->user->drivers()->attach($driver2->id, ['is_primary' => false]);
        $this->user->driver_id = $driver1->id;
        $this->user->save();

        $response = $this->actingAs($this->user)
            ->postJson("/api/user/drivers/{$driver2->id}/set-main");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Primary driver updated successfully']);

        $this->user->refresh();
        $this->assertEquals($driver2->id, $this->user->driver_id);
    }

    public function test_set_primary_updates_pivot_table(): void
    {
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();

        $this->user->drivers()->attach($driver1->id, ['is_primary' => true]);
        $this->user->drivers()->attach($driver2->id, ['is_primary' => false]);

        $this->actingAs($this->user)
            ->postJson("/api/user/drivers/{$driver2->id}/set-main");

        // Old primary should be false
        $this->assertFalse(
            (bool) $this->user->drivers()->where('driver_id', $driver1->id)->first()->pivot->is_primary
        );
        // New primary should be true
        $this->assertTrue(
            (bool) $this->user->drivers()->where('driver_id', $driver2->id)->first()->pivot->is_primary
        );
    }

    public function test_set_primary_fails_for_nonconnected_driver(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->postJson("/api/user/drivers/{$driver->id}/set-main");

        $response->assertStatus(404)
            ->assertJson(['message' => 'Driver not connected to your account']);
    }

    // ==================== Authentication Tests ====================

    public function test_unauthenticated_user_cannot_access_drivers(): void
    {
        $response = $this->getJson('/api/user/drivers');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_attach_driver(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->postJson("/api/user/drivers/{$driver->id}");

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_detach_driver(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->deleteJson("/api/user/drivers/{$driver->id}");

        $response->assertStatus(401);
    }
}
