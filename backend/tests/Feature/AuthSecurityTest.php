<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        app(\App\Tenant\TenantManager::class)->setCompanyId(null);
        auth()->logout();
        auth()->forgetGuards();
    }

    public function test_user_can_register_successfully(): void
    {
        $payload = [
            'name' => 'Empresario Seguro',
            'email' => 'nuevo@empresa.com',
            'password' => 'PasswordSeguro123!',
            'password_confirmation' => 'PasswordSeguro123!',
            'turnstile_token' => '1x000000000000000000000000000000AA',
        ];

        $response = $this->postJson('/register', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'nuevo@empresa.com', 'role' => 'owner']);
        $this->assertDatabaseCount('companies', 1);

        $user = User::where('email', 'nuevo@empresa.com')->first();
        $this->assertNotNull($user->company_id);
        $this->assertFalse($user->company->onboarded);
    }

    public function test_register_validation_fails_for_duplicate_email(): void
    {
        $company = Company::create(['name' => 'Dup Corp', 'onboarded' => true]);
        User::factory()->create(['company_id' => $company->id, 'email' => 'duplicado@empresa.com']);

        $payload = [
            'name' => 'Otro Usuario',
            'email' => 'duplicado@empresa.com',
            'password' => 'PasswordSeguro123!',
            'password_confirmation' => 'PasswordSeguro123!',
            'turnstile_token' => '1x000000000000000000000000000000AA',
        ];

        $response = $this->postJson('/register', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_register_validation_fails_for_short_password(): void
    {
        $payload = [
            'name' => 'Usuario Inseguro',
            'email' => 'inseguro@empresa.com',
            'password' => '12345',
            'password_confirmation' => '12345',
            'turnstile_token' => '1x000000000000000000000000000000AA',
        ];

        $response = $this->postJson('/register', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $company = Company::create(['name' => 'Login Corp', 'onboarded' => true]);
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Juan Login',
            'email' => 'juan@logincorp.com',
            'password' => bcrypt('CorrectPassword123!'),
            'role' => 'owner',
        ]);

        $response = $this->postJson('/login', [
            'email' => 'juan@logincorp.com',
            'password' => 'CorrectPassword123!',
        ]);

        $response->assertStatus(200);
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $company = Company::create(['name' => 'Login Corp', 'onboarded' => true]);
        User::create([
            'company_id' => $company->id,
            'name' => 'Juan Login',
            'email' => 'juan@logincorp.com',
            'password' => bcrypt('CorrectPassword123!'),
            'role' => 'owner',
        ]);

        $response = $this->postJson('/login', [
            'email' => 'juan@logincorp.com',
            'password' => 'WrongPassword999!',
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    public function test_login_fails_with_non_existent_email(): void
    {
        $response = $this->postJson('/login', [
            'email' => 'fantasma@noexiste.com',
            'password' => 'AnyPassword123!',
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    public function test_unauthenticated_access_to_protected_api_is_blocked(): void
    {
        $response = $this->getJson('/api/clients');
        $response->assertStatus(401);
    }

    public function test_user_can_logout_successfully(): void
    {
        $company = Company::create(['name' => 'Logout Corp', 'onboarded' => true]);
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Juan Logout',
            'email' => 'juan@logout.com',
            'password' => bcrypt('Password123!'),
            'role' => 'owner',
        ]);

        $this->actingAs($user);
        $this->assertAuthenticated();

        $response = $this->postJson('/logout');
        $response->assertStatus(204);
        $this->assertGuest();
    }
}
