<?php

namespace Tests\Unit;

use App\Services\OpportunityDataSanitizationService;
use PHPUnit\Framework\TestCase;

class OpportunityDataSanitizationServiceTest extends TestCase
{
    public function test_it_removes_html_and_rejects_placeholder_titles(): void
    {
        $service = new OpportunityDataSanitizationService;
        $data = $service->sanitize([
            'titre' => '<b>Sans titre</b>',
            'description' => '<p>Texte&nbsp;utile</p>',
        ]);

        $this->assertSame('Sans titre', $data['titre']);
        $this->assertSame('Texte utile', $data['description']);
        $this->assertFalse($service->hasValidContent($data));
    }
}
