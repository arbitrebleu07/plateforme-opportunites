<?php

namespace Tests\Feature;

use App\Models\Offre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.scraper.key' => 'test-scraper-key']);
    }

    public function test_registration_rejects_role_injection_and_creates_members(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Compte malveillant',
            'email' => 'attacker@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseMissing('users', [
            'email' => 'attacker@example.test',
        ]);

        $this->postJson('/api/register', [
            'name' => 'Membre normal',
            'email' => 'member@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated()
            ->assertJsonPath('user.role', 'membre');
    }

    public function test_scraper_import_requires_the_configured_key(): void
    {
        $payload = [
            'titre' => 'Stage sécurisé',
            'description' => 'Une annonce suffisamment détaillée pour vérifier la protection du point d’import.',
            'type' => 'stage',
        ];

        $this->postJson('/api/scraper/offres', $payload)
            ->assertUnauthorized();

        $this->withHeader('X-Scraper-Key', 'wrong-key')
            ->postJson('/api/scraper/offres', $payload)
            ->assertUnauthorized();

        $this->withHeader('X-Scraper-Key', 'test-scraper-key')
            ->postJson('/api/scraper/offres', $payload)
            ->assertCreated();
    }

    public function test_only_an_admin_can_clean_duplicates(): void
    {
        Offre::create([
            'titre' => 'Offre dupliquée',
            'description' => 'Première occurrence de l’offre.',
            'type' => 'emploi',
        ]);
        Offre::create([
            'titre' => 'Offre dupliquée',
            'description' => 'Deuxième occurrence de l’offre.',
            'type' => 'emploi',
        ]);

        $this->postJson('/api/admin/offres/clean-duplicates')
            ->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create(['role' => 'membre']));
        $this->postJson('/api/admin/offres/clean-duplicates')
            ->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->postJson('/api/admin/offres/clean-duplicates')
            ->assertOk()
            ->assertJsonPath('deleted_count', 1);
    }

    public function test_admin_can_assign_only_supported_roles(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $target = User::factory()->create(['role' => 'membre']);

        $this->putJson("/api/admin/utilisateurs/{$target->id}/role", [
            'role' => 'user',
        ])->assertUnprocessable();

        $this->putJson("/api/admin/utilisateurs/{$target->id}/role", [
            'role' => 'admin',
        ])->assertOk()
            ->assertJsonPath('user.role', 'admin');

        $this->putJson("/api/admin/utilisateurs/{$target->id}/role", [
            'role' => 'membre',
        ])->assertOk()
            ->assertJsonPath('user.role', 'membre');
    }

    public function test_only_an_admin_can_delete_an_offer(): void
    {
        $offre = Offre::create([
            'titre' => 'Offre à supprimer',
            'description' => 'Description complète pour tester la suppression administrative.',
            'type' => 'emploi',
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'membre']));
        $this->deleteJson("/api/admin/offres/{$offre->id_offre}")
            ->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->deleteJson("/api/admin/offres/{$offre->id_offre}")
            ->assertOk();

        $this->assertDatabaseMissing('offres', [
            'id_offre' => $offre->id_offre,
        ]);
    }
}
