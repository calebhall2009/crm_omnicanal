<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Project;
use App\Models\User;
use App\Tenant\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear any leftover tenant state
        app(TenantManager::class)->setCompanyId(null);
    }

    public function test_queries_are_scoped_to_the_authenticated_users_company(): void
    {
        // 1. Create two companies
        $companyA = Company::create(['name' => 'Company A', 'onboarded' => true]);
        $companyB = Company::create(['name' => 'Company B', 'onboarded' => true]);

        // 2. Create one user for each company
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
            'role' => 'admin'
        ]);

        // 3. Create projects using TenantManager to set scope during creation (since we are in CLI/unauthenticated setup here)
        $tenantManager = app(TenantManager::class);

        $tenantManager->setCompanyId($companyA->id);
        $projectA = Project::create(['title' => 'Project of A']);

        $tenantManager->setCompanyId($companyB->id);
        $projectB = Project::create(['title' => 'Project of B']);

        $tenantManager->setCompanyId(null); // Reset

        // 4. Act as User A (forces TenantMiddleware to set Company A's tenant)
        $this->actingAs($userA);

        // Fetch projects through HTTP request or directly trigger middleware/scope
        // Let's trigger TenantMiddleware manually or simulate it by setting the tenant ID (since direct model calls in test don't run middleware unless we make a request, but we can verify the scope works when companyId is set)
        $tenantManager->setCompanyId($userA->company_id);

        $projects = Project::all();
        $this->assertCount(1, $projects);
        $this->assertEquals('Project of A', $projects->first()->title);

        // 5. Act as User B
        $this->actingAs($userB);
        $tenantManager->setCompanyId($userB->company_id);

        $projects = Project::all();
        $this->assertCount(1, $projects);
        $this->assertEquals('Project of B', $projects->first()->title);
    }

    public function test_creating_a_model_automatically_assigns_the_current_tenant_id(): void
    {
        $company = Company::create(['name' => 'Test Company', 'onboarded' => true]);
        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role' => 'owner'
        ]);

        // Act as user
        $this->actingAs($user);
        app(TenantManager::class)->setCompanyId($company->id);

        // Create project without explicitly specifying company_id
        $project = Project::create(['title' => 'Auto Scope Project']);

        $this->assertEquals($company->id, $project->company_id);
    }
}
