<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_user_notifications(): void
    {
        $user = User::factory()->create();
        $notif1 = Notification::factory()->create();
        $notif2 = Notification::factory()->create();
        $user->notifications()->attach([$notif1->id_notification, $notif2->id_notification]);

        $otherUser = User::factory()->create();
        $otherNotif = Notification::factory()->create();
        $otherUser->notifications()->attach($otherNotif->id_notification);

        $response = $this->actingAs($user)->getJson('/api/notifications');

        $response->assertOk();
        $this->assertCount(2, $response->json());
    }

    public function test_index_requires_authentication(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(401);
    }

    public function test_marquer_lu_marks_notification_as_read(): void
    {
        $user = User::factory()->create();
        $notif = Notification::factory()->create(['lu' => false]);
        $user->notifications()->attach($notif->id_notification);

        $response = $this->actingAs($user)->putJson("/api/notifications/{$notif->id_notification}/lire");

        $response->assertOk()
            ->assertJson(['message' => 'Notification marquée comme lue']);

        $this->assertDatabaseHas('notifications', [
            'id_notification' => $notif->id_notification,
            'lu' => true,
        ]);
    }
}
