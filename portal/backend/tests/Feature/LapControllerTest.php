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

    private function createLaps(int $count = 1, array $attributes = []): void
    {
        Lap::factory()->count($count)->create(array_merge([
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
        ], $attributes));
    }

    public function test_index_returns_laps(): void
    {
        $this->createLaps(5);

        $response = $this->actingAs($this->user)->getJson('/api/laps');

        $response->assertStatus(200);
    }

    public function test_index_can_filter_by_session(): void
    {
        $session2 = KartingSession::factory()->create();
        $this->createLaps(3);
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
        $this->createLaps(3);
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
        $this->user->drivers()->attach($this->driver->id);
        $this->createLaps(5, ['lap_time' => 30.0]);

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

    public function test_count_returns_total_laps(): void
    {
        $this->createLaps(15);

        $response = $this->actingAs($this->user)->getJson('/api/laps/count');

        $response->assertStatus(200)
            ->assertJson(['total' => 15]);
    }

    public function test_database_metrics_returns_statistics(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/stats/database-metrics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_data_points',
                'breakdown' => [
                    'laps',
                    'sessions',
                    'drivers',
                    'tracks',
                    'users',
                ],
            ]);
    }

    public function test_index_can_filter_by_track(): void
    {
        $track2 = Track::factory()->create();
        $session2 = KartingSession::factory()->create(['track_id' => $track2->id]);

        $this->createLaps(3);
        Lap::factory()->count(2)->create([
            'karting_session_id' => $session2->id,
            'driver_id' => $this->driver->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/laps?track_id={$this->session->track_id}");

        $response->assertStatus(200);
    }

    public function test_index_can_filter_by_driver(): void
    {
        $driver2 = Driver::factory()->create();
        $this->createLaps(3);
        Lap::factory()->count(2)->create([
            'karting_session_id' => $this->session->id,
            'driver_id' => $driver2->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/laps?driver_id={$this->driver->id}");

        $response->assertStatus(200);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidForeignKeyProvider')]
    public function test_store_validates_foreign_keys(string $field, int $invalidId): void
    {
        $data = [
            'karting_session_id' => $this->session->id,
            'driver_id' => $this->driver->id,
            'lap_number' => 1,
            'lap_time' => 30.0,
            $field => $invalidId,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/laps', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([$field]);
    }

    public static function invalidForeignKeyProvider(): array
    {
        return [
            'invalid session' => ['karting_session_id', 99999],
            'invalid driver' => ['driver_id', 99999],
        ];
    }

    public function test_unauthenticated_user_cannot_access_laps(): void
    {
        $response = $this->getJson('/api/laps');

        $response->assertStatus(401);
    }
}
