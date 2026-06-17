<?php

namespace Tests\Feature;

use App\Models\Categorie;
use App\Models\Offre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_stats_returns_counts(): void
    {
        $admin = $this->createAdmin();
        User::factory()->count(2)->create();
        Offre::factory()->count(3)->create(['statut' => 'active']);
        Offre::factory()->expired()->create();
        Categorie::factory()->count(2)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/stats');

        $response->assertOk()
            ->assertJsonStructure(['users_count', 'offres_count', 'active_offres_count', 'categories_count']);

        $data = $response->json();
        $this->assertGreaterThan(0, $data['users_count']);
        $this->assertEquals(4, $data['offres_count']);
        $this->assertEquals(3, $data['active_offres_count']);
        $this->assertEquals(2, $data['categories_count']);
    }

    public function test_stats_denied_for_non_admin(): void
    {
        $user = User::factory()->create(['role' => 'membre']);

        $response = $this->actingAs($user)->getJson('/api/admin/stats');

        $response->assertStatus(403);
    }

    public function test_stats_denied_for_unauthenticated(): void
    {
        $response = $this->getJson('/api/admin/stats');

        $response->assertStatus(401);
    }

    public function test_utilisateurs_lists_all_users(): void
    {
        $admin = $this->createAdmin();
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/utilisateurs');

        $response->assertOk();
        $this->assertCount(4, $response->json()); // admin + 3
    }

    public function test_changer_role_updates_user_role(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create(['role' => 'membre']);

        $response = $this->actingAs($admin)->putJson("/api/admin/utilisateurs/{$user->id}/role", [
            'role' => 'admin',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Rôle mis à jour avec succès']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'admin',
        ]);
    }

    public function test_changer_role_validation_rejects_invalid_role(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->putJson("/api/admin/utilisateurs/{$user->id}/role", [
            'role' => 'superadmin',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_supprimer_utilisateur_deletes_user(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/utilisateurs/{$user->id}");

        $response->assertOk()
            ->assertJson(['message' => 'Utilisateur supprimé avec succès']);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_offres_lists_all_offres(): void
    {
        $admin = $this->createAdmin();
        Offre::factory()->count(2)->create(['statut' => 'active']);
        Offre::factory()->expired()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/offres');

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_changer_statut_offre_updates_status(): void
    {
        $admin = $this->createAdmin();
        $offre = Offre::factory()->create(['statut' => 'active']);

        $response = $this->actingAs($admin)->putJson("/api/admin/offres/{$offre->id_offre}/statut", [
            'statut' => 'expiree',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Statut mis à jour avec succès']);
        $this->assertDatabaseHas('offres', [
            'id_offre' => $offre->id_offre,
            'statut' => 'expiree',
        ]);
    }

    public function test_changer_statut_offre_creates_notification(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create();
        $offre = Offre::factory()->create([
            'statut' => 'active',
            'id_utilisateur' => $user->id,
        ]);

        $this->actingAs($admin)->putJson("/api/admin/offres/{$offre->id_offre}/statut", [
            'statut' => 'expiree',
        ]);

        $this->assertDatabaseHas('notifications', [
            'titre' => 'Statut de votre offre modifié',
        ]);
    }

    public function test_changer_statut_no_notification_when_same_status(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create();
        $offre = Offre::factory()->create([
            'statut' => 'active',
            'id_utilisateur' => $user->id,
        ]);

        $this->actingAs($admin)->putJson("/api/admin/offres/{$offre->id_offre}/statut", [
            'statut' => 'active',
        ]);

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_supprimer_offre_deletes_offre(): void
    {
        $admin = $this->createAdmin();
        $offre = Offre::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/admin/offres/{$offre->id_offre}");

        $response->assertOk()
            ->assertJson(['message' => 'Offre supprimée avec succès']);
        $this->assertDatabaseMissing('offres', ['id_offre' => $offre->id_offre]);
    }

    public function test_supprimer_offre_creates_notification_for_owner(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create();
        $offre = Offre::factory()->create(['id_utilisateur' => $user->id]);

        $this->actingAs($admin)->deleteJson("/api/admin/offres/{$offre->id_offre}");

        $this->assertDatabaseHas('notifications', [
            'titre' => 'Offre supprimée',
        ]);
    }

    public function test_admin_routes_denied_for_regular_user(): void
    {
        $user = User::factory()->create(['role' => 'membre']);

        $this->actingAs($user)->getJson('/api/admin/utilisateurs')->assertStatus(403);
        $this->actingAs($user)->getJson('/api/admin/offres')->assertStatus(403);
        $this->actingAs($user)->getJson('/api/admin/stats')->assertStatus(403);
    }
}
