<?php

namespace Tests\Feature;

use App\Models\KartingSession;
use App\Models\Track;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_index_returns_all_tracks(): void
    {
        Track::factory()->count(3)->create();

        $response = $this->actingAs($this->user)->getJson('/api/tracks');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_store_creates_track(): void
    {
        $data = [
            'name' => 'Circuit Zandvoort',
            'city' => 'Zandvoort',
            'country' => 'Netherlands',
            'distance' => 800,
            'corners' => 12,
            'indoor' => false,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/tracks', $data);

        $response->assertStatus(201)->assertJson(['name' => 'Circuit Zandvoort']);
        $this->assertDatabaseHas('tracks', ['name' => 'Circuit Zandvoort']);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_show_returns_track(): void
    {
        $track = Track::factory()->create();

        $response = $this->actingAs($this->user)->getJson("/api/tracks/{$track->id}");

        $response->assertStatus(200)->assertJson(['id' => $track->id]);
    }

    public function test_show_returns_404_for_nonexistent_track(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/tracks/99999');

        $response->assertStatus(404);
    }

    public function test_update_modifies_track(): void
    {
        $track = Track::factory()->create(['name' => 'Old Circuit']);

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'name' => 'New Circuit',
        ]);

        $response->assertStatus(200)->assertJson(['name' => 'New Circuit']);
    }

    public function test_destroy_deletes_track(): void
    {
        $track = Track::factory()->create();

        $response = $this->actingAs($this->user)->deleteJson("/api/tracks/{$track->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('tracks', ['id' => $track->id]);
    }

    public function test_stats_returns_track_statistics(): void
    {
        $track = Track::factory()->create();
        KartingSession::factory()->count(2)->create(['track_id' => $track->id]);

        $response = $this->actingAs($this->user)->getJson('/api/stats/tracks');

        $response->assertStatus(200)->assertJsonStructure([
            '*' => ['track_id', 'track_name', 'total_sessions'],
        ]);
    }

    public function test_track_stores_json_features(): void
    {
        $data = [
            'name' => 'Test Circuit',
            'city' => 'Test City',
            'country' => 'Test Country',
            'features' => ['timing_system' => 'AMB', 'facilities' => ['cafe', 'shop']],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/tracks', $data);

        $response->assertStatus(201);
        $track = Track::first();
        $this->assertEquals('AMB', $track->features['timing_system']);
    }

    public function test_track_can_have_coordinates(): void
    {
        $track = Track::factory()->create([
            'latitude' => 52.3676,
            'longitude' => 4.9041,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/tracks/{$track->id}");

        $response->assertStatus(200)
            ->assertJson([
                'latitude' => 52.3676,
                'longitude' => 4.9041,
            ]);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidTrackDataProvider')]
    public function test_store_validates_data_types(array $data, string $expectedError): void
    {
        $validData = [
            'name' => 'Test Circuit',
            'city' => 'Test City',
            'country' => 'Test Country',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/tracks', array_merge($validData, $data));

        $response->assertStatus(422)
            ->assertJsonValidationErrors([$expectedError]);
    }

    public static function invalidTrackDataProvider(): array
    {
        return [
            'non-numeric distance' => [['distance' => 'not-a-number'], 'distance'],
            'non-integer corners' => [['corners' => 'twelve'], 'corners'],
        ];
    }

    public function test_update_validates_data(): void
    {
        $track = Track::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'distance' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['distance']);
    }

    public function test_unauthenticated_user_cannot_access_tracks(): void
    {
        $response = $this->getJson('/api/tracks');

        $response->assertStatus(401);
    }

    public function test_track_with_pricing_information(): void
    {
        $data = [
            'name' => 'Premium Circuit',
            'city' => 'Amsterdam',
            'country' => 'Netherlands',
            'pricing' => ['heat_price' => 25.00, 'membership_fee' => 100.00],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/tracks', $data);

        $response->assertStatus(201);
        $track = Track::where('name', 'Premium Circuit')->first();
        $this->assertEquals(25.00, $track->pricing['heat_price']);
    }
}
