<?php

namespace Tests\Unit\Models;

use App\Models\Notification;
use App\Models\Offre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_fillable_attributes(): void
    {
        $user = new User();
        $this->assertEquals(
            ['name', 'email', 'password', 'role', 'date_creation'],
            $user->getFillable()
        );
    }

    public function test_hidden_attributes(): void
    {
        $user = new User();
        $this->assertEquals(['password', 'remember_token'], $user->getHidden());
    }

    public function test_casts_password_and_email_verified_at(): void
    {
        $user = new User();
        $casts = $user->getCasts();
        $this->assertEquals('datetime', $casts['email_verified_at']);
        $this->assertEquals('hashed', $casts['password']);
    }

    public function test_user_has_offres_relationship(): void
    {
        $user = User::factory()->create();
        $offre = Offre::factory()->create();
        $user->offres()->attach($offre->id_offre);

        $this->assertCount(1, $user->offres);
        $this->assertTrue($user->offres->first()->is($offre));
    }

    public function test_user_has_notifications_relationship(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create();
        $user->notifications()->attach($notification->id_notification);

        $this->assertCount(1, $user->notifications);
        $this->assertTrue($user->notifications->first()->is($notification));
    }

    public function test_create_user_via_factory(): void
    {
        $user = User::factory()->create();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => $user->email,
        ]);
    }
}
