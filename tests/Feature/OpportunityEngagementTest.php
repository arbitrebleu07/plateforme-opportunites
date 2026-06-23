<?php

namespace Tests\Feature;

use App\Models\Offre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OpportunityEngagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_publication_requires_admin_approval_before_being_public(): void
    {
        $member = User::factory()->create(['role' => 'membre']);
        Sanctum::actingAs($member);

        $response = $this->postJson('/api/offres', [
            'titre' => 'Stage à modérer',
            'description' => str_repeat('Description complète pour la modération. ', 4),
            'type' => 'stage',
            'entreprise' => 'Example',
            'localisation' => 'Douala',
        ])->assertCreated()
            ->assertJsonPath('moderation_status', 'pending');

        $id = $response->json('id_offre');
        $this->getJson("/api/offres/{$id}")->assertNotFound();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->putJson("/api/admin/offres/{$id}/moderation", [
            'decision' => 'approved',
        ])->assertOk();

        $this->getJson("/api/offres/{$id}")->assertOk();
    }

    public function test_member_can_favorite_report_and_create_an_alert(): void
    {
        $user = User::factory()->create(['role' => 'membre']);
        $offre = Offre::create([
            'titre' => 'Développeur Laravel',
            'description' => 'Description complète',
            'type' => 'emploi',
            'statut' => 'active',
            'moderation_status' => 'approved',
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/favoris/{$offre->id_offre}")->assertCreated();
        $this->getJson('/api/favoris')->assertJsonPath('0.id_offre', $offre->id_offre);

        $this->postJson("/api/offres/{$offre->id_offre}/signaler", [
            'motif' => 'information_incorrecte',
            'details' => 'La ville semble incorrecte.',
        ])->assertCreated();

        $this->postJson('/api/alertes', [
            'nom' => 'Emplois web à Douala',
            'type' => 'emploi',
            'ville' => 'Douala',
            'domaine' => 'Informatique',
        ])->assertCreated();
    }

    public function test_deadline_command_notifies_favorite_users_once(): void
    {
        $user = User::factory()->create();
        $offre = Offre::create([
            'titre' => 'Offre bientôt expirée',
            'description' => 'Description complète',
            'type' => 'emploi',
            'statut' => 'active',
            'moderation_status' => 'approved',
            'date_limite' => now()->addDays(3),
        ]);
        $user->favoris()->attach($offre->id_offre);

        $this->artisan('opportunities:remind-deadlines')->assertSuccessful();
        $this->artisan('opportunities:remind-deadlines')->assertSuccessful();

        $this->assertCount(1, $user->fresh()->notifications);
    }
}
