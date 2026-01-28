<?php

namespace Database\Factories;

use App\Models\KartingSession;
use App\Models\Track;
use Illuminate\Database\Eloquent\Factories\Factory;

class KartingSessionFactory extends Factory
{
    protected $model = KartingSession::class;

    public function definition(): array
    {
        return [
            'track_id' => Track::factory(),
            'session_date' => fake()->dateTimeBetween('-1 year', 'now'),
            'session_type' => fake()->randomElement(['heat', 'qualifying', 'race']),
            'weather_conditions' => fake()->randomElement(['sunny', 'cloudy', 'indoor']),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
