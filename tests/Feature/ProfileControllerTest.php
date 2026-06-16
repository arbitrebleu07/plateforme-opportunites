<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_profile_name_and_email(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Profil mis à jour avec succès']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);
    }

    public function test_update_profile_with_photo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'name' => $user->name,
            'email' => $user->email,
            'photo' => UploadedFile::fake()->image('avatar.jpg'),
        ]);

        $response->assertOk();

        $user->refresh();
        $this->assertNotNull($user->photo);
        Storage::disk('public')->assertExists($user->photo);
    }

    public function test_update_profile_replaces_old_photo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['photo' => 'photos/old.jpg']);
        Storage::disk('public')->put('photos/old.jpg', 'old');

        $this->actingAs($user)->postJson('/api/profile', [
            'name' => $user->name,
            'email' => $user->email,
            'photo' => UploadedFile::fake()->image('new.jpg'),
        ]);

        Storage::disk('public')->assertMissing('photos/old.jpg');
    }

    public function test_update_profile_validation_requires_name_and_email(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/profile', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_update_profile_rejects_duplicate_email(): void
    {
        $other = User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'name' => 'Test',
            'email' => 'taken@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_update_profile_allows_keeping_own_email(): void
    {
        $user = User::factory()->create(['email' => 'mine@example.com']);

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'name' => 'Same Email',
            'email' => 'mine@example.com',
        ]);

        $response->assertOk();
    }

    public function test_update_profile_requires_authentication(): void
    {
        $response = $this->postJson('/api/profile', [
            'name' => 'Test',
            'email' => 'test@test.com',
        ]);

        $response->assertStatus(401);
    }
}
