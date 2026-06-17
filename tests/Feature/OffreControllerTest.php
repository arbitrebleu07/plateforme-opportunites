<?php

namespace Tests\Feature;

use App\Models\Categorie;
use App\Models\Offre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OffreControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_active_offres(): void
    {
        Offre::factory()->count(3)->create(['statut' => 'active']);
        Offre::factory()->expired()->create();

        $response = $this->getJson('/api/offres');

        $response->assertOk()
            ->assertJsonPath('total', 3);
    }

    public function test_index_auto_expires_past_due_offres(): void
    {
        $offre = Offre::factory()->expiredButActive()->create();

        $this->getJson('/api/offres');

        $this->assertDatabaseHas('offres', [
            'id_offre' => $offre->id_offre,
            'statut' => 'expiree',
        ]);
    }

    public function test_index_creates_notification_for_expired_offre(): void
    {
        $user = User::factory()->create();
        Offre::factory()->expiredButActive()->create(['id_utilisateur' => $user->id]);

        $this->getJson('/api/offres');

        $this->assertDatabaseHas('notifications', [
            'titre' => 'Offre expirée',
        ]);
    }

    public function test_index_filters_by_search(): void
    {
        Offre::factory()->create(['titre' => 'Laravel Developer', 'statut' => 'active']);
        Offre::factory()->create(['titre' => 'React Developer', 'statut' => 'active']);

        $response = $this->getJson('/api/offres?search=Laravel');

        $response->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_index_filters_by_type(): void
    {
        Offre::factory()->create(['type' => 'emploi', 'statut' => 'active']);
        Offre::factory()->create(['type' => 'stage', 'statut' => 'active']);

        $response = $this->getJson('/api/offres?type=emploi');

        $response->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_index_filters_by_category(): void
    {
        $cat = Categorie::factory()->create();
        $offre = Offre::factory()->create(['statut' => 'active']);
        $offre->categories()->attach($cat->id_categorie);
        Offre::factory()->create(['statut' => 'active']);

        $response = $this->getJson('/api/offres?category=' . $cat->id_categorie);

        $response->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_show_returns_offre_with_categories_and_sources(): void
    {
        $offre = Offre::factory()->create();

        $response = $this->getJson('/api/offres/' . $offre->id_offre);

        $response->assertOk()
            ->assertJsonStructure(['id_offre', 'titre', 'categories', 'sources']);
    }

    public function test_show_returns_404_for_nonexistent_offre(): void
    {
        $response = $this->getJson('/api/offres/999');

        $response->assertStatus(404)
            ->assertJson(['message' => 'Offre non trouvée']);
    }

    public function test_store_creates_offre_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/offres', [
            'titre' => 'New Job',
            'description' => 'Description here',
            'type' => 'emploi',
        ]);

        $response->assertStatus(201)
            ->assertJson(['titre' => 'New Job']);

        $this->assertDatabaseHas('offres', [
            'titre' => 'New Job',
            'id_utilisateur' => $user->id,
        ]);
    }

    public function test_store_attaches_categories(): void
    {
        $user = User::factory()->create();
        $cat = Categorie::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/offres', [
            'titre' => 'Categorized',
            'description' => 'With cat',
            'type' => 'stage',
            'categories' => [$cat->id_categorie],
        ]);

        $response->assertStatus(201);

        $offre = Offre::where('titre', 'Categorized')->first();
        $this->assertCount(1, $offre->categories);
    }

    public function test_store_validation_fails_without_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/offres', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['titre', 'description', 'type']);
    }

    public function test_store_requires_authentication(): void
    {
        $response = $this->postJson('/api/offres', [
            'titre' => 'Test',
            'description' => 'Test',
            'type' => 'emploi',
        ]);

        $response->assertStatus(401);
    }

    public function test_update_modifies_offre_for_owner(): void
    {
        $user = User::factory()->create();
        $offre = Offre::factory()->create(['id_utilisateur' => $user->id]);

        $response = $this->actingAs($user)->putJson('/api/offres/' . $offre->id_offre, [
            'titre' => 'Updated Title',
        ]);

        $response->assertOk()
            ->assertJson(['titre' => 'Updated Title']);
    }

    public function test_update_allowed_for_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create();
        $offre = Offre::factory()->create(['id_utilisateur' => $owner->id]);

        $response = $this->actingAs($admin)->putJson('/api/offres/' . $offre->id_offre, [
            'titre' => 'Admin Updated',
        ]);

        $response->assertOk()
            ->assertJson(['titre' => 'Admin Updated']);
    }

    public function test_update_denied_for_non_owner(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $offre = Offre::factory()->create(['id_utilisateur' => $other->id]);

        $response = $this->actingAs($user)->putJson('/api/offres/' . $offre->id_offre, [
            'titre' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_update_returns_404_for_nonexistent(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson('/api/offres/999', [
            'titre' => 'Ghost',
        ]);

        $response->assertStatus(404);
    }

    public function test_update_syncs_categories(): void
    {
        $user = User::factory()->create();
        $offre = Offre::factory()->create(['id_utilisateur' => $user->id]);
        $cat1 = Categorie::factory()->create();
        $cat2 = Categorie::factory()->create();
        $offre->categories()->attach($cat1->id_categorie);

        $this->actingAs($user)->putJson('/api/offres/' . $offre->id_offre, [
            'categories' => [$cat2->id_categorie],
        ]);

        $offre->refresh();
        $this->assertCount(1, $offre->categories);
        $this->assertEquals($cat2->id_categorie, $offre->categories->first()->id_categorie);
    }

    public function test_destroy_deletes_offre_for_owner(): void
    {
        $user = User::factory()->create();
        $offre = Offre::factory()->create(['id_utilisateur' => $user->id]);

        $response = $this->actingAs($user)->deleteJson('/api/offres/' . $offre->id_offre);

        $response->assertOk()
            ->assertJson(['message' => 'Offre supprimée avec succès']);
        $this->assertDatabaseMissing('offres', ['id_offre' => $offre->id_offre]);
    }

    public function test_destroy_denied_for_non_owner(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $offre = Offre::factory()->create(['id_utilisateur' => $other->id]);

        $response = $this->actingAs($user)->deleteJson('/api/offres/' . $offre->id_offre);

        $response->assertStatus(403);
    }

    public function test_destroy_returns_404_for_nonexistent(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->deleteJson('/api/offres/999');

        $response->assertStatus(404);
    }

    public function test_mes_offres_returns_current_user_offres(): void
    {
        $user = User::factory()->create();
        Offre::factory()->count(2)->create(['id_utilisateur' => $user->id]);
        Offre::factory()->create(); // another user's offre

        $response = $this->actingAs($user)->getJson('/api/mes-offres');

        $response->assertOk()
            ->assertJsonPath('total', 2);
    }

    public function test_mes_offres_filters_by_statut(): void
    {
        $user = User::factory()->create();
        Offre::factory()->create(['id_utilisateur' => $user->id, 'statut' => 'active']);
        Offre::factory()->expired()->create(['id_utilisateur' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/mes-offres?statut=active');

        $response->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_mes_offres_auto_expires_past_due(): void
    {
        $user = User::factory()->create();
        $offre = Offre::factory()->expiredButActive()->create(['id_utilisateur' => $user->id]);

        $this->actingAs($user)->getJson('/api/mes-offres');

        $this->assertDatabaseHas('offres', [
            'id_offre' => $offre->id_offre,
            'statut' => 'expiree',
        ]);
    }

    public function test_mes_offres_requires_authentication(): void
    {
        $response = $this->getJson('/api/mes-offres');

        $response->assertStatus(401);
    }
}
