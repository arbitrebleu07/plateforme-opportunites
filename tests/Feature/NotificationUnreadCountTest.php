<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationUnreadCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_unread_count_is_scoped_to_the_authenticated_user_and_updates_after_reading(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $unread = Notification::create([
            'titre' => 'Nouvelle offre',
            'message' => 'Une opportunité correspond à vos critères.',
            'lu' => false,
            'date_notification' => now(),
        ]);
        $read = Notification::create([
            'titre' => 'Déjà lue',
            'message' => 'Cette notification est déjà lue.',
            'lu' => true,
            'date_notification' => now(),
        ]);
        $otherUnread = Notification::create([
            'titre' => 'Autre utilisateur',
            'message' => 'Cette notification ne doit pas être comptée.',
            'lu' => false,
            'date_notification' => now(),
        ]);

        $user->notifications()->attach([$unread->id_notification, $read->id_notification]);
        $otherUser->notifications()->attach($otherUnread->id_notification);

        Sanctum::actingAs($user);

        $this->getJson('/api/notifications/non-lues/count')
            ->assertOk()
            ->assertExactJson(['count' => 1]);

        $this->putJson("/api/notifications/{$unread->id_notification}/lire")
            ->assertOk();

        $this->getJson('/api/notifications/non-lues/count')
            ->assertOk()
            ->assertExactJson(['count' => 0]);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $notification = Notification::create([
            'titre' => 'Privée',
            'message' => 'Notification appartenant à un autre utilisateur.',
            'lu' => false,
            'date_notification' => now(),
        ]);
        $otherUser->notifications()->attach($notification->id_notification);

        Sanctum::actingAs($user);

        $this->putJson("/api/notifications/{$notification->id_notification}/lire")
            ->assertForbidden();

        $this->assertSame(0, $notification->fresh()->lu);
    }
}
