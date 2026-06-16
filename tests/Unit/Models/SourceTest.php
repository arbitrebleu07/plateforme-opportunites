<?php

namespace Tests\Unit\Models;

use App\Models\Offre;
use App\Models\Source;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_fillable_attributes(): void
    {
        $source = new Source();
        $this->assertEquals(
            ['nom_site', 'url', 'derniere_recuperation', 'statut'],
            $source->getFillable()
        );
    }

    public function test_primary_key_is_id_source(): void
    {
        $source = new Source();
        $this->assertEquals('id_source', $source->getKeyName());
    }

    public function test_source_has_offres_relationship(): void
    {
        $source = Source::factory()->create();
        $offre = Offre::factory()->create();
        $source->offres()->attach($offre->id_offre);

        $this->assertCount(1, $source->offres);
        $this->assertTrue($source->offres->first()->is($offre));
    }
}
