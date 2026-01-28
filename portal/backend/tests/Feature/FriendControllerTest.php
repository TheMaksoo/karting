<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Friend;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FriendControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_index_returns_user_friends(): void
    {
        $friend = Driver::factory()->create();
        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/friends');

        $response->assertStatus(200)->assertJsonCount(1);
    }

    public function test_store_adds_friend(): void
    {
        $friend = Driver::factory()->create();

        $response = $this->actingAs($this->user)->postJson('/api/friends', [
            'driver_id' => $friend->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('friends', [
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend->id,
        ]);
    }

    public function test_store_prevents_duplicate_friends(): void
    {
        $friend = Driver::factory()->create();
        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/friends', [
            'driver_id' => $friend->id,
        ]);

        $response->assertStatus(400); // 400 = conflict (already friends)
    }

    public function test_destroy_removes_friend(): void
    {
        $friend = Driver::factory()->create();
        $friendship = Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/friends/{$friend->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('friends', ['id' => $friendship->id]);
    }

    public function test_get_friend_driver_ids_returns_ids(): void
    {
        $friend1 = Driver::factory()->create();
        $friend2 = Driver::factory()->create();

        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend1->id,
            'friendship_status' => 'active',
        ]);
        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend2->id,
            'friendship_status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/friends/driver-ids');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_user_cannot_see_other_users_friends(): void
    {
        $otherUser = User::factory()->create();
        $friend = Driver::factory()->create();
        Friend::create([
            'user_id' => $otherUser->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/friends');

        $response->assertStatus(200)->assertJsonCount(0);
    }
}
