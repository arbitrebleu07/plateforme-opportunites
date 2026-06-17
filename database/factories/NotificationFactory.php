<?php

namespace Database\Factories;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Notification> */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'titre' => fake()->sentence(3),
            'message' => fake()->sentence(),
            'lu' => false,
            'date_notification' => now(),
        ];
    }
}
