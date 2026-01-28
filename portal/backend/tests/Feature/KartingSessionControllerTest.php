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
            ->getJson('/api/sessions?start_date=2024-01-01&end_date=2024-03-31');

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
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        $driver = Driver::factory()->create();
        Lap::factory()->count(3)->create([
            'karting_session_id' => $session->id,
            'driver_id' => $driver->id,
        ]);

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
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        $driver = Driver::factory()->create();
        Lap::factory()->create([
            'karting_session_id' => $session->id,
            'driver_id' => $driver->id,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/sessions/{$session->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('karting_sessions', ['id' => $session->id]);
        $this->assertDatabaseMissing('laps', ['karting_session_id' => $session->id]);
    }

    public function test_laps_returns_session_laps(): void
    {
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        $driver = Driver::factory()->create();
        Lap::factory()->count(5)->create([
            'karting_session_id' => $session->id,
            'driver_id' => $driver->id,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/sessions/{$session->id}/laps");

        $response->assertStatus(200)->assertJsonCount(5);
    }
}
