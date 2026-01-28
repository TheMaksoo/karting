<?php

namespace Database\Factories;

use App\Models\Track;
use Illuminate\Database\Eloquent\Factories\Factory;

class TrackFactory extends Factory
{
    protected $model = Track::class;

    public function definition(): array
    {
        return [
            'track_id' => fake()->unique()->slug(),
            'name' => fake()->company() . ' Karting',
            'city' => fake()->city(),
            'country' => fake()->country(),
            'distance' => fake()->numberBetween(400, 1500),
            'corners' => fake()->numberBetween(6, 20),
            'indoor' => fake()->boolean(),
            'features' => ['timing_system' => 'electronic'],
        ];
    }

    public function indoor(): static
    {
        return $this->state(fn (array $attributes) => ['indoor' => true]);
    }

    public function outdoor(): static
    {
        return $this->state(fn (array $attributes) => ['indoor' => false]);
    }
}
