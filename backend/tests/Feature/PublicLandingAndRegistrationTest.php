<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicLandingAndRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_plans_endpoint_returns_plans_ordered_by_price(): void
    {
        Plan::create(['name' => 'Plan Caro', 'slug' => 'caro', 'price' => 100.00, 'max_users' => 10, 'max_channels' => 5, 'max_messages' => 1000]);
        Plan::create(['name' => 'Plan Barato', 'slug' => 'barato', 'price' => 10.00, 'max_users' => 1, 'max_channels' => 1, 'max_messages' => 100]);

        $response = $this->getJson('/api/plans');

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertGreaterThanOrEqual(2, count($data));
        $this->assertEquals('barato', $data[0]['slug']);
    }

    public function test_multi_step_registration_creates_onboarded_company_and_subscription(): void
    {
        $plan = Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'price' => 49.00,
            'max_users' => 10,
            'max_channels' => 3,
            'max_messages' => 10000,
        ]);

        $response = $this->postJson('/register', [
            'name' => 'Carlos Dueño',
            'email' => 'carlos@empresa.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'turnstile_token' => '1x000000000000000000000000000000AA', // Dummy turnstile token
            'company_name' => 'Mi Gran Empresa',
            'industry' => 'SaaS',
            'team_size' => '6-15',
            'plan_slug' => 'pro',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'carlos@empresa.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('owner', $user->role);

        $company = $user->company;
        $this->assertNotNull($company);
        $this->assertEquals('Mi Gran Empresa', $company->name);
        $this->assertEquals('SaaS', $company->industry);
        $this->assertTrue($company->onboarded);
        $this->assertEquals($plan->id, $company->plan_id);

        $this->assertDatabaseHas('subscriptions', [
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);
    }
}
