<?php

namespace Tests\Unit\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_admin_route(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->getJson('/api/admin/stats');

        $response->assertOk();
    }

    public function test_membre_is_denied_access(): void
    {
        $user = User::factory()->create(['role' => 'membre']);

        $response = $this->actingAs($user)->getJson('/api/admin/stats');

        $response->assertStatus(403)
            ->assertJson(['message' => 'Accès refusé. Réservé aux administrateurs.']);
    }

    public function test_visiteur_is_denied_access(): void
    {
        $user = User::factory()->create(['role' => 'visiteur']);

        $response = $this->actingAs($user)->getJson('/api/admin/stats');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_is_denied_access(): void
    {
        $response = $this->getJson('/api/admin/stats');

        $response->assertStatus(401);
    }
}
