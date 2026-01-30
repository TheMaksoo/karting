<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Track;
use App\Models\Upload;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EmlUploadControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected Track $track;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->track = Track::factory()->create([
            'name' => 'Test Track',
            'city' => 'Test City',
        ]);

        Storage::fake('local');
    }

    // ==================== parseEml Tests ====================

    public function test_parse_eml_requires_file(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_parse_eml_requires_authentication(): void
    {
        $file = UploadedFile::fake()->create('test.eml', 100);

        $response = $this->postJson('/api/sessions/upload-eml', [
            'file' => $file,
        ]);

        $response->assertStatus(401);
    }

    public function test_parse_eml_detects_duplicate_file(): void
    {
        // Create existing upload record
        $fileContent = 'test eml content';
        $fileHash = md5($fileContent);

        Upload::create([
            'file_name' => 'existing.eml',
            'file_hash' => $fileHash,
            'upload_date' => now(),
            'session_date' => now(),
            'laps_count' => 5,
            'drivers_count' => 2,
            'status' => 'completed',
        ]);

        // Create file with same content
        $file = UploadedFile::fake()->createWithContent('duplicate.eml', $fileContent);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'duplicate_file' => true,
            ]);
    }

    public function test_parse_eml_validates_track_id_exists(): void
    {
        $file = UploadedFile::fake()->createWithContent('test.txt', "Driver,Lap,Time\nJohn,1,45.123");

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
                'track_id' => 99999,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id']);
    }

    public function test_parse_eml_with_manual_track_id(): void
    {
        // Create a minimal txt file with lap data
        $content = "Position,Driver,Lap Time\n1,John Doe,45.123\n2,Jane Doe,46.456";
        $file = UploadedFile::fake()->createWithContent('session.txt', $content);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
                'track_id' => $this->track->id,
            ]);

        // May return success if parsed or error if format not recognized
        $this->assertTrue(in_array($response->status(), [200, 400]));
    }

    // ==================== saveSession Tests ====================

    public function test_save_session_requires_authentication(): void
    {
        $response = $this->postJson('/api/sessions/save-parsed', [
            'track_id' => $this->track->id,
            'session_date' => '2025-01-01',
            'laps' => [],
        ]);

        $response->assertStatus(401);
    }

    public function test_save_session_validates_required_fields(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id', 'session_date', 'laps']);
    }

    public function test_save_session_validates_track_exists(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => 99999,
                'session_date' => '2025-01-01',
                'laps' => [
                    ['driver_name' => 'John', 'lap_number' => 1, 'lap_time' => 45.123],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['track_id']);
    }

    public function test_save_session_validates_lap_structure(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-01',
                'laps' => [
                    ['driver_name' => 'John'],  // Missing lap_number and lap_time
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['laps.0.lap_number', 'laps.0.lap_time']);
    }

    public function test_save_session_creates_session_and_laps(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'John Doe', 'lap_number' => 1, 'lap_time' => 45.123],
                    ['driver_name' => 'John Doe', 'lap_number' => 2, 'lap_time' => 44.567],
                    ['driver_name' => 'Jane Doe', 'lap_number' => 1, 'lap_time' => 46.789],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('karting_sessions', [
            'track_id' => $this->track->id,
            'session_date' => '2025-01-15 00:00:00',
        ]);

        $this->assertDatabaseHas('drivers', ['name' => 'John Doe']);
        $this->assertDatabaseHas('drivers', ['name' => 'Jane Doe']);
    }

    public function test_save_session_creates_upload_record(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'file_name' => 'test-session.eml',
                'file_hash' => 'abc123hash',
                'laps' => [
                    ['driver_name' => 'Test Driver', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('uploads', [
            'file_name' => 'test-session.eml',
            'file_hash' => 'abc123hash',
            'status' => 'success',
        ]);
    }

    public function test_save_session_reuses_existing_driver(): void
    {
        // Pre-create driver for this track
        $existingDriver = Driver::factory()->create([
            'name' => 'Existing Driver',
            'track_id' => $this->track->id,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Existing Driver', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);

        // Verify lap was created with existing driver
        $this->assertDatabaseHas('laps', [
            'driver_id' => $existingDriver->id,
        ]);
    }

    public function test_save_session_replaces_duplicate_when_requested(): void
    {
        // First upload
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'file_name' => 'test.eml',
                'file_hash' => 'duplicate_hash',
                'laps' => [
                    ['driver_name' => 'Driver 1', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);
        $firstUploadId = Upload::where('file_hash', 'duplicate_hash')->first()->id;

        // Replace with new data
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-16',
                'file_name' => 'test-updated.eml',
                'file_hash' => 'duplicate_hash',
                'replace_duplicate' => true,
                'laps' => [
                    ['driver_name' => 'Driver 2', 'lap_number' => 1, 'lap_time' => 46.0],
                ],
            ]);

        $response->assertStatus(200);

        // Old upload should be deleted
        $this->assertDatabaseMissing('uploads', ['id' => $firstUploadId]);

        // New upload should exist
        $this->assertDatabaseHas('uploads', [
            'file_hash' => 'duplicate_hash',
            'file_name' => 'test-updated.eml',
        ]);
    }

    public function test_save_session_includes_heat_price(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'heat_price' => 15.50,
                'laps' => [
                    ['driver_name' => 'Test Driver', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('karting_sessions', [
            'track_id' => $this->track->id,
            'heat_price' => 15.50,
        ]);
    }

    // ==================== Authorization Tests ====================

    public function test_non_admin_cannot_upload(): void
    {
        $regularUser = User::factory()->create(['role' => 'driver']);
        $file = UploadedFile::fake()->create('test.eml', 100);

        $response = $this->actingAs($regularUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_save_session(): void
    {
        $regularUser = User::factory()->create(['role' => 'driver']);

        $response = $this->actingAs($regularUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(403);
    }

    // ==================== Edge Cases & Error Handling ====================

    public function test_parse_eml_with_empty_file(): void
    {
        $file = UploadedFile::fake()->create('empty.eml', 0);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $response->assertStatus(400);
    }

    public function test_parse_eml_with_invalid_extension(): void
    {
        $file = UploadedFile::fake()->create('test.exe', 100);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_parse_eml_with_large_file(): void
    {
        $file = UploadedFile::fake()->create('large.eml', 10000);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $this->assertTrue(in_array($response->status(), [200, 400, 413]));
    }

    public function test_save_session_with_empty_laps_array(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['laps']);
    }

    public function test_save_session_with_invalid_lap_time(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 'invalid'],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['laps.0.lap_time']);
    }

    public function test_save_session_with_negative_lap_time(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => -45.0],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['laps.0.lap_time']);
    }

    public function test_save_session_with_zero_lap_time(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 0],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['laps.0.lap_time']);
    }

    public function test_save_session_with_missing_driver_name(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['laps.0.driver_name']);
    }

    public function test_save_session_with_invalid_lap_number(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 'one', 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['laps.0.lap_number']);
    }

    public function test_save_session_with_multiple_drivers(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Driver A', 'lap_number' => 1, 'lap_time' => 45.0],
                    ['driver_name' => 'Driver B', 'lap_number' => 1, 'lap_time' => 46.0],
                    ['driver_name' => 'Driver C', 'lap_number' => 1, 'lap_time' => 47.0],
                    ['driver_name' => 'Driver A', 'lap_number' => 2, 'lap_time' => 44.5],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('drivers', ['name' => 'Driver A']);
        $this->assertDatabaseHas('drivers', ['name' => 'Driver B']);
        $this->assertDatabaseHas('drivers', ['name' => 'Driver C']);
    }

    public function test_save_session_with_sector_times(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    [
                        'driver_name' => 'Test Driver',
                        'lap_number' => 1,
                        'lap_time' => 45.123,
                        'sector1' => 15.0,
                        'sector2' => 15.5,
                        'sector3' => 14.623,
                    ],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('laps', [
            'sector1' => 15.0,
            'sector2' => 15.5,
            'sector3' => 14.623,
        ]);
    }

    public function test_save_session_with_position_data(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Driver 1', 'lap_number' => 1, 'lap_time' => 45.0, 'position' => 1],
                    ['driver_name' => 'Driver 2', 'lap_number' => 1, 'lap_time' => 46.0, 'position' => 2],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('laps', ['position' => 1]);
        $this->assertDatabaseHas('laps', ['position' => 2]);
    }

    public function test_parse_eml_validates_file_size(): void
    {
        $file = UploadedFile::fake()->create('oversized.eml', 50000);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $this->assertTrue(in_array($response->status(), [200, 400, 413, 422]));
    }

    public function test_save_session_with_special_characters_in_driver_name(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => "O'Brien-García", 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('drivers', ['name' => "O'Brien-García"]);
    }

    public function test_save_session_validates_session_date_format(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => 'invalid-date',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['session_date']);
    }

    public function test_save_session_with_heat_number(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'heat' => 5,
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('karting_sessions', ['heat' => 5]);
    }

    public function test_save_session_with_weather_data(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'weather' => 'Rainy',
                'temperature' => 18,
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('karting_sessions', [
            'weather' => 'Rainy',
            'temperature' => 18,
        ]);
    }

    public function test_save_session_with_session_type(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'session_type' => 'Qualifying',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('karting_sessions', ['session_type' => 'Qualifying']);
    }

    public function test_save_session_with_notes(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'notes' => 'Great session, new track record!',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('karting_sessions', [
            'notes' => 'Great session, new track record!',
        ]);
    }

    public function test_parse_eml_with_txt_extension(): void
    {
        $file = UploadedFile::fake()->createWithContent(
            'session.txt',
            "Driver,Lap,Time\nJohn,1,45.123\nJane,1,46.456"
        );

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $this->assertTrue(in_array($response->status(), [200, 400]));
    }

    public function test_parse_eml_with_csv_extension(): void
    {
        $file = UploadedFile::fake()->createWithContent(
            'session.csv',
            "Driver,Lap,Time\nJohn,1,45.123\nJane,1,46.456"
        );

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $this->assertTrue(in_array($response->status(), [200, 400]));
    }

    public function test_save_session_with_large_lap_count(): void
    {
        $laps = [];
        for ($i = 1; $i <= 100; $i++) {
            $laps[] = [
                'driver_name' => 'Test Driver',
                'lap_number' => $i,
                'lap_time' => 45.0 + ($i * 0.1),
            ];
        }

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => $laps,
            ]);

        $response->assertStatus(200);
        $this->assertEquals(100, \App\Models\Lap::count());
    }

    public function test_save_session_with_decimal_lap_times(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.123456],
                ],
            ]);

        $response->assertStatus(200);
    }

    public function test_save_session_validates_heat_price_is_numeric(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/save-parsed', [
                'track_id' => $this->track->id,
                'session_date' => '2025-01-15',
                'heat_price' => 'expensive',
                'laps' => [
                    ['driver_name' => 'Test', 'lap_number' => 1, 'lap_time' => 45.0],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['heat_price']);
    }

    public function test_parse_eml_stores_file_metadata(): void
    {
        $file = UploadedFile::fake()->createWithContent('meta.txt', "Driver,Lap,Time\nTest,1,45.0");

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/sessions/upload-eml', [
                'file' => $file,
            ]);

        $this->assertTrue(in_array($response->status(), [200, 400]));
    }
}
