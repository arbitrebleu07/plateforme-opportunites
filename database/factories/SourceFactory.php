<?php

namespace Database\Factories;

use App\Models\Source;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Source> */
class SourceFactory extends Factory
{
    protected $model = Source::class;

    public function definition(): array
    {
        return [
            'nom_site' => fake()->company(),
            'url' => fake()->unique()->url(),
            'statut' => 'actif',
        ];
    }
}
