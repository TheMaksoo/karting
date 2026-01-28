<?php

namespace Tests\Unit;

use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use App\Models\Track;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_track_has_many_sessions(): void
    {
        $track = Track::factory()->create();
        KartingSession::factory()->count(3)->create(['track_id' => $track->id]);

        $this->assertCount(3, $track->kartingSessions);
    }

    public function test_session_belongs_to_track(): void
    {
        $track = Track::factory()->create();
        $session = KartingSession::factory()->create(['track_id' => $track->id]);

        $this->assertEquals($track->id, $session->track->id);
    }

    public function test_session_has_many_laps(): void
    {
        $session = KartingSession::factory()->create();
        $driver = Driver::factory()->create();
        Lap::factory()->count(5)->create([
            'karting_session_id' => $session->id,
            'driver_id' => $driver->id,
        ]);

        $this->assertCount(5, $session->laps);
    }

    public function test_lap_belongs_to_session(): void
    {
        $session = KartingSession::factory()->create();
        $lap = Lap::factory()->create(['karting_session_id' => $session->id]);

        $this->assertEquals($session->id, $lap->kartingSession->id);
    }

    public function test_lap_belongs_to_driver(): void
    {
        $driver = Driver::factory()->create();
        $lap = Lap::factory()->create(['driver_id' => $driver->id]);

        $this->assertEquals($driver->id, $lap->driver->id);
    }

    public function test_driver_has_many_laps(): void
    {
        $driver = Driver::factory()->create();
        $session = KartingSession::factory()->create();
        Lap::factory()->count(3)->create([
            'driver_id' => $driver->id,
            'karting_session_id' => $session->id,
        ]);

        $this->assertCount(3, $driver->laps);
    }

    public function test_driver_display_name_returns_nickname_if_set(): void
    {
        $driver = Driver::factory()->create([
            'name' => 'Full Name',
            'nickname' => 'Nick',
        ]);

        $this->assertEquals('Nick', $driver->display_name);
    }

    public function test_driver_display_name_returns_name_if_no_nickname(): void
    {
        $driver = Driver::factory()->create([
            'name' => 'Full Name',
            'nickname' => null,
        ]);

        $this->assertEquals('Full Name', $driver->display_name);
    }

    public function test_user_is_admin_check(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $driver = User::factory()->create(['role' => 'driver']);

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($driver->isAdmin());
    }

    public function test_track_casts_features_to_array(): void
    {
        $track = Track::factory()->create([
            'features' => ['timing' => 'AMB', 'facilities' => ['cafe']],
        ]);

        $this->assertIsArray($track->features);
        $this->assertEquals('AMB', $track->features['timing']);
    }

    public function test_track_casts_indoor_to_boolean(): void
    {
        $track = Track::factory()->create(['indoor' => true]);

        $this->assertIsBool($track->indoor);
        $this->assertTrue($track->indoor);
    }
}
