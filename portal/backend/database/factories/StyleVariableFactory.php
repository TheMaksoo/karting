<?php

namespace Database\Factories;

use App\Models\StyleVariable;
use Illuminate\Database\Eloquent\Factories\Factory;

class StyleVariableFactory extends Factory
{
    protected $model = StyleVariable::class;

    public function definition(): array
    {
        return [
            'key' => $this->faker->word . '-' . $this->faker->unique()->numberBetween(1, 999999),
            'value' => $this->faker->hexColor(),
            'category' => $this->faker->randomElement(['colors', 'fonts', 'spacing', 'borders']),
            'label' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'type' => $this->faker->randomElement(['color', 'size', 'string']),
            'metadata' => [],
        ];
    }
}
