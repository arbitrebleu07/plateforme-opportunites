<?php

namespace Tests\Feature;

use App\Models\Offre;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OpportunityDateRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.scraper.key' => 'test-scraper-key']);
        Carbon::setTestNow('2026-06-23 10:30:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_member_offer_is_published_at_approval_time_without_changing_existing_publications(): void
    {
        $member = User::factory()->create(['role' => 'membre']);
        Sanctum::actingAs($member);

        $response = $this->postJson('/api/offres', $this->validOfferPayload())
            ->assertCreated()
            ->assertJsonPath('date_publication', null);

        $offre = Offre::findOrFail($response->json('id_offre'));
        $this->assertNull($offre->date_publication);

        Carbon::setTestNow('2026-06-24 14:45:00');
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/offres/{$offre->id_offre}/moderation", [
            'decision' => 'approved',
        ])->assertOk();

        $this->assertSame(
            '2026-06-24 14:45:00',
            $offre->fresh()->date_publication->format('Y-m-d H:i:s')
        );

        Carbon::setTestNow('2026-06-25 09:00:00');
        $this->putJson("/api/admin/offres/{$offre->id_offre}/moderation", [
            'decision' => 'approved',
        ])->assertOk();

        $this->assertSame(
            '2026-06-24 14:45:00',
            $offre->fresh()->date_publication->format('Y-m-d H:i:s')
        );
    }

    public function test_past_deadline_is_rejected_on_manual_creation_and_update(): void
    {
        $member = User::factory()->create(['role' => 'membre']);
        Sanctum::actingAs($member);

        $this->postJson('/api/offres', [
            ...$this->validOfferPayload(),
            'date_limite' => '2026-06-22',
        ])->assertUnprocessable()
            ->assertJsonPath('errors.date_limite.0', 'La date limite doit être aujourd’hui ou une date future.');

        $offre = Offre::create([
            'titre' => 'Offre modifiable',
            'description' => 'Description complète.',
            'type' => 'emploi',
            'statut' => 'active',
            'moderation_status' => 'approved',
            'id_utilisateur' => $member->id,
            'date_limite' => '2026-06-30',
        ]);

        $this->putJson("/api/offres/{$offre->id_offre}", [
            'date_limite' => '2026-06-22',
        ])->assertUnprocessable()
            ->assertJsonPath('errors.date_limite.0', 'La date limite doit être aujourd’hui ou une date future.');

        $this->assertSame('2026-06-30', $offre->fresh()->date_limite->format('Y-m-d'));
    }

    public function test_past_deadline_is_rejected_by_scraper_import(): void
    {
        $this->withHeader('X-Scraper-Key', 'test-scraper-key')
            ->postJson('/api/scraper/offres', [
                'titre' => 'Stage déjà expiré',
                'description' => 'Une annonce suffisamment détaillée pour tester la validation de date.',
                'type' => 'stage',
                'date_limite' => '2026-06-22',
            ])->assertUnprocessable()
            ->assertJsonPath('errors.date_limite.0', 'La date limite doit être aujourd’hui ou une date future.');

        $this->assertDatabaseCount('offres', 0);
    }

    public function test_admin_cannot_reactivate_an_offer_with_a_past_deadline(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $offre = Offre::create([
            'titre' => 'Offre expirée',
            'description' => 'Description complète.',
            'type' => 'emploi',
            'statut' => 'expiree',
            'moderation_status' => 'approved',
            'date_limite' => '2026-06-22',
        ]);
        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/offres/{$offre->id_offre}/statut", [
            'statut' => 'active',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('statut');

        $this->assertSame('expiree', $offre->fresh()->statut);
    }

    private function validOfferPayload(): array
    {
        return [
            'titre' => 'Stage développeur Laravel',
            'description' => str_repeat('Description complète pour cette opportunité. ', 4),
            'type' => 'stage',
            'entreprise' => 'Example',
            'localisation' => 'Douala',
            'date_limite' => '2026-07-15',
        ];
    }
}
