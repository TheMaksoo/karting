<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'display_name' => 'JohnnyRacer',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registration submitted successfully. Please wait for admin approval.',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'registration_status' => 'pending',
        ]);
    }

    public function test_registration_requires_all_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registration_requires_valid_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_prevents_duplicate_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_admin_can_view_pending_registrations(): void
    {
        User::factory()->pending()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/registrations/pending');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_admin_can_approve_registration(): void
    {
        $user = User::factory()->pending()->create();
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/approve", [
                'role' => 'driver',
                'driver_ids' => [$driver->id],
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'registration_status' => 'approved',
            'approved_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('driver_user', [
            'user_id' => $user->id,
            'driver_id' => $driver->id,
        ]);
    }

    public function test_admin_can_reject_registration(): void
    {
        $user = User::factory()->pending()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/reject");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'registration_status' => 'rejected',
        ]);
    }

    public function test_admin_can_delete_rejected_registration(): void
    {
        $user = User::factory()->rejected()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/registrations/{$user->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_cannot_delete_approved_user(): void
    {
        $user = User::factory()->create(['registration_status' => 'approved']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/registrations/{$user->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_admin_can_view_all_registrations(): void
    {
        User::factory()->pending()->count(2)->create();
        User::factory()->create(['registration_status' => 'approved']);
        User::factory()->rejected()->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/registrations');

        $response->assertStatus(200)
            ->assertJsonCount(5); // 2 pending + 1 approved + 1 rejected + 1 admin
    }

    public function test_non_admin_cannot_access_registrations(): void
    {
        $user = User::factory()->create(['role' => 'driver']);

        $response = $this->actingAs($user)
            ->getJson('/api/admin/registrations/pending');

        $response->assertStatus(403);
    }

    public function test_cannot_approve_already_processed_registration(): void
    {
        $user = User::factory()->create(['registration_status' => 'approved']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/approve", [
                'role' => 'driver',
            ]);

        $response->assertStatus(400)
            ->assertJson(['success' => false]);
    }

    public function test_registration_validates_name_required(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_registration_validates_password_min_length(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_approve_nonexistent_registration(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/admin/registrations/99999/approve', [
            'role' => 'driver',
        ]);

        $response->assertStatus(404);
    }

    public function test_reject_nonexistent_registration(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/admin/registrations/99999/reject');

        $response->assertStatus(404);
    }

    public function test_delete_nonexistent_registration(): void
    {
        $response = $this->actingAs($this->admin)->deleteJson('/api/admin/registrations/99999');

        $response->assertStatus(404);
    }

    public function test_approve_with_multiple_drivers(): void
    {
        $user = User::factory()->pending()->create();
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/approve", [
                'role' => 'driver',
                'driver_ids' => [$driver1->id, $driver2->id],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('driver_user', ['user_id' => $user->id, 'driver_id' => $driver1->id]);
        $this->assertDatabaseHas('driver_user', ['user_id' => $user->id, 'driver_id' => $driver2->id]);
    }

    public function test_approve_without_drivers(): void
    {
        $user = User::factory()->pending()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/approve", [
                'role' => 'driver',
            ]);

        $response->assertStatus(200);
    }

    public function test_approve_validates_role_required(): void
    {
        $user = User::factory()->pending()->create();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/approve", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_registration_sets_correct_status(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'registration_status' => 'pending',
        ]);
    }

    public function test_approve_sets_approved_by(): void
    {
        $user = User::factory()->pending()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/approve", [
                'role' => 'driver',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'approved_by' => $this->admin->id,
        ]);
    }

    public function test_reject_sets_status(): void
    {
        $user = User::factory()->pending()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/reject");

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'registration_status' => 'rejected',
        ]);
    }

    public function test_pending_registrations_only_shows_pending(): void
    {
        User::factory()->pending()->count(2)->create();
        User::factory()->create(['registration_status' => 'approved']);
        User::factory()->rejected()->create();

        $response = $this->actingAs($this->admin)->getJson('/api/admin/registrations/pending');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_registration_with_display_name(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'display_name' => 'JD123',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'display_name' => 'JD123',
        ]);
    }

    public function test_unauthenticated_cannot_view_registrations(): void
    {
        $response = $this->getJson('/api/admin/registrations');

        $response->assertStatus(401);
    }

    public function test_cannot_reject_already_approved(): void
    {
        $user = User::factory()->create(['registration_status' => 'approved']);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/registrations/{$user->id}/reject");

        $response->assertStatus(400);
    }
}
