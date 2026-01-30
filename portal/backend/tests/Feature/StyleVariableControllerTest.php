<?php

namespace Tests\Feature;

use App\Models\StyleVariable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class StyleVariableControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $user;

    private StyleVariable $variable;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->user = User::factory()->create();

        $this->variable = StyleVariable::create([
            'key' => 'test-primary-color',
            'value' => '#007bff',
            'category' => 'colors',
            'label' => 'Primary Color',
            'description' => 'Primary brand color',
            'type' => 'color',
            'metadata' => [],
        ]);
    }

    public function test_authenticated_user_can_list_style_variables(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/style-variables');

        $response->assertStatus(200)
            ->assertJsonStructure(['variables']);
    }

    public function test_list_groups_variables_by_category(): void
    {
        StyleVariable::factory()->create(['category' => 'colors', 'key' => 'secondary-color']);
        StyleVariable::factory()->create(['category' => 'fonts', 'key' => 'body-font']);

        $response = $this->actingAs($this->user)->getJson('/api/style-variables');

        $response->assertStatus(200);
        $data = $response->json('variables');

        $this->assertArrayHasKey('colors', $data);
        $this->assertArrayHasKey('fonts', $data);
    }

    public function test_admin_can_update_style_variable(): void
    {
        $response = $this->actingAs($this->admin)->putJson("/api/style-variables/{$this->variable->id}", [
            'value' => '#ff5733',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Style variable updated successfully',
                'variable' => [
                    'id' => $this->variable->id,
                    'value' => '#ff5733',
                ],
            ]);

        $this->assertDatabaseHas('style_variables', [
            'id' => $this->variable->id,
            'value' => '#ff5733',
        ]);
    }

    public function test_update_style_variable_requires_value(): void
    {
        $response = $this->actingAs($this->admin)->putJson("/api/style-variables/{$this->variable->id}", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['value']);
    }

    public function test_update_style_variable_clears_css_cache(): void
    {
        Cache::put('style_variables_css', 'cached-css', 3600);

        $this->actingAs($this->admin)->putJson("/api/style-variables/{$this->variable->id}", [
            'value' => '#new-color',
        ]);

        $this->assertFalse(Cache::has('style_variables_css'));
    }

    public function test_non_admin_cannot_update_style_variable(): void
    {
        $response = $this->actingAs($this->user)->putJson("/api/style-variables/{$this->variable->id}", [
            'value' => '#ff5733',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_bulk_update_style_variables(): void
    {
        $variable2 = StyleVariable::factory()->create();

        $response = $this->actingAs($this->admin)->postJson('/api/style-variables/bulk', [
            'variables' => [
                ['id' => $this->variable->id, 'value' => '#new1'],
                ['id' => $variable2->id, 'value' => '#new2'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Style variables updated successfully']);

        $this->assertDatabaseHas('style_variables', [
            'id' => $this->variable->id,
            'value' => '#new1',
        ]);

        $this->assertDatabaseHas('style_variables', [
            'id' => $variable2->id,
            'value' => '#new2',
        ]);
    }

    public function test_bulk_update_requires_variables_array(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/style-variables/bulk', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['variables']);
    }

    public function test_bulk_update_validates_variable_ids(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/style-variables/bulk', [
            'variables' => [
                ['id' => 99999, 'value' => '#invalid'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['variables.0.id']);
    }

    public function test_bulk_update_requires_value_for_each_variable(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/style-variables/bulk', [
            'variables' => [
                ['id' => $this->variable->id],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['variables.0.value']);
    }

    public function test_non_admin_cannot_bulk_update(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/style-variables/bulk', [
            'variables' => [
                ['id' => $this->variable->id, 'value' => '#new'],
            ],
        ]);

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_access_css(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/styles.css');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/css', $response->headers->get('Content-Type'));
        $this->assertStringContainsString(':root', $response->content());
    }

    public function test_admin_can_reset_style_variables(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/style-variables/reset');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Style variables reset to defaults']);
    }

    public function test_non_admin_cannot_reset_style_variables(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/style-variables/reset');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_update_style_variables(): void
    {
        $response = $this->putJson("/api/style-variables/{$this->variable->id}", [
            'value' => '#test',
        ]);

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_bulk_update(): void
    {
        $response = $this->postJson('/api/style-variables/bulk', [
            'variables' => [
                ['id' => $this->variable->id, 'value' => '#test'],
            ],
        ]);

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_reset(): void
    {
        $response = $this->postJson('/api/style-variables/reset');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_access_css(): void
    {
        $response = $this->getJson('/api/styles.css');

        $response->assertStatus(401);
    }
}
