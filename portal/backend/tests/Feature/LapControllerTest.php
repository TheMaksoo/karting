<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LapControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private KartingSession $session;

    private Driver $driver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $track = Track::factory()->create();
        $this->session = KartingSession::factory()->create(['track_id' => $track->id]);
        $this->driver = Driver::factory()->create();
    }

    public function test_index_returns_laps(): void
    {
        Lap::factory()->count(5)->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/laps');

        $response->assertStatus(200);
    }

    public function test_index_can_filter_by_session(): void
    {
        $session2 = KartingSession::factory()->create();
        Lap::factory()->count(3)->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
        ]);
        Lap::factory()->create([
            'karting_session_id' => $session2->id,
            'driver_id' => $this->driver->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/laps?session_id={$this->session->id}");

        $response->assertStatus(200);
    }

    public function test_store_creates_lap(): void
    {
        $data = [
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
            'lap_number' => 1,
            'lap_time' => 32.456,
            'position' => 1,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/laps', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('laps', [
            'driver_id' => $this->driver->id,
            'lap_time' => 32.456,
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/laps', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['karting_session_id', 'driver_id', 'lap_number', 'lap_time']);
    }

    public function test_show_returns_lap(): void
    {
        $lap = Lap::factory()->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/laps/{$lap->id}");

        $response->assertStatus(200)->assertJson(['id' => $lap->id]);
    }

    public function test_update_modifies_lap(): void
    {
        $lap = Lap::factory()->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
            'lap_time' => 30.0,
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/laps/{$lap->id}", [
            'lap_time' => 29.5,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('laps', ['id' => $lap->id, 'lap_time' => 29.5]);
    }

    public function test_destroy_deletes_lap(): void
    {
        $lap = Lap::factory()->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/laps/{$lap->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('laps', ['id' => $lap->id]);
    }

    public function test_by_driver_returns_driver_laps(): void
    {
        $driver2 = Driver::factory()->create();
        Lap::factory()->count(3)->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
        ]);
        Lap::factory()->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $driver2->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/laps/driver/{$this->driver->id}");

        $response->assertStatus(200);
    }

    public function test_overview_returns_aggregated_stats(): void
    {
        // Connect driver to user to make stats visible
        $this->user->drivers()->attach($this->driver->id);

        Lap::factory()->count(5)->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
            'lap_time' => 30.0,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/stats/overview');

        $response->assertStatus(200)
            ->assertJsonStructure(['total_laps', 'total_accounts', 'best_lap']);
    }

    public function test_lap_stores_sector_times(): void
    {
        $data = [
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
            'lap_number' => 1,
            'lap_time' => 30.0,
            'sector1' => 10.5,
            'sector2' => 10.0,
            'sector3' => 9.5,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/laps', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('laps', [
            'sector1' => 10.5,
            'sector2' => 10.0,
            'sector3' => 9.5,
        ]);
    }
}
