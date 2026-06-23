<?php

namespace Tests\Feature;

use App\Models\Offre;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpireOpportunitiesCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_expires_only_active_opportunities_past_their_deadline(): void
    {
        $expired = Offre::create([
            'titre' => 'Offre arrivée à échéance',
            'description' => 'Description suffisamment complète pour le test.',
            'type' => 'emploi',
            'date_limite' => now()->subDay(),
            'statut' => 'active',
        ]);

        $future = Offre::create([
            'titre' => 'Offre encore valide',
            'description' => 'Description suffisamment complète pour le test.',
            'type' => 'stage',
            'date_limite' => now()->addDay(),
            'statut' => 'active',
        ]);

        $this->artisan('opportunities:expire')
            ->expectsOutput('1 opportunité(s) expirée(s).')
            ->assertSuccessful();

        $this->assertSame('expiree', $expired->fresh()->statut);
        $this->assertSame('active', $future->fresh()->statut);
    }
}
