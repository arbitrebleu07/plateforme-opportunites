<?php

namespace Tests\Unit\Models;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_fillable_attributes(): void
    {
        $notification = new Notification();
        $this->assertEquals(
            ['titre', 'message', 'lu', 'date_notification'],
            $notification->getFillable()
        );
    }

    public function test_primary_key_is_id_notification(): void
    {
        $notification = new Notification();
        $this->assertEquals('id_notification', $notification->getKeyName());
    }

    public function test_notification_has_utilisateurs_relationship(): void
    {
        $notification = Notification::factory()->create();
        $user = User::factory()->create();
        $notification->utilisateurs()->attach($user->id);

        $this->assertCount(1, $notification->utilisateurs);
        $this->assertTrue($notification->utilisateurs->first()->is($user));
    }
}
