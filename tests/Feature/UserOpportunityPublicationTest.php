<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserOpportunityPublicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_publish_and_list_an_opportunity(): void
    {
        $user = User::factory()->create(['role' => 'membre']);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/offres', [
            'titre' => 'Stage développeur React',
            'description' => 'Une description complète qui permet de valider la publication réelle de cette opportunité depuis le frontend React.',
            'type' => 'stage',
            'entreprise' => 'OpportuniTech',
            'localisation' => 'Douala',
            'missions' => ['Développer des interfaces accessibles'],
            'competences' => ['React', 'Laravel'],
            'tags' => ['Informatique'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('id_utilisateur', $user->id)
            ->assertJsonPath('missions.0', 'Développer des interfaces accessibles');

        $this->getJson('/api/mes-offres')
            ->assertOk()
            ->assertJsonPath('data.0.titre', 'Stage développeur React');
    }
}
