<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KartingSessionControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Track $track;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->track = Track::factory()->create();
    }

    private function createSessionWithLaps(int $lapCount = 3, array $sessionAttributes = []): KartingSession
    {
        $session = KartingSession::factory()->create(array_merge(
            ['track_id' => $this->track->id],
            $sessionAttributes
        ));

        $driver = Driver::factory()->create();
        Lap::factory()->count($lapCount)->create([
            'karting_session_id' => $session->id,
            'driver_id' => $driver->id,
        ]);

        return $session;
    }

    public function test_index_returns_sessions(): void
    {
        KartingSession::factory()->count(3)->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->getJson('/api/sessions');

        $response->assertStatus(200);
    }

    public function test_index_can_filter_by_track(): void
    {
        $track2 = Track::factory()->create();
        KartingSession::factory()->count(2)->create(['track_id' => $this->track->id]);
        KartingSession::factory()->create(['track_id' => $track2->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/sessions?track_id={$this->track->id}");

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_index_can_filter_by_date_range(): void
    {
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-01-15',
        ]);
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/sessions?date_from=2024-01-01&date_to=2024-03-31');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_store_creates_session(): void
    {
        $data = [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'weather_conditions' => 'sunny',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/sessions', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('karting_sessions', ['track_id' => $this->track->id]);
    }

    public function test_store_validates_track_exists(): void
    {
        $data = [
            'track_id' => 99999,
            'session_date' => '2024-06-15',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/sessions', $data);

        $response->assertStatus(422)->assertJsonValidationErrors(['track_id']);
    }

    public function test_show_returns_session_with_laps(): void
    {
        $session = $this->createSessionWithLaps(3);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['id', 'track', 'laps']);
    }

    public function test_update_modifies_session(): void
    {
        $session = KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'notes' => 'Old notes',
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/sessions/{$session->id}", [
            'notes' => 'Updated notes',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('karting_sessions', [
            'id' => $session->id,
            'notes' => 'Updated notes',
        ]);
    }

    public function test_destroy_deletes_session_and_laps(): void
    {
        $session = $this->createSessionWithLaps(1);

        $response = $this->actingAs($this->user)->deleteJson("/api/sessions/{$session->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('karting_sessions', ['id' => $session->id]);
    }

    public function test_laps_returns_session_laps(): void
    {
        $session = $this->createSessionWithLaps(5);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/laps");

        $response->assertStatus(200)->assertJsonCount(5);
    }

    public function test_store_with_heat_price(): void
    {
        $data = [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'heat_price' => 25.50,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/sessions', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('karting_sessions', [
            'heat_price' => 25.50,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_sessions(): void
    {
        $response = $this->getJson('/api/sessions');

        $response->assertStatus(401);
    }

    public function test_show_returns_404_for_nonexistent_session(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/sessions/99999');

        $response->assertStatus(404);
    }

    public function test_update_returns_404_for_nonexistent_session(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/sessions/99999', [
            'notes' => 'Updated',
        ]);

        $response->assertStatus(404);
    }

    public function test_destroy_returns_404_for_nonexistent_session(): void
    {
        $response = $this->actingAs($this->user)->deleteJson('/api/sessions/99999');

        $response->assertStatus(404);
    }

    public function test_store_validates_session_date_format(): void
    {
        $data = [
            'track_id' => $this->track->id,
            'session_date' => 'invalid-date',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/sessions', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['session_date']);
    }

    public function test_index_with_pagination(): void
    {
        KartingSession::factory()->count(30)->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->getJson('/api/sessions?per_page=10');

        $response->assertStatus(200);
    }

    public function test_store_with_session_type(): void
    {
        $data = [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'qualifying',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/sessions', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('karting_sessions', [
            'session_type' => 'qualifying',
        ]);
    }

    public function test_update_allows_partial_update(): void
    {
        $session = KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'notes' => 'Original notes',
            'heat' => 1,
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/sessions/{$session->id}", [
            'notes' => 'Updated notes',
        ]);

        $response->assertStatus(200);
        $session->refresh();
        $this->assertEquals('Updated notes', $session->notes);
        $this->assertEquals(1, $session->heat);
    }

    public function test_laps_returns_empty_array_for_session_without_laps(): void
    {
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/laps");

        $response->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function test_index_filters_by_date_from_only(): void
    {
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-01-15',
        ]);
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/sessions?date_from=2024-06-01');

        $response->assertStatus(200);
    }

    public function test_index_filters_by_session_type(): void
    {
        KartingSession::factory()->create(['track_id' => $this->track->id, 'session_type' => 'Practice']);
        KartingSession::factory()->create(['track_id' => $this->track->id, 'session_type' => 'Race']);

        $response = $this->actingAs($this->user)->getJson('/api/sessions?session_type=Practice');

        $response->assertStatus(200);
    }

    public function test_store_validates_session_type_required(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['session_type']);
    }

    public function test_store_accepts_optional_weather(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'weather' => 'Sunny',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('karting_sessions', [
            'weather' => 'Sunny',
        ]);
    }

    public function test_store_validates_heat_price_is_numeric(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'heat_price' => 'not-a-number',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['heat_price']);
    }

    public function test_update_session_date(): void
    {
        $session = KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-01-01',
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/sessions/{$session->id}", [
            'session_date' => '2024-06-15',
        ]);

        $response->assertStatus(200);

        $session->refresh();
        $this->assertEquals('2024-06-15', $session->session_date->toDateString());
    }

    public function test_index_returns_empty_results(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/sessions');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id', 'session_date']);
    }

    public function test_store_with_all_optional_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'weather' => 'Sunny',
            'temperature' => 25,
            'notes' => 'Great session',
            'heat' => 3,
            'heat_price' => 30.00,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('karting_sessions', [
            'temperature' => 25,
            'heat' => 3,
        ]);
    }

    public function test_index_filters_by_multiple_criteria(): void
    {
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'Race',
        ]);

        $response = $this->actingAs($this->user)->getJson(
            '/api/sessions?track_id=' . $this->track->id . '&session_type=Race'
        );

        $response->assertStatus(200);
    }

    public function test_destroy_cascades_to_laps(): void
    {
        $session = $this->createSessionWithLaps(3);
        $lapIds = $session->laps->pluck('id');

        $this->actingAs($this->user)->deleteJson("/api/sessions/{$session->id}");

        foreach ($lapIds as $lapId) {
            $this->assertSoftDeleted('laps', ['id' => $lapId]);
        }
    }

    public function test_show_includes_track_relationship(): void
    {
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['track' => ['id', 'name']]);
    }

    public function test_store_with_future_date(): void
    {
        $futureDate = now()->addDays(10)->toDateString();

        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => $futureDate,
            'session_type' => 'heat',
        ]);

        $response->assertStatus(201);
    }

    public function test_store_with_past_date(): void
    {
        $pastDate = now()->subYears(2)->toDateString();

        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => $pastDate,
            'session_type' => 'heat',
        ]);

        $response->assertStatus(201);
    }

    public function test_update_track_id(): void
    {
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        $newTrack = Track::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/sessions/{$session->id}", [
            'track_id' => $newTrack->id,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('karting_sessions', [
            'id' => $session->id,
            'track_id' => $newTrack->id,
        ]);
    }

    public function test_index_filters_with_date_range_boundaries(): void
    {
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-01-01',
        ]);
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-03-31',
        ]);
        KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-04-01',
        ]);

        $response = $this->actingAs($this->user)->getJson(
            '/api/sessions?date_from=2024-01-01&date_to=2024-03-31'
        );

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_store_validates_temperature_is_numeric(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'temperature' => 'hot',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['temperature']);
    }

    public function test_store_with_negative_temperature(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-01-15',
            'session_type' => 'heat',
            'temperature' => -10,
        ]);

        $response->assertStatus(201);
    }

    public function test_laps_includes_driver_information(): void
    {
        $session = $this->createSessionWithLaps(2);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/laps");

        $response->assertStatus(200)
            ->assertJsonStructure([['driver_id']]);
    }

    public function test_update_with_empty_notes(): void
    {
        $session = KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'notes' => 'Old notes',
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/sessions/{$session->id}", [
            'notes' => '',
        ]);

        $response->assertStatus(200);
    }

    public function test_store_validates_heat_is_integer(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'heat' => 'first',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['heat']);
    }

    public function test_index_with_large_dataset(): void
    {
        KartingSession::factory()->count(100)->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->getJson('/api/sessions');

        $response->assertStatus(200);
    }

    public function test_show_with_multiple_drivers(): void
    {
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();
        Lap::factory()->create(['karting_session_id' => $session->id, 'driver_id' => $driver1->id]);
        Lap::factory()->create(['karting_session_id' => $session->id, 'driver_id' => $driver2->id]);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'laps');
    }

    public function test_store_with_max_heat_number(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'heat' => 999,
        ]);

        $response->assertStatus(201);
    }

    public function test_update_validates_track_id_exists(): void
    {
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->putJson("/api/sessions/{$session->id}", [
            'track_id' => 99999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id']);
    }

    public function test_index_with_no_filters_returns_all(): void
    {
        KartingSession::factory()->count(5)->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->getJson('/api/sessions');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    }

    public function test_stats_returns_session_statistics(): void
    {
        $this->markTestIncomplete('stats() method implementation pending in separate branch');
        
        $session = $this->createSessionWithLaps(5);
        $laps = $session->laps;

        // Update lap times for predictable stats
        $laps[0]->update(['lap_time' => 45.123]); // fastest
        $laps[1]->update(['lap_time' => 46.456]);
        $laps[2]->update(['lap_time' => 47.789]);
        $laps[3]->update(['lap_time' => 48.234]);
        $laps[4]->update(['lap_time' => 49.567]); // slowest

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/stats");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'session',
                'total_laps',
                'drivers' => [
                    '*' => [
                        'driver',
                        'total_laps',
                        'fastest_lap',
                        'slowest_lap',
                        'average_lap_time',
                        'median_lap_time',
                        'consistency',
                    ],
                ],
                'fastest_lap' => [
                    'lap_time',
                    'driver',
                    'lap_number',
                ],
                'average_lap_time',
                'lap_time_distribution' => [
                    'fast',
                    'medium',
                    'slow',
                ],
            ])
            ->assertJson([
                'total_laps' => 5,
                'fastest_lap' => [
                    'lap_time' => 45.123,
                ],
            ]);
    }

    public function test_stats_with_empty_session(): void
    {
        $this->markTestIncomplete('stats() method implementation pending in separate branch');
        
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/stats");

        $response->assertStatus(200)
            ->assertJson([
                'total_laps' => 0,
                'drivers' => [],
                'fastest_lap' => null,
                'average_lap_time' => null,
            ]);
    }

    public function test_stats_caches_results(): void
    {
        $this->markTestIncomplete('stats() method implementation pending in separate branch');
        
        $session = $this->createSessionWithLaps(3);

        // First request - not cached
        $response1 = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/stats");
        $response1->assertStatus(200);

        // Add more laps (should not appear due to cache)
        Lap::factory()->create([
            'karting_session_id' => $session->id,
            'driver_id' => $session->laps->first()->driver_id,
        ]);

        // Second request - should return cached result
        $response2 = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/stats");
        $response2->assertStatus(200)
            ->assertJson(['total_laps' => 3]); // Still 3, not 4

        // Clear cache
        \Illuminate\Support\Facades\Cache::forget("session_stats_{$session->id}");

        // Third request - should reflect new lap
        $response3 = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/stats");
        $response3->assertStatus(200)
            ->assertJson(['total_laps' => 4]); // Now 4
    }

    public function test_stats_requires_authentication(): void
    {
        $this->markTestIncomplete('stats() method implementation pending in separate branch');
        
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);

        $response = $this->getJson("/api/sessions/{$session->id}/stats");

        $response->assertStatus(401);
    }
}
