<?php

namespace Tests\Feature;

use App\Models\Track;
use App\Models\User;
use App\Models\UserTrackNickname;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Track $track;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->track = Track::factory()->create(['name' => 'Test Track']);
    }

    public function test_user_can_get_their_settings(): void
    {
        $this->user->update(['display_name' => 'TestUser']);

        UserTrackNickname::create([
            'user_id' => $this->user->id,
            'track_id' => $this->track->id,
            'nickname' => 'My Favorite Track',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/user/settings');

        $response->assertStatus(200)
            ->assertJson([
                'display_name' => 'TestUser',
                'track_nicknames' => [
                    [
                        'track_id' => $this->track->id,
                        'track_name' => 'Test Track',
                        'nickname' => 'My Favorite Track',
                    ],
                ],
            ]);
    }

    public function test_user_settings_returns_empty_track_nicknames(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/user/settings');

        $response->assertStatus(200)
            ->assertJson([
                'track_nicknames' => [],
            ]);
    }

    public function test_user_can_update_display_name(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/user/display-name', [
            'display_name' => 'Cool Racer',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'display_name' => 'Cool Racer',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'display_name' => 'Cool Racer',
        ]);
    }

    public function test_update_display_name_requires_display_name(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/user/display-name', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['display_name']);
    }

    public function test_display_name_must_be_string(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/user/display-name', [
            'display_name' => 123,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['display_name']);
    }

    public function test_display_name_cannot_exceed_255_characters(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/user/display-name', [
            'display_name' => str_repeat('a', 256),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['display_name']);
    }

    public function test_user_can_set_track_nickname(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/user/track-nickname', [
            'track_id' => $this->track->id,
            'nickname' => 'My Home Track',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'track_nickname' => [
                    'track_id' => $this->track->id,
                    'nickname' => 'My Home Track',
                ],
            ]);

        $this->assertDatabaseHas('user_track_nicknames', [
            'user_id' => $this->user->id,
            'track_id' => $this->track->id,
            'nickname' => 'My Home Track',
        ]);
    }

    public function test_user_can_update_existing_track_nickname(): void
    {
        UserTrackNickname::create([
            'user_id' => $this->user->id,
            'track_id' => $this->track->id,
            'nickname' => 'Old Nickname',
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/user/track-nickname', [
            'track_id' => $this->track->id,
            'nickname' => 'New Nickname',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('user_track_nicknames', [
            'user_id' => $this->user->id,
            'track_id' => $this->track->id,
            'nickname' => 'New Nickname',
        ]);

        $this->assertEquals(1, UserTrackNickname::where('user_id', $this->user->id)
            ->where('track_id', $this->track->id)->count());
    }

    public function test_set_track_nickname_requires_track_id(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/user/track-nickname', [
            'nickname' => 'Test',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id']);
    }

    public function test_set_track_nickname_requires_valid_track(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/user/track-nickname', [
            'track_id' => 99999,
            'nickname' => 'Test',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id']);
    }

    public function test_set_track_nickname_requires_nickname(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/user/track-nickname', [
            'track_id' => $this->track->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nickname']);
    }

    public function test_track_nickname_cannot_exceed_255_characters(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/user/track-nickname', [
            'track_id' => $this->track->id,
            'nickname' => str_repeat('a', 256),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nickname']);
    }

    public function test_user_can_delete_track_nickname(): void
    {
        $trackNickname = UserTrackNickname::create([
            'user_id' => $this->user->id,
            'track_id' => $this->track->id,
            'nickname' => 'Test Nickname',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/user/track-nickname/{$trackNickname->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('user_track_nicknames', [
            'id' => $trackNickname->id,
        ]);
    }

    public function test_user_cannot_delete_another_users_track_nickname(): void
    {
        $otherUser = User::factory()->create();
        $trackNickname = UserTrackNickname::create([
            'user_id' => $otherUser->id,
            'track_id' => $this->track->id,
            'nickname' => 'Other User Nickname',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/user/track-nickname/{$trackNickname->id}");

        $response->assertStatus(404);

        $this->assertDatabaseHas('user_track_nicknames', [
            'id' => $trackNickname->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_settings(): void
    {
        $response = $this->getJson('/api/user/settings');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_update_display_name(): void
    {
        $response = $this->putJson('/api/user/display-name', [
            'display_name' => 'Test',
        ]);

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_set_track_nickname(): void
    {
        $response = $this->postJson('/api/user/track-nickname', [
            'track_id' => $this->track->id,
            'nickname' => 'Test',
        ]);

        $response->assertStatus(401);
    }
}
