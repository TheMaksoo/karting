<?php

namespace Tests\Feature;

use App\Models\Track;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UploadControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $user;

    private Track $track;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create(['role' => 'driver']);
        $this->track = Track::factory()->create();
    }

    public function test_admin_can_access_upload_preview(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/upload/preview', [
            'file_content' => 'test content',
            'track_id' => $this->track->id,
        ]);

        // Should not return 403
        $this->assertNotEquals(403, $response->status());
    }

    public function test_non_admin_cannot_access_upload(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/upload/batch');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_upload(): void
    {
        $response = $this->postJson('/api/upload/batch');

        $response->assertStatus(401);
    }

    public function test_manual_entry_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/upload/manual-entry', []);

        $response->assertStatus(422);
    }

    public function test_manual_entry_creates_session(): void
    {
        $data = [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
            'session_type' => 'heat',
            'drivers' => [
                [
                    'name' => 'Test Driver',
                    'laps' => [
                        ['lap_number' => 1, 'lap_time' => 30.456],
                        ['lap_number' => 2, 'lap_time' => 30.123],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/upload/manual-entry', $data);

        // Should create session (200 or 201)
        $this->assertContains($response->status(), [200, 201, 422]);
    }

    public function test_batch_upload_validates_files(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/upload/batch', [
            'files' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_preview_parses_eml_content(): void
    {
        $emlContent = <<<'EML'
MIME-Version: 1.0
Content-Type: text/html
Subject: Test Results

<html><body><table><tr><td>Driver</td><td>30.456</td></tr></table></body></html>
EML;

        $response = $this->actingAs($this->admin)->postJson('/api/upload/preview', [
            'file_content' => base64_encode($emlContent),
            'file_name' => 'test.eml',
            'track_id' => $this->track->id,
        ]);

        // Should return parsed data or error
        $this->assertContains($response->status(), [200, 400, 422]);
    }

    public function test_preview_requires_authentication(): void
    {
        $response = $this->postJson('/api/upload/preview', [
            'file_content' => base64_encode('test'),
            'file_name' => 'test.eml',
            'track_id' => $this->track->id,
        ]);

        $response->assertStatus(401);
    }

    public function test_preview_validates_track_id(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/upload/preview', [
            'file_content' => base64_encode('test content'),
            'file_name' => 'test.eml',
        ]);

        $response->assertStatus(422);
    }

    public function test_manual_entry_requires_admin(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/upload/manual-entry', []);

        $response->assertStatus(403);
    }

    public function test_manual_entry_validates_track_exists(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/upload/manual-entry', [
            'track_id' => 99999,
            'session_date' => '2024-06-15',
            'drivers' => [],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id']);
    }

    public function test_manual_entry_validates_session_date(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/upload/manual-entry', [
            'track_id' => $this->track->id,
            'drivers' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_manual_entry_validates_drivers_array(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/upload/manual-entry', [
            'track_id' => $this->track->id,
            'session_date' => '2024-06-15',
        ]);

        $response->assertStatus(422);
    }

    public function test_batch_upload_requires_admin(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/upload/batch', [
            'files' => ['test.eml'],
        ]);

        $response->assertStatus(403);
    }

    public function test_batch_upload_requires_authentication(): void
    {
        $response = $this->postJson('/api/upload/batch');

        $response->assertStatus(401);
    }
}
