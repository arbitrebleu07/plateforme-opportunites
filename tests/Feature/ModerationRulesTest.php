<?php

namespace Tests\Feature;

use App\Models\Offre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModerationRulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejection_requires_a_reason(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create(['role' => 'membre']);
        $offre = Offre::create([
            'titre' => 'Annonce à corriger',
            'description' => 'Description complète.',
            'type' => 'stage',
            'statut' => 'active',
            'moderation_status' => 'pending',
            'id_utilisateur' => $owner->id,
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/offres/{$offre->id_offre}/moderation", [
            'decision' => 'rejected',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('note')
            ->assertJsonPath('errors.note.0', 'Le motif du refus est obligatoire.');

        $this->assertSame('pending', $offre->fresh()->moderation_status);
    }

    public function test_rejection_reason_is_stored_and_sent_to_the_owner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create(['role' => 'membre']);
        $offre = Offre::create([
            'titre' => 'Annonce incomplète',
            'description' => 'Description complète.',
            'type' => 'emploi',
            'statut' => 'active',
            'moderation_status' => 'pending',
            'id_utilisateur' => $owner->id,
        ]);
        $reason = 'Précisez la localisation et le type de contrat.';

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/offres/{$offre->id_offre}/moderation", [
            'decision' => 'rejected',
            'note' => $reason,
        ])->assertOk()
            ->assertJsonPath('moderation_status', 'rejected')
            ->assertJsonPath('moderation_note', $reason);

        $notification = $owner->fresh()->notifications()->first();

        $this->assertNotNull($notification);
        $this->assertStringContainsString($reason, $notification->message);
    }
}
