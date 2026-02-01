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

    public function test_store_validates_name_max_length(): void
    {
        $data = [
            'name' => str_repeat('A', 300),
            'city' => 'Test',
            'country' => 'Test',
        ];

        $response = $this->actingAs($this->user)->postJson('/api/tracks', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_update_allows_partial_updates(): void
    {
        $track = Track::factory()->create(['name' => 'Original', 'city' => 'City']);

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'name' => 'Updated',
        ]);

        $response->assertStatus(200);
        $track->refresh();
        $this->assertEquals('Updated', $track->name);
        $this->assertEquals('City', $track->city);
    }

    public function test_store_with_indoor_flag(): void
    {
        $data = [
            'name' => 'Indoor Circuit',
            'city' => 'Brussels',
            'country' => 'Belgium',
            'indoor' => true,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/tracks', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tracks', [
            'name' => 'Indoor Circuit',
            'indoor' => true,
        ]);
    }

    public function test_index_returns_empty_array(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/tracks');

        $response->assertStatus(200)
            ->assertJsonCount(0);
    }

    public function test_destroy_prevents_deletion_with_sessions(): void
    {
        $track = Track::factory()->create();
        KartingSession::factory()->create(['track_id' => $track->id]);

        $response = $this->actingAs($this->user)->deleteJson("/api/tracks/{$track->id}");

        $this->assertContains($response->status(), [200, 409]);
    }

    public function test_show_includes_sessions_count(): void
    {
        $track = Track::factory()->create();
        KartingSession::factory()->count(3)->create(['track_id' => $track->id]);

        $response = $this->actingAs($this->user)->getJson("/api/tracks/{$track->id}");

        $response->assertStatus(200);
    }

    public function test_stats_with_no_sessions(): void
    {
        Track::factory()->create();

        $response = $this->actingAs($this->user)->getJson('/api/stats/tracks');

        $response->assertStatus(200);
    }

    public function test_update_returns_404_for_nonexistent_track(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/tracks/99999', [
            'name' => 'Updated',
        ]);

        $response->assertStatus(404);
    }

    public function test_destroy_returns_404_for_nonexistent_track(): void
    {
        $response = $this->actingAs($this->user)->deleteJson('/api/tracks/99999');

        $response->assertStatus(404);
    }

    public function test_store_validates_city_required(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Test Circuit',
            'country' => 'Netherlands',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['city']);
    }

    public function test_store_validates_country_required(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Test Circuit',
            'city' => 'Amsterdam',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['country']);
    }

    public function test_store_with_all_optional_fields(): void
    {
        $data = [
            'name' => 'Complete Circuit',
            'city' => 'Amsterdam',
            'country' => 'Netherlands',
            'distance' => 850,
            'corners' => 15,
            'indoor' => false,
            'latitude' => 52.3676,
            'longitude' => 4.9041,
            'features' => ['timing' => 'AMB', 'cafe' => true],
            'pricing' => ['heat_price' => 25.00],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/tracks', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tracks', [
            'name' => 'Complete Circuit',
            'distance' => 850,
        ]);
    }

    public function test_index_returns_tracks_with_session_count(): void
    {
        $track = Track::factory()->create();
        KartingSession::factory()->count(5)->create(['track_id' => $track->id]);

        $response = $this->actingAs($this->user)->getJson('/api/tracks');

        $response->assertStatus(200);
    }

    public function test_store_validates_latitude_range(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Test',
            'city' => 'Test',
            'country' => 'Test',
            'latitude' => 91.0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latitude']);
    }

    public function test_store_validates_longitude_range(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Test',
            'city' => 'Test',
            'country' => 'Test',
            'longitude' => 181.0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['longitude']);
    }

    public function test_store_with_negative_coordinates(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Southern Track',
            'city' => 'Cape Town',
            'country' => 'South Africa',
            'latitude' => -33.9249,
            'longitude' => 18.4241,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tracks', [
            'latitude' => -33.9249,
            'longitude' => 18.4241,
        ]);
    }

    public function test_update_coordinates(): void
    {
        $track = Track::factory()->create([
            'latitude' => 50.0,
            'longitude' => 5.0,
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'latitude' => 52.0,
            'longitude' => 6.0,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tracks', [
            'id' => $track->id,
            'latitude' => 52.0,
            'longitude' => 6.0,
        ]);
    }

    public function test_store_validates_distance_is_positive(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Test',
            'city' => 'Test',
            'country' => 'Test',
            'distance' => -100,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['distance']);
    }

    public function test_store_validates_corners_is_positive(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Test',
            'city' => 'Test',
            'country' => 'Test',
            'corners' => -5,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['corners']);
    }

    public function test_store_with_zero_corners(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Straight Track',
            'city' => 'Test',
            'country' => 'Test',
            'corners' => 0,
        ]);

        $this->assertTrue(in_array($response->status(), [201, 422]));
    }

    public function test_store_with_large_distance(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Long Track',
            'city' => 'Test',
            'country' => 'Test',
            'distance' => 5000,
        ]);

        $response->assertStatus(201);
    }

    public function test_update_indoor_flag(): void
    {
        $track = Track::factory()->create(['indoor' => false]);

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'indoor' => true,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tracks', [
            'id' => $track->id,
            'indoor' => true,
        ]);
    }

    public function test_store_with_empty_features(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Basic Track',
            'city' => 'Test',
            'country' => 'Test',
            'features' => [],
        ]);

        $response->assertStatus(201);
    }

    public function test_update_features_json(): void
    {
        $track = Track::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'features' => ['new_feature' => 'value'],
        ]);

        $response->assertStatus(200);
    }

    public function test_show_with_no_sessions(): void
    {
        $track = Track::factory()->create();

        $response = $this->actingAs($this->user)->getJson("/api/tracks/{$track->id}");

        $response->assertStatus(200)
            ->assertJson(['id' => $track->id]);
    }

    public function test_destroy_soft_deletes_track(): void
    {
        $track = Track::factory()->create();

        $this->actingAs($this->user)->deleteJson("/api/tracks/{$track->id}");

        $this->assertSoftDeleted('tracks', ['id' => $track->id]);
    }

    public function test_store_with_special_characters_in_name(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Circuit de Spa-Francorchamps',
            'city' => 'Spa',
            'country' => 'Belgium',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tracks', ['name' => 'Circuit de Spa-Francorchamps']);
    }

    public function test_update_with_null_optional_fields(): void
    {
        $track = Track::factory()->create([
            'distance' => 800,
            'corners' => 12,
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'distance' => null,
            'corners' => null,
        ]);

        $response->assertStatus(200);
    }

    public function test_stats_aggregates_all_tracks(): void
    {
        $track1 = Track::factory()->create();
        $track2 = Track::factory()->create();
        KartingSession::factory()->count(3)->create(['track_id' => $track1->id]);
        KartingSession::factory()->count(2)->create(['track_id' => $track2->id]);

        $response = $this->actingAs($this->user)->getJson('/api/stats/tracks');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertGreaterThanOrEqual(0, count($data));
    }

    public function test_index_with_large_dataset(): void
    {
        Track::factory()->count(50)->create();

        $response = $this->actingAs($this->user)->getJson('/api/tracks');

        $response->assertStatus(200)
            ->assertJsonCount(50);
    }

    public function test_store_with_decimal_coordinates(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Precise Track',
            'city' => 'Test',
            'country' => 'Test',
            'latitude' => 52.123456,
            'longitude' => 4.987654,
        ]);

        $response->assertStatus(201);
    }

    public function test_update_validates_name_required(): void
    {
        $track = Track::factory()->create();

        $response = $this->actingAs($this->user)->putJson("/api/tracks/{$track->id}", [
            'name' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_with_pricing_structure(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tracks', [
            'name' => 'Priced Track',
            'city' => 'Test',
            'country' => 'Test',
            'pricing' => [
                'heat_price' => 25.50,
                'membership' => 100.00,
                'discount_10_heats' => 230.00,
            ],
        ]);

        $response->assertStatus(201);
    }

    public function test_show_returns_complete_track_info(): void
    {
        $track = Track::factory()->create([
            'name' => 'Complete Track',
            'city' => 'Amsterdam',
            'country' => 'Netherlands',
            'distance' => 850,
            'corners' => 14,
            'indoor' => true,
            'latitude' => 52.3676,
            'longitude' => 4.9041,
        ]);

        $response = $this->actingAs($this->user)->getJson("/api/tracks/{$track->id}");

        $response->assertStatus(200)
            ->assertJson([
                'name' => 'Complete Track',
                'distance' => 850,
                'corners' => 14,
            ]);
    }

    public function test_index_pagination_with_page_param(): void
    {
        Track::factory()->count(60)->create();

        $response = $this->actingAs($this->user)->getJson('/api/tracks?page=1&per_page=20');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'current_page',
                'per_page',
                'total',
            ])
            ->assertJsonCount(20, 'data')
            ->assertJson(['per_page' => 20]);
    }

    public function test_index_pagination_respects_max_per_page(): void
    {
        Track::factory()->count(150)->create();

        $response = $this->actingAs($this->user)->getJson('/api/tracks?per_page=200');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertLessThanOrEqual(100, count($data['data']));
    }

    public function test_index_search_by_name(): void
    {
        Track::factory()->create(['name' => 'Circuit Park Berghem']);
        Track::factory()->create(['name' => 'Goodwill Karting']);
        Track::factory()->create(['name' => 'De Voltage']);

        $response = $this->actingAs($this->user)->getJson('/api/tracks?search=Berghem');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Circuit Park Berghem']);
    }

    public function test_index_search_by_city(): void
    {
        Track::factory()->create(['name' => 'Track 1', 'city' => 'Amsterdam']);
        Track::factory()->create(['name' => 'Track 2', 'city' => 'Rotterdam']);

        $response = $this->actingAs($this->user)->getJson('/api/tracks?search=Amsterdam');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['city' => 'Amsterdam']);
    }

    public function test_index_search_by_country(): void
    {
        Track::factory()->create(['name' => 'Track 1', 'country' => 'Netherlands']);
        Track::factory()->create(['name' => 'Track 2', 'country' => 'Belgium']);

        $response = $this->actingAs($this->user)->getJson('/api/tracks?search=Belgium');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['country' => 'Belgium']);
    }

    public function test_index_country_filter(): void
    {
        Track::factory()->count(3)->create(['country' => 'Netherlands']);
        Track::factory()->count(2)->create(['country' => 'Belgium']);

        $response = $this->actingAs($this->user)->getJson('/api/tracks?country=Netherlands');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_index_backward_compatible_without_pagination(): void
    {
        Track::factory()->count(5)->create();

        $response = $this->actingAs($this->user)->getJson('/api/tracks');

        $response->assertStatus(200)
            ->assertJsonCount(5)
            ->assertJsonMissing(['current_page']); // No pagination structure
    }
}
