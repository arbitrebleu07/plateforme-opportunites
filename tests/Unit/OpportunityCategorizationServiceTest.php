<?php

namespace Tests\Unit;

use App\Services\OpportunityCategorizationService;
use PHPUnit\Framework\TestCase;

class OpportunityCategorizationServiceTest extends TestCase
{
    public function test_it_detects_a_research_scholarship(): void
    {
        $result = (new OpportunityCategorizationService)->categorize([
            'titre' => 'International PhD scholarship in data science',
            'description' => 'Research grant offered by a university.',
            'type' => 'bourses/concours',
        ]);

        $this->assertSame('Bourse', $result['categorie_principale']);
        $this->assertSame('Bourse universitaire', $result['sous_categorie']);
    }

    public function test_it_uses_the_legacy_type_as_a_fallback(): void
    {
        $result = (new OpportunityCategorizationService)->categorize([
            'titre' => 'Programme 2026',
            'description' => 'Informations générales',
            'type' => 'formation',
        ]);

        $this->assertSame('Formation', $result['categorie_principale']);
    }
}
