<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class BillingSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_trial_period_grants_access()
    {
        $company = Company::create([
            'name' => 'Trial Corp',
            'created_at' => now()->subDays(5) // 5 days old, within 14 days
        ]);
        
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Test User',
            'email' => 'test@trial.com',
            'password' => bcrypt('password')
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/tickets');
        
        $response->assertStatus(200);
    }

    public function test_expired_trial_blocks_access()
    {
        $company = Company::create([
            'name' => 'Expired Corp',
        ]);
        $company->created_at = now()->subDays(15);
        $company->save(['timestamps' => false]);
        
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Test User',
            'email' => 'test@expired.com',
            'password' => bcrypt('password')
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/tickets');
        
        $response->assertStatus(403);
        $response->assertJson([
            'code' => 'SUBSCRIPTION_REQUIRED'
        ]);
    }
    
    public function test_billing_info_endpoint_returns_correct_trial_status()
    {
        $plan = Plan::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'price' => 19.00,
            'max_users' => 2,
            'max_channels' => 1,
            'max_messages' => 1000,
        ]);
        
        $company = Company::create([
            'name' => 'Info Corp',
            'plan_id' => $plan->id,
        ]);
        $company->created_at = now()->subDays(10);
        $company->save(['timestamps' => false]);
        
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Test User',
            'email' => 'test@info.com',
            'password' => bcrypt('password')
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/billing/info');
        
        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'free_trial',
            'trial_days_left' => 4,
        ]);
        
        $this->assertEquals('Starter', $response->json('plan.name'));
    }
}
