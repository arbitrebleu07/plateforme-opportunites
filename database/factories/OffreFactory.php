<?php

namespace Database\Factories;

use App\Models\Offre;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Offre> */
class OffreFactory extends Factory
{
    protected $model = Offre::class;

    public function definition(): array
    {
        return [
            'titre' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(['emploi', 'stage', 'bourses/concours', 'formation']),
            'entreprise' => fake()->company(),
            'localisation' => fake()->city(),
            'date_limite' => fake()->dateTimeBetween('+1 week', '+3 months'),
            'statut' => 'active',
            'date_publication' => now(),
            'id_utilisateur' => User::factory(),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'date_limite' => fake()->dateTimeBetween('-2 months', '-1 day'),
            'statut' => 'expiree',
        ]);
    }

    public function expiredButActive(): static
    {
        return $this->state(fn () => [
            'date_limite' => fake()->dateTimeBetween('-2 months', '-1 day'),
            'statut' => 'active',
        ]);
    }
}
