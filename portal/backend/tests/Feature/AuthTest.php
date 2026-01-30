<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'token'])
            ->assertJson(['user' => ['email' => 'test@example.com']]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson(['user' => ['id' => $user->id]]);
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);
    }

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('NewPass123!', $user->fresh()->password));
    }

    public function test_change_password_requires_correct_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'wrongpassword',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_change_password_clears_must_change_password_flag(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
            'must_change_password' => true,
        ]);

        $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ]);

        $this->assertFalse($user->fresh()->must_change_password);
    }

    public function test_login_validates_email_format(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'not-an-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_change_password_requires_password_confirmation(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NewPass123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_requires_matching_confirmation(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'DifferentPass123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_requires_minimum_length(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => '123',
            'new_password_confirmation' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_login_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_me_returns_user_details(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'name' => 'Test User',
                    'email' => 'test@example.com',
                ],
            ]);
    }

    public function test_logout_requires_authentication(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    public function test_change_password_requires_authentication(): void
    {
        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_returns_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token'])
            ->assertJsonPath('token', fn ($token) => ! empty($token));
    }

    public function test_login_tracks_last_login_at(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_login_tracks_last_login_ip(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $this->assertNotNull($user->fresh()->last_login_ip);
    }

    public function test_login_rejects_pending_registration(): void
    {
        User::factory()->create([
            'email' => 'pending@example.com',
            'password' => Hash::make('password123'),
            'registration_status' => 'pending',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'pending@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_rejects_rejected_registration(): void
    {
        User::factory()->create([
            'email' => 'rejected@example.com',
            'password' => Hash::make('password123'),
            'registration_status' => 'rejected',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'rejected@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_change_password_validates_lowercase_requirement(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NOLETTERS123!',
            'new_password_confirmation' => 'NOLETTERS123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_validates_uppercase_requirement(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'nouppercase123!',
            'new_password_confirmation' => 'nouppercase123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_validates_digit_requirement(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NoDigitsHere!',
            'new_password_confirmation' => 'NoDigitsHere!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_validates_special_char_requirement(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NoSpecialChar123',
            'new_password_confirmation' => 'NoSpecialChar123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_clears_temp_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
            'temp_password' => 'temppass123',
        ]);

        $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ]);

        $this->assertNull($user->fresh()->temp_password);
    }

    public function test_me_includes_user_role(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_login_validates_password_required(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_login_validates_email_required(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_change_password_with_empty_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => '',
            'new_password' => 'NewPass123!',
            'new_password_confirmation' => 'NewPass123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_change_password_with_empty_new_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/auth/change-password', [
            'current_password' => 'oldpassword',
            'new_password' => '',
            'new_password_confirmation' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_password']);
    }

    public function test_login_returns_must_change_password_flag(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'must_change_password' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.must_change_password', true);
    }

    public function test_login_with_empty_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => '',
            'password' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_case_sensitive_password(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
