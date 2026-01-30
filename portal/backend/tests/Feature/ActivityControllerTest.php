<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Friend;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Driver $userDriver;

    private Track $track;

    protected function setUp(): void
    {
        parent::setUp();
        $this->track = Track::factory()->create();
        $this->userDriver = Driver::factory()->create();
        $this->user = User::factory()->create(['driver_id' => $this->userDriver->id]);
    }

    private function createSessionForDriver(Driver $driver, array $lapAttributes = []): KartingSession
    {
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        Lap::factory()->create(array_merge([
            'karting_session_id' => $session->id,
            'driver_id' => $driver->id,
            'is_best_lap' => true,
        ], $lapAttributes));

        return $session;
    }

    private function createFriendWithSession(string $status = 'active'): array
    {
        $friendDriver = Driver::factory()->create();
        $friendUser = User::factory()->create(['driver_id' => $friendDriver->id]);

        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friendDriver->id,
            'friendship_status' => $status,
        ]);

        $session = $this->createSessionForDriver($friendDriver);

        return ['driver' => $friendDriver, 'user' => $friendUser, 'session' => $session];
    }

    public function test_latest_activity_returns_user_sessions(): void
    {
        $this->createSessionForDriver($this->userDriver, ['position' => 1]);

        $response = $this->actingAs($this->user)->getJson('/api/activity/latest');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.track_name', $this->track->name);
    }

    public function test_latest_activity_returns_empty_for_user_without_drivers(): void
    {
        $userNoDriver = User::factory()->create(['driver_id' => null]);

        $response = $this->actingAs($userNoDriver)->getJson('/api/activity/latest');

        $response->assertStatus(200);
        $response->assertJson([]);
    }

    public function test_latest_activity_includes_sessions_from_connected_drivers(): void
    {
        $user = User::factory()->create(['driver_id' => null]);
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();
        $user->drivers()->attach([$driver1->id, $driver2->id]);

        $session1 = KartingSession::factory()->create(['track_id' => $this->track->id]);
        Lap::factory()->create([
            'karting_session_id' => $session1->id,
            'driver_id' => $driver1->id,
            'is_best_lap' => true,
        ]);

        $session2 = KartingSession::factory()->create(['track_id' => $this->track->id]);
        Lap::factory()->create([
            'karting_session_id' => $session2->id,
            'driver_id' => $driver2->id,
            'is_best_lap' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/activity/latest');

        $response->assertStatus(200)->assertJsonCount(2);
    }

    public function test_latest_activity_includes_friend_sessions_when_friends_only(): void
    {
        $friend = $this->createFriendWithSession('active');

        $response = $this->actingAs($this->user)->getJson('/api/activity/latest?friends_only=1');

        $response->assertStatus(200);
        $sessionIds = collect($response->json())->pluck('session_id')->toArray();
        $this->assertContains($friend['session']->id, $sessionIds);
    }

    public function test_latest_activity_expands_friend_account_to_all_drivers(): void
    {
        $friendDriver1 = Driver::factory()->create();
        $friendDriver2 = Driver::factory()->create();
        $friendUser = User::factory()->create(['driver_id' => $friendDriver1->id]);
        $friendUser->drivers()->attach($friendDriver2->id);

        // Add friend via only one of their drivers
        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friendDriver1->id,
            'friendship_status' => 'active',
        ]);

        // Create session for the OTHER friend driver (not the one in friends table)
        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        Lap::factory()->create([
            'karting_session_id' => $session->id,
            'driver_id' => $friendDriver2->id,
            'is_best_lap' => true,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/activity/latest?friends_only=1');

        $response->assertStatus(200);
        // Should include the session because friend's account is expanded
        $sessionIds = collect($response->json())->pluck('session_id')->toArray();
        $this->assertContains($session->id, $sessionIds);
    }

    public function test_latest_activity_excludes_pending_friends(): void
    {
        $friend = $this->createFriendWithSession('pending');

        $response = $this->actingAs($this->user)->getJson('/api/activity/latest');

        $response->assertStatus(200);
        $sessionIds = collect($response->json())->pluck('session_id')->toArray();
        $this->assertNotContains($friend['session']->id, $sessionIds);
    }

    public function test_latest_activity_respects_limit_parameter(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->createSessionForDriver($this->userDriver);
        }

        $response = $this->actingAs($this->user)->getJson('/api/activity/latest?limit=3');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_latest_activity_returns_results_ordered_by_position(): void
    {
        $driver2 = Driver::factory()->create();
        $this->user->drivers()->attach($driver2->id);

        $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
        Lap::factory()->create([
            'karting_session_id' => $session->id,
            'driver_id' => $this->userDriver->id,
            'is_best_lap' => true,
            'position' => 2,
            'lap_time' => 35.5,
        ]);
        Lap::factory()->create([
            'karting_session_id' => $session->id,
            'driver_id' => $driver2->id,
            'is_best_lap' => true,
            'position' => 1,
            'lap_time' => 34.5,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/activity/latest');

        $response->assertStatus(200);
        $results = $response->json('0.results');
        $this->assertEquals(1, $results[0]['position']);
        $this->assertEquals(2, $results[1]['position']);
    }

    public function test_unauthenticated_user_cannot_access_activity(): void
    {
        $response = $this->getJson('/api/activity/latest');

        $response->assertStatus(401);
    }

    public function test_latest_activity_with_default_limit(): void
    {
        // Create many sessions to test default limit
        for ($i = 0; $i < 15; $i++) {
            $session = KartingSession::factory()->create(['track_id' => $this->track->id]);
            Lap::factory()->create([
                'karting_session_id' => $session->id,
                'driver_id' => $this->userDriver->id,
                'is_best_lap' => true,
            ]);
        }

        $response = $this->actingAs($this->user)->getJson('/api/activity/latest');

        $response->assertStatus(200);
        // Default limit should be 10
        $this->assertLessThanOrEqual(10, count($response->json()));
    }
}
