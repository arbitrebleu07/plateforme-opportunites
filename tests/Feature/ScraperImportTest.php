<?php

namespace Tests\Feature;

use App\Models\Offre;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScraperImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.scraper.key' => 'test-scraper-key']);
    }

    public function test_scraper_import_cleans_categorizes_and_deduplicates(): void
    {
        $payload = [
            'titre' => '<b>Stage développeur Laravel</b>',
            'description' => '<p>Stage en développement web.</p>',
            'type' => 'stage',
            'source' => 'Example Jobs',
            'url_source' => 'https://example.test/jobs/42',
            'categories' => ['Informatique'],
        ];

        $this->withHeader('X-Scraper-Key', 'test-scraper-key')
            ->postJson('/api/scraper/offres', $payload)
            ->assertCreated()
            ->assertJsonPath('titre', 'Stage développeur Laravel')
            ->assertJsonPath('categorie_principale', 'Stage')
            ->assertJsonPath('sous_categorie', 'Développement web');

        $this->withHeader('X-Scraper-Key', 'test-scraper-key')
            ->postJson('/api/scraper/offres', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Offre déjà existante');

        $this->assertDatabaseCount('offres', 1);
        $this->assertDatabaseHas('categories', [
            'nom' => 'Développement web',
        ]);
    }

    public function test_public_listing_puts_recently_added_offers_first(): void
    {
        $older = Offre::create([
            'titre' => 'Offre ajoutée avant',
            'description' => 'Description ancienne',
            'type' => 'emploi',
            'statut' => 'active',
            'date_publication' => now(),
        ]);
        $newer = Offre::create([
            'titre' => 'Offre ajoutée après',
            'description' => 'Description récente',
            'type' => 'emploi',
            'statut' => 'active',
            'date_publication' => now()->subYear(),
        ]);

        $older->forceFill(['created_at' => now()->subMinute()])->saveQuietly();
        $newer->forceFill(['created_at' => now()])->saveQuietly();

        $this->getJson('/api/offres?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.0.titre', 'Offre ajoutée après')
            ->assertJsonPath('data.1.titre', 'Offre ajoutée avant');
    }
}
