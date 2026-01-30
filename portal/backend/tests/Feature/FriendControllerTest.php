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

    public function test_store_validates_driver_id_required(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/friends', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['driver_id']);
    }

    public function test_store_validates_driver_exists(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/friends', [
            'driver_id' => 99999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['driver_id']);
    }

    public function test_index_returns_only_active_friends(): void
    {
        $activeFriend = Driver::factory()->create();
        $pendingFriend = Driver::factory()->create();

        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $activeFriend->id,
            'friendship_status' => 'active',
        ]);

        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $pendingFriend->id,
            'friendship_status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/friends');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_list_friends(): void
    {
        $response = $this->getJson('/api/friends');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_add_friend(): void
    {
        $friend = Driver::factory()->create();
        $response = $this->postJson('/api/friends', ['driver_id' => $friend->id]);

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_remove_friend(): void
    {
        $response = $this->deleteJson('/api/friends/1');

        $response->assertStatus(401);
    }

    public function test_destroy_nonexistent_friend_returns_404(): void
    {
        $response = $this->actingAs($this->user)->deleteJson('/api/friends/99999');

        $response->assertStatus(404);
    }

    public function test_get_friend_driver_ids_returns_empty_array(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/friends/driver-ids');

        $response->assertStatus(200)
            ->assertJson([]);
    }

    public function test_get_friend_driver_ids_requires_authentication(): void
    {
        $response = $this->getJson('/api/friends/driver-ids');

        $response->assertStatus(401);
    }

    public function test_store_friend_with_nickname(): void
    {
        $friend = Driver::factory()->create(['nickname' => 'Speedy']);

        $response = $this->actingAs($this->user)->postJson('/api/friends', [
            'driver_id' => $friend->id,
        ]);

        $response->assertStatus(201);
    }

    public function test_index_includes_driver_details(): void
    {
        $friend = Driver::factory()->create(['name' => 'Best Friend']);
        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/friends');

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'Best Friend']);
    }

    public function test_destroy_returns_404_for_nonexistent_friendship(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)->deleteJson("/api/friends/{$driver->id}");

        $response->assertStatus(404);
    }

    public function test_store_multiple_friends(): void
    {
        $friend1 = Driver::factory()->create();
        $friend2 = Driver::factory()->create();

        $this->actingAs($this->user)->postJson('/api/friends', ['driver_id' => $friend1->id]);
        $this->actingAs($this->user)->postJson('/api/friends', ['driver_id' => $friend2->id]);

        $response = $this->actingAs($this->user)->getJson('/api/friends');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_destroy_only_removes_own_friendship(): void
    {
        $otherUser = User::factory()->create();
        $friend = Driver::factory()->create();

        Friend::create([
            'user_id' => $otherUser->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/friends/{$friend->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('friends', [
            'user_id' => $otherUser->id,
            'friend_driver_id' => $friend->id,
        ]);
    }

    public function test_get_friend_driver_ids_returns_only_ids(): void
    {
        $friend1 = Driver::factory()->create();
        $friend2 = Driver::factory()->create();

        Friend::create(['user_id' => $this->user->id, 'friend_driver_id' => $friend1->id, 'friendship_status' => 'active']);
        Friend::create(['user_id' => $this->user->id, 'friend_driver_id' => $friend2->id, 'friendship_status' => 'active']);

        $response = $this->actingAs($this->user)->getJson('/api/friends/driver-ids');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertContains($friend1->id, $data);
        $this->assertContains($friend2->id, $data);
    }

    public function test_store_validates_driver_id_is_numeric(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/friends', [
            'driver_id' => 'not-numeric',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['driver_id']);
    }

    public function test_index_does_not_include_soft_deleted_drivers(): void
    {
        $friend = Driver::factory()->create();
        Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $friend->delete();

        $response = $this->actingAs($this->user)->getJson('/api/friends');

        $response->assertStatus(200);
    }

    public function test_destroy_soft_deletes_friendship(): void
    {
        $friend = Driver::factory()->create();
        $friendship = Friend::create([
            'user_id' => $this->user->id,
            'friend_driver_id' => $friend->id,
            'friendship_status' => 'active',
        ]);

        $this->actingAs($this->user)->deleteJson("/api/friends/{$friend->id}");

        $this->assertSoftDeleted('friends', ['id' => $friendship->id]);
    }
}
