<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionAnalyticsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Driver $driver;

    protected Track $track;

    protected KartingSession $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->driver = Driver::factory()->create();
        $this->track = Track::factory()->create(['distance' => 500]);
        $this->session = KartingSession::factory()->create([
            'track_id' => $this->track->id,
            'session_date' => '2024-01-15',
        ]);

        // Connect driver to user
        $this->user->drivers()->attach($this->driver->id);
    }

    // ==================== Activity Over Time Tests ====================

    public function test_driver_activity_returns_empty_for_user_without_drivers(): void
    {
        $userWithoutDrivers = User::factory()->create();

        $response = $this->actingAs($userWithoutDrivers)
            ->getJson('/api/stats/driver-activity-over-time');

        $response->assertStatus(200)->assertJson([]);
    }

    public function test_driver_activity_returns_cumulative_laps_for_user(): void
    {
        // Create laps for the driver
        Lap::factory()->count(5)->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/driver-activity-over-time');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertNotEmpty($data);
        $this->assertEquals($this->user->name, $data[0]['driver_name']);
        $this->assertEquals(5, $data[0]['cumulative_laps']);
    }

    public function test_driver_activity_aggregates_multiple_drivers_per_account(): void
    {
        // Create second driver for same user
        $driver2 = Driver::factory()->create();
        $this->user->drivers()->attach($driver2->id);

        // Create laps for both drivers
        Lap::factory()->count(3)->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
        ]);
        Lap::factory()->count(2)->create([
            'driver_id' => $driver2->id,
            'karting_session_id' => $this->session->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/driver-activity-over-time');

        $response->assertStatus(200);
        $data = $response->json();

        // Should aggregate to 5 laps for this account
        $userEntries = collect($data)->where('driver_name', $this->user->name);
        $this->assertEquals(5, $userEntries->sum('laps_added'));
    }

    public function test_driver_activity_includes_friend_data(): void
    {
        // Create friend user with driver
        $friendUser = User::factory()->create();
        $friendDriver = Driver::factory()->create();
        $friendUser->drivers()->attach($friendDriver->id);

        // Add as friend
        $this->user->friends()->create([
            'friend_driver_id' => $friendDriver->id,
            'friendship_status' => 'active',
        ]);

        // Create laps for both
        Lap::factory()->count(3)->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
        ]);
        Lap::factory()->count(4)->create([
            'driver_id' => $friendDriver->id,
            'karting_session_id' => $this->session->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/driver-activity-over-time');

        $response->assertStatus(200);
        $data = $response->json();

        // Should have entries for both accounts
        $names = collect($data)->pluck('driver_name')->unique()->values()->all();
        $this->assertContains($this->user->name, $names);
        $this->assertContains($friendUser->name, $names);
    }

    // ==================== Heatmap Tests ====================

    public function test_heatmap_returns_tracks_and_accounts(): void
    {
        Lap::factory()->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
            'lap_time' => 30.5,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/driver-track-heatmap');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'tracks' => [['id', 'name', 'avg_speed_kmh']],
                'drivers' => [['id', 'name', 'is_account']],
                'heatmap_data',
                'max_gap',
            ]);
    }

    public function test_heatmap_returns_empty_for_user_without_data(): void
    {
        $userWithoutData = User::factory()->create();

        $response = $this->actingAs($userWithoutData)
            ->getJson('/api/stats/driver-track-heatmap');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEmpty($data['tracks']);
        $this->assertEmpty($data['drivers']);
    }

    public function test_heatmap_aggregates_best_lap_across_account_drivers(): void
    {
        // Create second driver for same user on same track
        $driver2 = Driver::factory()->create();
        $this->user->drivers()->attach($driver2->id);

        // Driver 1 has slower lap
        Lap::factory()->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
            'lap_time' => 35.0,
        ]);

        // Driver 2 has faster lap
        Lap::factory()->create([
            'driver_id' => $driver2->id,
            'karting_session_id' => $this->session->id,
            'lap_time' => 30.0,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/driver-track-heatmap');

        $response->assertStatus(200);
        $data = $response->json();

        // Should show best lap from either driver (30.0)
        $this->assertEquals(30.0, $data['heatmap_data'][0][0]['best_lap_time']);
    }

    public function test_heatmap_shows_account_name_not_driver_name(): void
    {
        Lap::factory()->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/driver-track-heatmap');

        $response->assertStatus(200);
        $data = $response->json();

        // Drivers array should contain user name, not driver name
        $this->assertEquals($this->user->name, $data['drivers'][0]['name']);
        $this->assertTrue($data['drivers'][0]['is_account']);
    }

    // ==================== Trophy Case Tests ====================

    public function test_trophy_case_requires_driver_id(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/trophy-case');

        $response->assertStatus(400)
            ->assertJson(['error' => 'driver_id is required']);
    }

    public function test_trophy_case_returns_trophy_counts(): void
    {
        // Create a session with multiple drivers
        $driver2 = Driver::factory()->create();

        // Driver 1 gets best lap (gold)
        Lap::factory()->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
            'lap_time' => 25.0,
        ]);

        // Driver 2 gets second best (silver)
        Lap::factory()->create([
            'driver_id' => $driver2->id,
            'karting_session_id' => $this->session->id,
            'lap_time' => 26.0,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/stats/trophy-case?driver_id={$this->driver->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'emblems',
                'gold',
                'silver',
                'bronze',
                'coal',
            ]);
    }

    // ==================== Trophy Details Tests ====================

    public function test_trophy_details_returns_empty_without_driver_id(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/stats/trophy-details');

        $response->assertStatus(200)
            ->assertJson([]);
    }

    public function test_trophy_details_returns_empty_without_type(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/stats/trophy-details?driver_id={$this->driver->id}");

        $response->assertStatus(200)
            ->assertJson([]);
    }

    public function test_trophy_details_returns_gold_sessions(): void
    {
        // Create session where driver wins
        $driver2 = Driver::factory()->create();

        Lap::factory()->create([
            'driver_id' => $this->driver->id,
            'karting_session_id' => $this->session->id,
            'lap_time' => 25.0,
        ]);
        Lap::factory()->create([
            'driver_id' => $driver2->id,
            'karting_session_id' => $this->session->id,
            'lap_time' => 26.0,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/stats/trophy-details?driver_id={$this->driver->id}&type=gold");

        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    // ==================== Authentication Tests ====================

    public function test_unauthenticated_user_cannot_access_activity(): void
    {
        $response = $this->getJson('/api/stats/driver-activity-over-time');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_access_heatmap(): void
    {
        $response = $this->getJson('/api/stats/driver-track-heatmap');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_access_trophies(): void
    {
        $response = $this->getJson('/api/stats/trophy-case');

        $response->assertStatus(401);
    }
}
