<?php

namespace Tests\Unit;

use App\Http\Controllers\Traits\AllowedDriversTrait;
use App\Models\Driver;
use App\Models\Friend;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AllowedDriversTraitTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create a test class that uses the trait
     */
    private function getTraitUser(): object
    {
        return new class
        {
            use AllowedDriversTrait;

            public function getAllowedDriverIdsPublic($user): array
            {
                return $this->getAllowedDriverIds($user);
            }
        };
    }

    public function test_returns_empty_array_for_user_without_drivers(): void
    {
        $user = User::factory()->create(['driver_id' => null]);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    public function test_returns_legacy_driver_id(): void
    {
        $driver = Driver::factory()->create();
        $user = User::factory()->create(['driver_id' => $driver->id]);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        $this->assertContains($driver->id, $result);
    }

    public function test_returns_connected_drivers_from_pivot_table(): void
    {
        $user = User::factory()->create(['driver_id' => null]);
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();
        $user->drivers()->attach([$driver1->id, $driver2->id]);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        $this->assertContains($driver1->id, $result);
        $this->assertContains($driver2->id, $result);
    }

    public function test_returns_friend_drivers(): void
    {
        $user = User::factory()->create(['driver_id' => null]);
        $friendDriver = Driver::factory()->create();
        Friend::create([
            'user_id' => $user->id,
            'friend_driver_id' => $friendDriver->id,
            'friendship_status' => 'active',
        ]);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        $this->assertContains($friendDriver->id, $result);
    }

    public function test_expands_friend_to_include_all_their_drivers(): void
    {
        // Create user
        $user = User::factory()->create(['driver_id' => null]);

        // Create friend with multiple drivers
        $friendDriver1 = Driver::factory()->create();
        $friendDriver2 = Driver::factory()->create();
        $friendUser = User::factory()->create(['driver_id' => $friendDriver1->id]);
        $friendUser->drivers()->attach($friendDriver2->id);

        // Add friend via one of their drivers
        Friend::create([
            'user_id' => $user->id,
            'friend_driver_id' => $friendDriver1->id,
            'friendship_status' => 'active',
        ]);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        // Should include BOTH friend drivers (account expansion)
        $this->assertContains($friendDriver1->id, $result);
        $this->assertContains($friendDriver2->id, $result);
    }

    public function test_does_not_include_inactive_friends(): void
    {
        $user = User::factory()->create(['driver_id' => null]);
        $friendDriver = Driver::factory()->create();
        Friend::create([
            'user_id' => $user->id,
            'friend_driver_id' => $friendDriver->id,
            'friendship_status' => 'pending',
        ]);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        $this->assertNotContains($friendDriver->id, $result);
    }

    public function test_returns_unique_driver_ids(): void
    {
        $driver = Driver::factory()->create();
        $user = User::factory()->create(['driver_id' => $driver->id]);
        // Also connect the same driver via pivot table
        $user->drivers()->attach($driver->id);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        // Should only have the driver once
        $this->assertCount(1, $result);
        $this->assertContains($driver->id, $result);
    }

    public function test_combines_all_driver_sources(): void
    {
        // User's own legacy driver
        $ownDriver = Driver::factory()->create();
        $user = User::factory()->create(['driver_id' => $ownDriver->id]);

        // User's connected driver via pivot
        $connectedDriver = Driver::factory()->create();
        $user->drivers()->attach($connectedDriver->id);

        // Friend's drivers
        $friendDriver1 = Driver::factory()->create();
        $friendDriver2 = Driver::factory()->create();
        $friendUser = User::factory()->create(['driver_id' => $friendDriver1->id]);
        $friendUser->drivers()->attach($friendDriver2->id);
        Friend::create([
            'user_id' => $user->id,
            'friend_driver_id' => $friendDriver1->id,
            'friendship_status' => 'active',
        ]);

        $traitClass = $this->getTraitUser();
        $result = $traitClass->getAllowedDriverIdsPublic($user);

        // Should include all 4 drivers
        $this->assertContains($ownDriver->id, $result);
        $this->assertContains($connectedDriver->id, $result);
        $this->assertContains($friendDriver1->id, $result);
        $this->assertContains($friendDriver2->id, $result);
        $this->assertCount(4, $result);
    }

    public function test_finds_friend_user_via_driver_user_pivot(): void
    {
        $user = User::factory()->create(['driver_id' => null]);

        // Create friend user with driver connected only via pivot (no legacy driver_id)
        $friendDriver1 = Driver::factory()->create();
        $friendDriver2 = Driver::factory()->create();
        $friendUser = User::factory()->create(['driver_id' => null]);
        $friendUser->drivers()->attach([$friendDriver1->id, $friendDriver2->id]);

        // Add friend via one of their drivers
        Friend::create([
            'user_id' => $user->id,
            'friend_driver_id' => $friendDriver1->id,
            'friendship_status' => 'active',
        ]);
        $traitClass = $this->getTraitUser();

        $result = $traitClass->getAllowedDriverIdsPublic($user);

        // Should find friend user via pivot and include both their drivers
        $this->assertContains($friendDriver1->id, $result);
        $this->assertContains($friendDriver2->id, $result);
    }
}
