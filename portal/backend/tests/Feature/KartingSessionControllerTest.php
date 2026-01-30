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
}
