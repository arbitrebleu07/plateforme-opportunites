<?php

namespace Tests\Feature;

use App\Models\Offre;
use App\Models\Source;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SourceControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_all_sources(): void
    {
        $user = User::factory()->create();
        Source::factory()->count(3)->create();

        $response = $this->actingAs($user)->getJson('/api/sources');

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_index_requires_authentication(): void
    {
        $response = $this->getJson('/api/sources');

        $response->assertStatus(401);
    }

    public function test_show_returns_source_with_offres(): void
    {
        $user = User::factory()->create();
        $source = Source::factory()->create();
        $offre = Offre::factory()->create();
        $source->offres()->attach($offre->id_offre);

        $response = $this->actingAs($user)->getJson("/api/sources/{$source->id_source}");

        $response->assertOk()
            ->assertJsonStructure(['id_source', 'nom_site', 'offres']);
        $this->assertCount(1, $response->json('offres'));
    }

    public function test_store_creates_source(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sources', [
            'nom_site' => 'Indeed',
            'url' => 'https://indeed.com',
        ]);

        $response->assertStatus(201)
            ->assertJson(['nom_site' => 'Indeed']);
        $this->assertDatabaseHas('sources', ['nom_site' => 'Indeed']);
    }

    public function test_store_rejects_duplicate_url(): void
    {
        $user = User::factory()->create();
        Source::factory()->create(['url' => 'https://dup.com']);

        $response = $this->actingAs($user)->postJson('/api/sources', [
            'nom_site' => 'Dup',
            'url' => 'https://dup.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    public function test_store_validation_requires_nom_site_and_url(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/sources', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nom_site', 'url']);
    }

    public function test_update_modifies_source(): void
    {
        $user = User::factory()->create();
        $source = Source::factory()->create();

        $response = $this->actingAs($user)->putJson("/api/sources/{$source->id_source}", [
            'nom_site' => 'Updated',
        ]);

        $response->assertOk()
            ->assertJson(['nom_site' => 'Updated']);
    }

    public function test_update_rejects_duplicate_url_from_other_source(): void
    {
        $user = User::factory()->create();
        Source::factory()->create(['url' => 'https://taken.com']);
        $source = Source::factory()->create();

        $response = $this->actingAs($user)->putJson("/api/sources/{$source->id_source}", [
            'url' => 'https://taken.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    public function test_update_allows_keeping_same_url(): void
    {
        $user = User::factory()->create();
        $source = Source::factory()->create(['url' => 'https://mine.com']);

        $response = $this->actingAs($user)->putJson("/api/sources/{$source->id_source}", [
            'url' => 'https://mine.com',
            'nom_site' => 'Renamed',
        ]);

        $response->assertOk();
    }

    public function test_destroy_deletes_source(): void
    {
        $user = User::factory()->create();
        $source = Source::factory()->create();

        $response = $this->actingAs($user)->deleteJson("/api/sources/{$source->id_source}");

        $response->assertOk()
            ->assertJson(['message' => 'Source supprimée avec succès']);
        $this->assertDatabaseMissing('sources', ['id_source' => $source->id_source]);
    }
}
