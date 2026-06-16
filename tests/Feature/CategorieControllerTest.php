<?php

namespace Tests\Feature;

use App\Models\Categorie;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategorieControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_all_categories(): void
    {
        Categorie::factory()->count(3)->create();

        $response = $this->getJson('/api/categories');

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_index_is_publicly_accessible(): void
    {
        $response = $this->getJson('/api/categories');

        $response->assertOk();
    }

    public function test_store_creates_categorie(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/categories', [
            'nom' => 'Technologie',
        ]);

        $response->assertStatus(201)
            ->assertJson(['nom' => 'Technologie']);
        $this->assertDatabaseHas('categories', ['nom' => 'Technologie']);
    }

    public function test_store_rejects_duplicate_name(): void
    {
        $user = User::factory()->create();
        Categorie::factory()->create(['nom' => 'Unique']);

        $response = $this->actingAs($user)->postJson('/api/categories', [
            'nom' => 'Unique',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nom']);
    }

    public function test_store_requires_authentication(): void
    {
        $response = $this->postJson('/api/categories', ['nom' => 'Test']);

        $response->assertStatus(401);
    }

    public function test_store_validation_requires_nom(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/categories', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nom']);
    }

    public function test_update_modifies_categorie(): void
    {
        $user = User::factory()->create();
        $cat = Categorie::factory()->create(['nom' => 'Old']);

        $response = $this->actingAs($user)->putJson("/api/categories/{$cat->id_categorie}", [
            'nom' => 'New',
        ]);

        $response->assertOk()
            ->assertJson(['nom' => 'New']);
    }

    public function test_destroy_deletes_categorie(): void
    {
        $user = User::factory()->create();
        $cat = Categorie::factory()->create();

        $response = $this->actingAs($user)->deleteJson("/api/categories/{$cat->id_categorie}");

        $response->assertOk()
            ->assertJson(['message' => 'Catégorie supprimée avec succès']);
        $this->assertDatabaseMissing('categories', ['id_categorie' => $cat->id_categorie]);
    }
}
