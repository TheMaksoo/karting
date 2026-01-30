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

    public function test_update_setting_with_boolean_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/feature_enabled', [
            'value' => true,
            'description' => 'Feature flag',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'key' => 'feature_enabled',
            'value' => json_encode(true),
        ]);
    }

    public function test_update_setting_with_numeric_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/max_items', [
            'value' => 100,
            'description' => 'Maximum items',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'key' => 'max_items',
            'value' => json_encode(100),
        ]);
    }

    public function test_update_setting_with_array_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/allowed_roles', [
            'value' => ['admin', 'driver', 'viewer'],
            'description' => 'Allowed user roles',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'key' => 'allowed_roles',
            'value' => json_encode(['admin', 'driver', 'viewer']),
        ]);
    }

    public function test_list_settings_includes_all_stored_settings(): void
    {
        Setting::setValue('setting1', 'value1');
        Setting::setValue('setting2', 'value2');
        Setting::setValue('setting3', 'value3');

        $response = $this->actingAs($this->user)->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJsonCount(3)
            ->assertJson([
                'setting1' => 'value1',
                'setting2' => 'value2',
                'setting3' => 'value3',
            ]);
    }

    public function test_update_overwrites_existing_setting(): void
    {
        Setting::setValue('test_key', 'original_value', 'Original description');

        $response = $this->actingAs($this->admin)->putJson('/api/settings/test_key', [
            'value' => 'updated_value',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200);

        $setting = Setting::where('key', 'test_key')->first();
        $this->assertEquals('updated_value', $setting->value);
        $this->assertEquals('Updated description', $setting->description);
    }

    public function test_update_setting_with_null_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/nullable_setting', [
            'value' => null,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'key' => 'nullable_setting',
            'value' => json_encode(null),
        ]);
    }

    public function test_update_setting_with_object_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/complex_setting', [
            'value' => ['key1' => 'value1', 'nested' => ['key2' => 'value2']],
        ]);

        $response->assertStatus(200);
    }

    public function test_list_settings_with_no_settings(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJson([]);
    }

    public function test_update_setting_key_with_special_characters(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/setting-with_dots.and-dashes', [
            'value' => 'test_value',
        ]);

        $response->assertStatus(200);
    }

    public function test_update_setting_with_empty_string_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson('/api/settings/empty_setting', [
            'value' => '',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'key' => 'empty_setting',
            'value' => json_encode(''),
        ]);
    }

    public function test_update_preserves_other_settings(): void
    {
        Setting::setValue('setting1', 'value1');
        Setting::setValue('setting2', 'value2');

        $this->actingAs($this->admin)->putJson('/api/settings/setting1', [
            'value' => 'updated_value1',
        ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'setting2',
            'value' => json_encode('value2'),
        ]);
    }

    public function test_list_settings_returns_decoded_values(): void
    {
        Setting::setValue('bool_setting', true);
        Setting::setValue('num_setting', 42);
        Setting::setValue('str_setting', 'test');

        $response = $this->actingAs($this->user)->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJson([
                'bool_setting' => true,
                'num_setting' => 42,
                'str_setting' => 'test',
            ]);
    }

    public function test_update_setting_with_large_string(): void
    {
        $largeString = str_repeat('a', 1000);

        $response = $this->actingAs($this->admin)->putJson('/api/settings/large_setting', [
            'value' => $largeString,
        ]);

        $response->assertStatus(200);
    }

    public function test_update_setting_without_description(): void
    {
        Setting::setValue('test_key', 'old_value', 'Old description');

        $response = $this->actingAs($this->admin)->putJson('/api/settings/test_key', [
            'value' => 'new_value',
        ]);

        $response->assertStatus(200);
    }
}
