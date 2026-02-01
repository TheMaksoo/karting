<?php

namespace Tests\Unit;

use App\Services\SessionCalculatorService;
use PHPUnit\Framework\TestCase;

class SessionCalculatorServiceTest extends TestCase
{
    private SessionCalculatorService $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new SessionCalculatorService();
    }

    // ==================== calculateGapToLeader Tests ====================

    public function test_calculate_gap_to_leader_with_slower_lap(): void
    {
        $gap = $this->calculator->calculateGapToLeader(45.500, 44.200);

        $this->assertEquals(1.3, $gap);
    }

    public function test_calculate_gap_to_leader_with_equal_time(): void
    {
        $gap = $this->calculator->calculateGapToLeader(44.200, 44.200);

        $this->assertEquals(0.0, $gap);
    }

    public function test_calculate_gap_to_leader_with_faster_lap(): void
    {
        // Theoretically shouldn't happen, but test the math
        $gap = $this->calculator->calculateGapToLeader(44.000, 44.500);

        $this->assertEquals(-0.5, $gap);
    }

    // ==================== calculateAverageSpeed Tests ====================

    public function test_calculate_average_speed_normal(): void
    {
        // 500m in 50s = 10 m/s = 36 km/h
        $speed = $this->calculator->calculateAverageSpeed(50.0, 500);
        $this->assertEquals(36.0, $speed);
    }

    public function test_calculate_average_speed_1km_track(): void
    {
        // 1000m in 60s = 16.67 m/s = 60 km/h
        $speed = $this->calculator->calculateAverageSpeed(60.0, 1000);
        $this->assertEquals(60.0, $speed);
    }

    public function test_calculate_average_speed_handles_zero_time(): void
    {
        $speed = $this->calculator->calculateAverageSpeed(0, 500);
        $this->assertEquals(0.0, $speed);
    }

    public function test_calculate_average_speed_handles_zero_distance(): void
    {
        $speed = $this->calculator->calculateAverageSpeed(50.0, 0);
        $this->assertEquals(0.0, $speed);
    }

    public function test_calculate_average_speed_handles_negative_time(): void
    {
        $speed = $this->calculator->calculateAverageSpeed(-50.0, 500);
        $this->assertEquals(0.0, $speed);
    }

    // ==================== calculateInterval Tests ====================

    public function test_calculate_interval_slower(): void
    {
        // Previous lap: 44.0, Current lap: 46.0 = +2.0 slower
        $interval = $this->calculator->calculateInterval(46.0, 44.0);
        $this->assertEquals(2.0, $interval);
    }

    public function test_calculate_interval_faster(): void
    {
        // Previous lap: 45.0, Current lap: 44.0 = -1.0 faster
        $interval = $this->calculator->calculateInterval(44.0, 45.0);
        $this->assertEquals(-1.0, $interval);
    }

    public function test_calculate_interval_same_time(): void
    {
        $interval = $this->calculator->calculateInterval(44.0, 44.0);
        $this->assertEquals(0.0, $interval);
    }

    // ==================== formatLapTime Tests ====================

    public function test_format_lap_time_under_minute(): void
    {
        $formatted = $this->calculator->formatLapTime(45.123);
        $this->assertEquals('45.123', $formatted);
    }

    public function test_format_lap_time_over_minute(): void
    {
        $formatted = $this->calculator->formatLapTime(75.456);
        $this->assertEquals('1:15.456', $formatted);
    }

    public function test_format_lap_time_exactly_one_minute(): void
    {
        $formatted = $this->calculator->formatLapTime(60.000);
        $this->assertEquals('1:00.000', $formatted);
    }

    // ==================== findBestLap Tests ====================

    public function test_find_best_lap_index(): void
    {
        $laps = [
            ['lap_time' => 45.500],
            ['lap_time' => 44.200],
            ['lap_time' => 45.100],
        ];

        $bestIndex = $this->calculator->findBestLapIndex($laps);
        $this->assertEquals(1, $bestIndex); // Second lap (index 1) is fastest
    }

    public function test_find_best_lap_index_empty(): void
    {
        $laps = [];

        $bestIndex = $this->calculator->findBestLapIndex($laps);
        $this->assertEquals(-1, $bestIndex);
    }

    public function test_find_best_lap_index_single_lap(): void
    {
        $laps = [['lap_time' => 45.000]];

        $bestIndex = $this->calculator->findBestLapIndex($laps);
        $this->assertEquals(0, $bestIndex);
    }
}
