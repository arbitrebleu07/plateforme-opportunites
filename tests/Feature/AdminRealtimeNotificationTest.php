<?php

namespace Tests\Feature;

use App\Models\Offre;
use App\Models\Signalement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminRealtimeNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_admin_receives_an_independent_notification_for_a_member_offer(): void
    {
        $member = User::factory()->create(['role' => 'membre', 'name' => 'Membre Test']);
        $firstAdmin = User::factory()->create(['role' => 'admin']);
        $secondAdmin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($member);

        $this->postJson('/api/offres', [
            'titre' => 'Stage React à modérer',
            'description' => str_repeat('Description complète de cette opportunité. ', 4),
            'type' => 'stage',
            'entreprise' => 'Example',
            'localisation' => 'Douala',
        ])->assertCreated();

        $firstNotification = $firstAdmin->fresh()->notifications()->first();
        $secondNotification = $secondAdmin->fresh()->notifications()->first();

        $this->assertNotNull($firstNotification);
        $this->assertNotNull($secondNotification);
        $this->assertNotSame($firstNotification->id_notification, $secondNotification->id_notification);
        $this->assertStringContainsString('Stage React à modérer', $firstNotification->message);

        Sanctum::actingAs($firstAdmin);
        $this->putJson("/api/notifications/{$firstNotification->id_notification}/lire")
            ->assertOk();

        $this->assertTrue((bool) $firstNotification->fresh()->lu);
        $this->assertFalse((bool) $secondNotification->fresh()->lu);
    }

    public function test_admin_receives_a_notification_when_an_offer_is_reported(): void
    {
        $member = User::factory()->create(['role' => 'membre', 'name' => 'Visiteur Test']);
        $admin = User::factory()->create(['role' => 'admin']);
        $offre = Offre::create([
            'titre' => 'Annonce à vérifier',
            'description' => 'Description complète.',
            'type' => 'emploi',
            'statut' => 'active',
            'moderation_status' => 'approved',
        ]);
        Sanctum::actingAs($member);

        $this->postJson("/api/offres/{$offre->id_offre}/signaler", [
            'motif' => 'information_incorrecte',
            'details' => 'La localisation semble incorrecte.',
        ])->assertCreated();

        $notification = $admin->fresh()->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertSame('Nouveau signalement', $notification->titre);
        $this->assertStringContainsString('Annonce à vérifier', $notification->message);
    }

    public function test_reporter_is_notified_when_the_admin_updates_the_report(): void
    {
        $member = User::factory()->create(['role' => 'membre']);
        $admin = User::factory()->create(['role' => 'admin']);
        $offre = Offre::create([
            'titre' => 'Annonce signalée',
            'description' => 'Description complète.',
            'type' => 'emploi',
            'statut' => 'active',
            'moderation_status' => 'approved',
        ]);
        $report = Signalement::create([
            'user_id' => $member->id,
            'offre_id' => $offre->id_offre,
            'motif' => 'lien_invalide',
            'details' => 'Le lien ne fonctionne plus.',
            'statut' => 'nouveau',
        ]);
        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/signalements/{$report->id}", [
            'statut' => 'en_cours',
        ])->assertOk()
            ->assertJsonPath('statut', 'en_cours');

        $notification = $member->fresh()->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertStringContainsString('en cours de vérification', $notification->message);
    }
}
