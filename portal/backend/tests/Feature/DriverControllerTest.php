<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    private function createDriverWithLaps(int $lapCount = 5): Driver
    {
        $driver = Driver::factory()->create();
        $session = KartingSession::factory()->create();
        Lap::factory()->count($lapCount)->create([
            'driver_id' => $driver->id,
            'karting_session_id' => $session->id,
        ]);

        return $driver;
    }

    public function test_index_returns_all_drivers(): void
    {
        Driver::factory()->count(3)->create();

        $response = $this->actingAs($this->user)->getJson('/api/drivers');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_index_includes_lap_count(): void
    {
        $driver = $this->createDriverWithLaps(5);

        $response = $this->actingAs($this->user)->getJson('/api/drivers');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals(5, $data[0]['laps_count']);
    }

    public function test_store_creates_driver(): void
    {
        $data = [
            'name' => 'Max Verstappen',
            'email' => 'max@redbull.com',
            'nickname' => 'Mad Max',
            'color' => '#FF0000',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/drivers', $data);

        $response->assertStatus(201)->assertJson(['name' => 'Max Verstappen']);
        $this->assertDatabaseHas('drivers', ['name' => 'Max Verstappen']);
    }

    public function test_store_validates_required_name(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'email' => 'test@test.com',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_store_validates_unique_email(): void
    {
        Driver::factory()->create(['email' => 'existing@test.com']);

        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => 'Test Driver',
            'email' => 'existing@test.com',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_show_returns_driver_with_laps(): void
    {
        $driver = $this->createDriverWithLaps(1);

        $response = $this->actingAs($this->user)->getJson("/api/drivers/{$driver->id}");

        $response->assertStatus(200)
            ->assertJson(['id' => $driver->id])
            ->assertJsonStructure(['laps']);
    }

    public function test_show_returns_404_for_nonexistent_driver(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/drivers/99999');

        $response->assertStatus(404);
    }

    public function test_update_modifies_driver(): void
    {
        $driver = Driver::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'name' => 'New Name',
        ]);

        $response->assertStatus(200)->assertJson(['name' => 'New Name']);
        $this->assertDatabaseHas('drivers', ['id' => $driver->id, 'name' => 'New Name']);
    }

    public function test_update_allows_same_email(): void
    {
        $driver = Driver::factory()->create(['email' => 'test@test.com']);

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'name' => 'Updated Name',
            'email' => 'test@test.com',
        ]);

        $response->assertStatus(200);
    }

    public function test_destroy_deletes_driver(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)->deleteJson("/api/drivers/{$driver->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
    }

    public function test_stats_returns_driver_statistics(): void
    {
        $driver = $this->createDriverWithLaps(3);
        $this->user->drivers()->attach($driver->id);

        $response = $this->actingAs($this->user)->getJson('/api/stats/drivers');

        $response->assertStatus(200)->assertJsonStructure([
            '*' => ['account_id', 'account_name', 'is_current_user', 'total_laps', 'total_sessions'],
        ]);
    }

    public function test_stats_returns_account_level_aggregation(): void
    {
        $driver1 = $this->createDriverWithLaps(2);
        $driver2 = $this->createDriverWithLaps(3);
        $this->user->drivers()->attach([$driver1->id, $driver2->id]);

        $response = $this->actingAs($this->user)->getJson('/api/stats/drivers');

        $response->assertStatus(200)->assertJsonCount(1);
        $data = $response->json();
        $this->assertEquals(5, $data[0]['total_laps']);
        $this->assertTrue($data[0]['is_current_user']);
    }

    public function test_unauthenticated_user_cannot_access_drivers(): void
    {
        $response = $this->getJson('/api/drivers');

        $response->assertStatus(401);
    }

    public function test_store_with_optional_fields(): void
    {
        $data = [
            'name' => 'Test Driver',
            'email' => 'test@example.com',
            'nickname' => 'TDriver',
            'color' => '#00FF00',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/drivers', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('drivers', [
            'nickname' => 'TDriver',
            'color' => '#00FF00',
        ]);
    }

    public function test_update_validates_email_uniqueness(): void
    {
        $driver1 = Driver::factory()->create(['email' => 'driver1@test.com']);
        $driver2 = Driver::factory()->create(['email' => 'driver2@test.com']);

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver1->id}", [
            'name' => 'Driver 1',
            'email' => 'driver2@test.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_driver_with_zero_laps(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)->getJson("/api/drivers/{$driver->id}");

        $response->assertStatus(200)
            ->assertJson(['id' => $driver->id]);
    }

    public function test_store_validates_email_format(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => 'Test Driver',
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_update_returns_404_for_nonexistent_driver(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/drivers/99999', [
            'name' => 'Updated',
        ]);

        $response->assertStatus(404);
    }

    public function test_destroy_returns_404_for_nonexistent_driver(): void
    {
        $response = $this->actingAs($this->user)->deleteJson('/api/drivers/99999');

        $response->assertStatus(404);
    }

    public function test_index_returns_empty_array(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/drivers');

        $response->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function test_store_with_all_fields(): void
    {
        $data = [
            'name' => 'Full Driver',
            'email' => 'full@example.com',
            'nickname' => 'FullD',
            'color' => '#FF00FF',
            'phone' => '1234567890',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/drivers', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('drivers', [
            'name' => 'Full Driver',
            'nickname' => 'FullD',
        ]);
    }

    public function test_update_validates_email_format(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'email' => 'invalid-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_stats_returns_empty_for_user_without_drivers(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/stats/drivers');

        $response->assertStatus(200)
            ->assertJsonCount(0);
    }
}
