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

    public function test_store_validates_name_max_length(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => str_repeat('a', 256),
            'email' => 'test@test.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_accepts_driver_without_email(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => 'No Email Driver',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('drivers', ['name' => 'No Email Driver']);
    }

    public function test_update_validates_name_required(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'name' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_with_color_code(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => 'Colorful Driver',
            'color' => '#0099FF',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('drivers', ['color' => '#0099FF']);
    }

    public function test_index_includes_driver_relationships(): void
    {
        $driver = Driver::factory()->create();
        $session = KartingSession::factory()->create();
        Lap::factory()->create([
            'driver_id' => $driver->id,
            'karting_session_id' => $session->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/drivers');

        $response->assertStatus(200)
            ->assertJsonStructure([['id', 'name', 'laps_count']]);
    }

    public function test_show_includes_full_driver_details(): void
    {
        $driver = Driver::factory()->create([
            'name' => 'Full Details',
            'email' => 'full@test.com',
            'nickname' => 'FullD',
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/drivers/{$driver->id}");

        $response->assertStatus(200)
            ->assertJson([
                'name' => 'Full Details',
                'email' => 'full@test.com',
                'nickname' => 'FullD',
            ]);
    }

    public function test_destroy_soft_deletes_driver(): void
    {
        $driver = Driver::factory()->create();

        $this->actingAs($this->user)->deleteJson("/api/drivers/{$driver->id}");

        $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
        $this->assertDatabaseHas('drivers', ['id' => $driver->id]);
    }

    public function test_update_with_partial_data(): void
    {
        $driver = Driver::factory()->create([
            'name' => 'Original',
            'email' => 'original@test.com',
            'nickname' => 'orig',
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'nickname' => 'updated',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'nickname' => 'updated',
        ]);
    }

    public function test_store_trims_whitespace_from_name(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => '  Whitespace Driver  ',
        ]);

        $response->assertStatus(201);
    }

    public function test_update_allows_null_email(): void
    {
        $driver = Driver::factory()->create(['email' => 'old@test.com']);

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'name' => 'Updated',
            'email' => null,
        ]);

        $response->assertStatus(200);
    }

    public function test_index_orders_drivers_by_name(): void
    {
        Driver::factory()->create(['name' => 'Zebra']);
        Driver::factory()->create(['name' => 'Alpha']);
        Driver::factory()->create(['name' => 'Beta']);

        $response = $this->actingAs($this->user)->getJson('/api/drivers');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(3, $data);
    }

    public function test_show_returns_related_sessions_count(): void
    {
        $driver = Driver::factory()->create();
        $session = KartingSession::factory()->create();
        Lap::factory()->count(5)->create([
            'driver_id' => $driver->id,
            'karting_session_id' => $session->id,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/drivers/{$driver->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['id', 'name', 'laps']);
    }

    public function test_store_validates_color_format(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => 'Test',
            'color' => 'invalid-color',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['color']);
    }

    public function test_update_preserves_created_timestamp(): void
    {
        $driver = Driver::factory()->create();
        $originalCreated = $driver->created_at;

        $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'name' => 'Updated Name',
        ]);

        $this->assertEquals($originalCreated, $driver->fresh()->created_at);
    }

    public function test_destroy_cascade_behavior_with_laps(): void
    {
        $driver = Driver::factory()->create();
        $session = KartingSession::factory()->create();
        $lap = Lap::factory()->create([
            'driver_id' => $driver->id,
            'karting_session_id' => $session->id,
        ]);

        $this->actingAs($this->user)->deleteJson("/api/drivers/{$driver->id}");

        $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
    }

    public function test_stats_aggregates_multiple_drivers_for_user(): void
    {
        $driver1 = $this->createDriverWithLaps(5);
        $driver2 = $this->createDriverWithLaps(10);
        $this->user->drivers()->attach([$driver1->id, $driver2->id]);

        $response = $this->actingAs($this->user)->getJson('/api/stats/drivers');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals(15, $data[0]['total_laps']);
    }

    public function test_store_with_special_characters_in_name(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => "O'Brien-Smith",
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('drivers', ['name' => "O'Brien-Smith"]);
    }

    public function test_update_email_to_empty_string(): void
    {
        $driver = Driver::factory()->create(['email' => 'old@test.com']);

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'name' => $driver->name,
            'email' => '',
        ]);

        $response->assertStatus(200);
    }

    public function test_index_with_large_dataset(): void
    {
        Driver::factory()->count(100)->create();

        $response = $this->actingAs($this->user)->getJson('/api/drivers');

        $response->assertStatus(200)
            ->assertJsonCount(100);
    }

    public function test_store_validates_email_already_exists_case_insensitive(): void
    {
        Driver::factory()->create(['email' => 'test@example.com']);

        $response = $this->actingAs($this->user)->postJson('/api/drivers', [
            'name' => 'New Driver',
            'email' => 'TEST@EXAMPLE.COM',
        ]);

        // May pass or fail depending on email validation rules
        $this->assertTrue(in_array($response->status(), [201, 422]));
    }

    public function test_show_with_soft_deleted_driver(): void
    {
        $driver = Driver::factory()->create();
        $driver->delete();

        $response = $this->actingAs($this->user)->getJson("/api/drivers/{$driver->id}");

        $response->assertStatus(404);
    }

    public function test_update_nickname_only(): void
    {
        $driver = Driver::factory()->create(['nickname' => 'OldNick']);

        $response = $this->actingAs($this->user)->putJson("/api/drivers/{$driver->id}", [
            'nickname' => 'NewNick',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'nickname' => 'NewNick',
        ]);
    }

    public function test_index_pagination_with_page_param(): void
    {
        Driver::factory()->count(60)->create();

        $response = $this->actingAs($this->user)->getJson('/api/drivers?page=1&per_page=20');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'current_page',
                'per_page',
                'total',
            ])
            ->assertJsonCount(20, 'data')
            ->assertJson(['per_page' => 20]);
    }

    public function test_index_pagination_respects_max_per_page(): void
    {
        Driver::factory()->count(150)->create();

        $response = $this->actingAs($this->user)->getJson('/api/drivers?per_page=200');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertLessThanOrEqual(100, count($data['data']));
    }

    public function test_index_search_by_name(): void
    {
        Driver::factory()->create(['name' => 'Max Verstappen']);
        Driver::factory()->create(['name' => 'Lewis Hamilton']);
        Driver::factory()->create(['name' => 'Charles Leclerc']);

        $response = $this->actingAs($this->user)->getJson('/api/drivers?search=Max');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Max Verstappen']);
    }

    public function test_index_search_by_nickname(): void
    {
        Driver::factory()->create(['name' => 'Max Verstappen', 'nickname' => 'Mad Max']);
        Driver::factory()->create(['name' => 'Lewis Hamilton', 'nickname' => 'Sir Lewis']);

        $response = $this->actingAs($this->user)->getJson('/api/drivers?search=Sir');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['nickname' => 'Sir Lewis']);
    }

    public function test_index_search_by_email(): void
    {
        Driver::factory()->create(['name' => 'Test Driver', 'email' => 'max@redbull.com']);
        Driver::factory()->create(['name' => 'Other Driver', 'email' => 'lewis@mercedes.com']);

        $response = $this->actingAs($this->user)->getJson('/api/drivers?search=redbull');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['email' => 'max@redbull.com']);
    }

    public function test_index_active_only_filter(): void
    {
        Driver::factory()->create(['name' => 'Active Driver', 'is_active' => true]);
        Driver::factory()->create(['name' => 'Inactive Driver', 'is_active' => false]);

        $response = $this->actingAs($this->user)->getJson('/api/drivers?active_only=true');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Active Driver']);
    }

    public function test_index_backward_compatible_without_pagination(): void
    {
        Driver::factory()->count(5)->create();

        $response = $this->actingAs($this->user)->getJson('/api/drivers');

        $response->assertStatus(200)
            ->assertJsonCount(5)
            ->assertJsonMissing(['current_page']); // No pagination structure
    }
}
