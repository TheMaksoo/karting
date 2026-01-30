<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create(['role' => 'driver']);
    }

    public function test_can_list_all_settings(): void
    {
        Setting::setValue('app_name', 'Karting Portal', 'Application name');
        Setting::setValue('max_upload_size', '10', 'Max upload size in MB');
        Setting::setValue('enable_registration', 'true', 'Enable public registration');

        $response = $this->actingAs($this->user)->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'app_name',
                'max_upload_size',
                'enable_registration',
            ]);
    }

    public function test_settings_returns_empty_object_when_no_settings(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJson([]);
    }

    public function test_admin_can_update_setting(): void
    {
        Setting::setValue('app_name', 'Old Name', 'Application name');

        $response = $this->actingAs($this->admin)->putJson('/api/settings/app_name', [
            'value' => 'New Karting Portal',
            'description' => 'Updated application name',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'key' => 'app_name',
                'value' => 'New Karting Portal',
            ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'app_name',
            'value' => json_encode('New Karting Portal'),
        ]);
    }

    public function test_admin_can_create_new_setting(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/new_setting', [
            'value' => 'test_value',
            'description' => 'A new setting',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('settings', [
            'key' => 'new_setting',
            'value' => json_encode('test_value'),
        ]);
    }

    public function test_update_setting_requires_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/app_name', [
            'description' => 'Missing value',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['value']);
    }

    public function test_update_setting_description_is_optional(): void
    {
        Setting::setValue('app_name', 'Old Name');

        $response = $this->actingAs($this->admin)->putJson('/api/settings/app_name', [
            'value' => 'New Name',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('settings', [
            'key' => 'app_name',
            'value' => json_encode('New Name'),
        ]);
    }

    public function test_any_authenticated_user_can_update_setting(): void
    {
        Setting::setValue('app_name', 'Original Name', 'App name');

        $response = $this->actingAs($this->user)->putJson('/api/settings/app_name', [
            'value' => 'Updated Name',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('settings', [
            'key' => 'app_name',
            'value' => json_encode('Updated Name'),
        ]);
    }

    public function test_unauthenticated_user_cannot_access_settings(): void
    {
        $response = $this->getJson('/api/settings');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_update_settings(): void
    {
        $response = $this->putJson('/api/settings/app_name', [
            'value' => 'Hacked',
        ]);

        $response->assertStatus(401);
    }
}
