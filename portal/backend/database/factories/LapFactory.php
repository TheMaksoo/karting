<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\KartingSession;
use App\Models\Lap;
use Illuminate\Database\Eloquent\Factories\Factory;

class LapFactory extends Factory
{
    protected $model = Lap::class;

    public function definition(): array
    {
        $lapTime = fake()->randomFloat(3, 25, 60);

        return [
            'karting_session_id' => KartingSession::factory(),
            'driver_id' => Driver::factory(),
            'lap_number' => fake()->numberBetween(1, 20),
            'lap_time' => $lapTime,
            'position' => fake()->numberBetween(1, 10),
            'sector_1_time' => $lapTime * 0.35,
            'sector_2_time' => $lapTime * 0.35,
            'sector_3_time' => $lapTime * 0.30,
            'is_best_lap' => false,
        ];
    }

    public function bestLap(): static
    {
        return $this->state(fn (array $attributes) => ['is_best_lap' => true]);
    }
}
