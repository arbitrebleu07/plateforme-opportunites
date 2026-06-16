<?php

namespace Tests\Unit\Models;

use App\Models\Categorie;
use App\Models\Offre;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategorieTest extends TestCase
{
    use RefreshDatabase;

    public function test_fillable_attributes(): void
    {
        $categorie = new Categorie();
        $this->assertEquals(['nom'], $categorie->getFillable());
    }

    public function test_primary_key_is_id_categorie(): void
    {
        $categorie = new Categorie();
        $this->assertEquals('id_categorie', $categorie->getKeyName());
    }

    public function test_categorie_has_offres_relationship(): void
    {
        $categorie = Categorie::factory()->create();
        $offre = Offre::factory()->create();
        $categorie->offres()->attach($offre->id_offre);

        $this->assertCount(1, $categorie->offres);
        $this->assertTrue($categorie->offres->first()->is($offre));
    }
}
