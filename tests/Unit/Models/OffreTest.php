<?php

namespace Tests\Unit\Models;

use App\Models\Categorie;
use App\Models\Offre;
use App\Models\Source;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OffreTest extends TestCase
{
    use RefreshDatabase;

    public function test_fillable_attributes(): void
    {
        $offre = new Offre();
        $this->assertEquals(
            ['titre', 'description', 'type', 'entreprise', 'localisation', 'date_limite', 'statut', 'source', 'date_publication', 'id_utilisateur'],
            $offre->getFillable()
        );
    }

    public function test_primary_key_is_id_offre(): void
    {
        $offre = new Offre();
        $this->assertEquals('id_offre', $offre->getKeyName());
    }

    public function test_offre_has_categories_relationship(): void
    {
        $offre = Offre::factory()->create();
        $categorie = Categorie::factory()->create();
        $offre->categories()->attach($categorie->id_categorie);

        $this->assertCount(1, $offre->categories);
        $this->assertTrue($offre->categories->first()->is($categorie));
    }

    public function test_offre_has_sources_relationship(): void
    {
        $offre = Offre::factory()->create();
        $source = Source::factory()->create();
        $offre->sources()->attach($source->id_source);

        $this->assertCount(1, $offre->sources);
        $this->assertTrue($offre->sources->first()->is($source));
    }

    public function test_offre_has_utilisateurs_relationship(): void
    {
        $offre = Offre::factory()->create();
        $user = User::factory()->create();
        $offre->utilisateurs()->attach($user->id);

        $this->assertCount(1, $offre->utilisateurs);
        $this->assertTrue($offre->utilisateurs->first()->is($user));
    }

    public function test_create_offre_via_factory(): void
    {
        $offre = Offre::factory()->create();

        $this->assertDatabaseHas('offres', [
            'id_offre' => $offre->id_offre,
            'titre' => $offre->titre,
        ]);
    }

    public function test_expired_factory_state(): void
    {
        $offre = Offre::factory()->expired()->create();

        $this->assertEquals('expiree', $offre->statut);
        $this->assertTrue($offre->date_limite < now());
    }
}
