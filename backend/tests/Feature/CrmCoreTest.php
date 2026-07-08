<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Tenant\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmCoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        app(TenantManager::class)->setCompanyId(null);
    }

    public function test_client_crud_and_tenant_isolation_via_api(): void
    {
        $companyA = Company::create(['name' => 'Company A', 'onboarded' => true]);
        $companyB = Company::create(['name' => 'Company B', 'onboarded' => true]);

        $userA = User::create([
            'company_id' => $companyA->id,
            'name' => 'User A',
            'email' => 'usera@example.com',
            'password' => bcrypt('password'),
            'role' => 'owner'
        ]);

        $userB = User::create([
            'company_id' => $companyB->id,
            'name' => 'User B',
            'email' => 'userb@example.com',
            'password' => bcrypt('password'),
            'role' => 'owner'
        ]);

        // User A crea un cliente
        $responseA = $this->actingAs($userA)->postJson('/api/clients', [
            'name' => 'Cliente de A',
            'email' => 'clientea@test.com',
            'tags' => ['VIP', 'Nuevo'],
        ]);

        $responseA->assertStatus(201)
                  ->assertJsonFragment(['name' => 'Cliente de A']);

        // User B consulta clientes y no debe ver el cliente de A
        $responseB = $this->actingAs($userB)->getJson('/api/clients');
        $responseB->assertStatus(200)
                  ->assertJsonCount(0);

        // User A consulta clientes y ve su cliente
        $responseAIndex = $this->actingAs($userA)->getJson('/api/clients');
        $responseAIndex->assertStatus(200)
                       ->assertJsonCount(1);
    }

    public function test_pipeline_feature_gating_in_starter_plan(): void
    {
        $planStarter = Plan::create([
            'name' => 'Emprende',
            'slug' => 'starter',
            'price' => 19,
            'max_users' => 2,
            'max_channels' => 1,
            'max_messages' => 1000,
        ]);

        $company = Company::create(['name' => 'Starter Company', 'onboarded' => true]);
        Subscription::create(['company_id' => $company->id, 'plan_id' => $planStarter->id, 'status' => 'active']);

        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Starter User',
            'email' => 'starter@example.com',
            'password' => bcrypt('password'),
            'role' => 'owner'
        ]);

        // 1er pipeline creado con éxito
        $response1 = $this->actingAs($user)->postJson('/api/pipelines', [
            'name' => 'Pipeline 1',
            'stages' => ['Lead', 'Cierre']
        ]);
        $response1->assertStatus(201);

        // 2do pipeline debe ser bloqueado con 403 Forbidden
        $response2 = $this->actingAs($user)->postJson('/api/pipelines', [
            'name' => 'Pipeline 2 (Bloqueado)',
        ]);
        $response2->assertStatus(403)
                  ->assertJsonFragment(['feature_locked' => true]);
    }

    public function test_dashboard_stats_endpoint(): void
    {
        $company = Company::create(['name' => 'Stats Company', 'onboarded' => true]);
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Stats User',
            'email' => 'stats@example.com',
            'password' => bcrypt('password'),
            'role' => 'owner'
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'summary' => [
                         'total_clients',
                         'total_deals',
                         'won_deals_value',
                         'open_pipeline_value',
                         'open_conversations',
                     ],
                     'tickets_by_status',
                     'pipeline_value_by_stage',
                     'ai_usage',
                 ]);
    }
}
