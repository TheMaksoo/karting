<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
    }

    public function test_admin_can_list_all_users(): void
    {
        User::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)->getJson('/api/admin/users');

        $response->assertStatus(200)
            ->assertJsonCount(6); // 5 + admin
    }

    public function test_admin_can_create_user(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/users', [
                'name' => 'New User',
                'email' => 'newuser@example.com',
                'password' => 'password123',
                'role' => 'driver',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'role' => 'driver',
        ]);
    }

    public function test_admin_can_update_user(): void
    {
        $user = User::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/users/{$user->id}", [
                'name' => 'New Name',
                'email' => $user->email,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
        ]);
    }

    public function test_admin_can_delete_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/users/{$user->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_can_connect_driver_to_user(): void
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/users/{$user->id}/drivers/{$driver->id}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('driver_user', [
            'user_id' => $user->id,
            'driver_id' => $driver->id,
        ]);
    }

    public function test_admin_can_disconnect_driver_from_user(): void
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create();
        $user->drivers()->attach($driver->id);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/users/{$user->id}/drivers/{$driver->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('driver_user', [
            'user_id' => $user->id,
            'driver_id' => $driver->id,
        ]);
    }

    public function test_admin_can_get_available_drivers(): void
    {
        $user = User::factory()->create();
        Driver::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/users/{$user->id}/available-drivers");

        $response->assertStatus(200)
            ->assertJsonCount(5);
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $user = User::factory()->create(['role' => 'driver']);

        $response = $this->actingAs($user)->getJson('/api/admin/users');

        $response->assertStatus(403);
    }

    public function test_create_user_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/users', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_update_user_can_change_password(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/users/{$user->id}", [
                'password' => 'newpassword123',
            ]);

        $response->assertStatus(200);

        // Verify password was updated by attempting login
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'newpassword123',
        ]);

        $loginResponse->assertStatus(200);
    }

    public function test_admin_can_update_user_role(): void
    {
        $user = User::factory()->create(['role' => 'driver']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/users/{$user->id}", [
                'role' => 'admin',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'admin',
        ]);
    }

    public function test_create_user_validates_email_format(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/users', [
                'name' => 'Test User',
                'email' => 'invalid-email',
                'password' => 'password123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_create_user_validates_unique_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/users', [
                'name' => 'New User',
                'email' => 'existing@example.com',
                'password' => 'password123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_update_user_validates_email_format(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/users/{$user->id}", [
                'email' => 'not-an-email',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_update_user_allows_same_email(): void
    {
        $user = User::factory()->create(['email' => 'same@example.com']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/users/{$user->id}", [
                'email' => 'same@example.com',
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(200);
    }

    public function test_update_user_returns_404_for_nonexistent(): void
    {
        $response = $this->actingAs($this->admin)
            ->putJson('/api/admin/users/99999', [
                'name' => 'Test',
            ]);

        $response->assertStatus(404);
    }

    public function test_delete_user_returns_404_for_nonexistent(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/admin/users/99999');

        $response->assertStatus(404);
    }

    public function test_connect_driver_validates_driver_exists(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/users/{$user->id}/drivers/99999");

        $response->assertStatus(404);
    }

    public function test_disconnect_driver_validates_driver_exists(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/users/{$user->id}/drivers/99999");

        $response->assertStatus(404);
    }

    public function test_connect_driver_prevents_duplicate(): void
    {
        $user = User::factory()->create();
        $driver = Driver::factory()->create();
        $user->drivers()->attach($driver->id);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/users/{$user->id}/drivers/{$driver->id}");

        $response->assertStatus(409);
    }

    public function test_available_drivers_excludes_connected(): void
    {
        $user = User::factory()->create();
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();
        $user->drivers()->attach($driver1->id);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/users/{$user->id}/available-drivers");

        $response->assertStatus(200);
        $data = $response->json();
        $ids = collect($data)->pluck('id');
        $this->assertNotContains($driver1->id, $ids);
        $this->assertContains($driver2->id, $ids);
    }

    public function test_create_user_validates_password_min_length(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/users', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => '123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_unauthenticated_user_cannot_access(): void
    {
        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(401);
    }
}
