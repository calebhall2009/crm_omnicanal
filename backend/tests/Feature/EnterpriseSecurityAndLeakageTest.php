<?php

namespace Tests\Feature;

use App\Models\AiKnowledgeItem;
use App\Models\Client;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnterpriseSecurityAndLeakageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        app(\App\Tenant\TenantManager::class)->setCompanyId(null);
        auth()->logout();
        auth()->forgetGuards();
    }

    protected function createTenant($name, $email): array
    {
        $company = Company::create(['name' => $name, 'onboarded' => true]);
        $user = User::create([
            'company_id' => $company->id,
            'name' => "Dueño {$name}",
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);
        return [$company, $user];
    }

    public function test_idor_blocked_on_clients_crud(): void
    {
        [$companyA, $userA] = $this->createTenant('Empresa A', 'usera@test.com');
        [$companyB, $userB] = $this->createTenant('Empresa B', 'userb@test.com');

        // Crear cliente en Empresa B
        $clientB = Client::create([
            'company_id' => $companyB->id,
            'name' => 'Secreto Empresa B',
            'phone' => '5550000002',
            'email' => 'secreto@b.com',
        ]);

        // Actuar como Usuario A
        $this->actingAs($userA);

        // Intento de lectura IDOR
        $this->getJson("/api/clients/{$clientB->id}")->assertStatus(404);

        // Intento de modificación IDOR
        $this->putJson("/api/clients/{$clientB->id}", [
            'name' => 'Hackeado por A',
            'phone' => '5550000002',
        ])->assertStatus(404);

        // Intento de eliminación IDOR
        $this->deleteJson("/api/clients/{$clientB->id}")->assertStatus(404);

        // Verificar integridad en base de datos
        $this->assertDatabaseHas('clients', [
            'id' => $clientB->id,
            'name' => 'Secreto Empresa B',
            'company_id' => $companyB->id,
        ]);
    }

    public function test_idor_blocked_on_pipelines_and_deals(): void
    {
        [$companyA, $userA] = $this->createTenant('Empresa A', 'usera@test.com');
        [$companyB, $userB] = $this->createTenant('Empresa B', 'userb@test.com');

        $pipelineB = Pipeline::create([
            'company_id' => $companyB->id,
            'name' => 'Pipeline Confidencial B',
            'is_default' => true,
        ]);
        $stageB = Stage::create([
            'pipeline_id' => $pipelineB->id,
            'name' => 'Etapa 1',
            'order' => 1,
        ]);
        $dealB = Deal::create([
            'company_id' => $companyB->id,
            'pipeline_id' => $pipelineB->id,
            'stage_id' => $stageB->id,
            'title' => 'Trato Millonario B',
            'value' => 500000,
        ]);

        $this->actingAs($userA);

        $this->getJson("/api/pipelines/{$pipelineB->id}")->assertStatus(404);
        $this->getJson("/api/deals/{$dealB->id}")->assertStatus(404);
        $this->patchJson("/api/deals/{$dealB->id}/stage", ['stage_id' => 999])->assertStatus(404);
    }

    public function test_idor_blocked_on_conversations_and_messages(): void
    {
        [$companyA, $userA] = $this->createTenant('Empresa A', 'usera@test.com');
        [$companyB, $userB] = $this->createTenant('Empresa B', 'userb@test.com');

        $clientB = Client::create([
            'company_id' => $companyB->id,
            'name' => 'Cliente Chat B',
            'phone' => '5550000003',
        ]);
        $convB = Conversation::create([
            'company_id' => $companyB->id,
            'client_id' => $clientB->id,
            'channel' => 'whatsapp',
            'status' => 'open',
        ]);
        Message::create([
            'company_id' => $companyB->id,
            'conversation_id' => $convB->id,
            'sender_type' => 'client',
            'content' => 'Mensaje privado de B',
        ]);

        $this->actingAs($userA);

        $this->getJson("/api/inbox/conversations/{$convB->id}")->assertStatus(404);
        $this->postJson("/api/inbox/conversations/{$convB->id}/messages", [
            'content' => 'Inyección de mensaje desde A',
        ])->assertStatus(404);
    }

    public function test_idor_blocked_on_ai_knowledge_base(): void
    {
        [$companyA, $userA] = $this->createTenant('Empresa A', 'usera@test.com');
        [$companyB, $userB] = $this->createTenant('Empresa B', 'userb@test.com');

        $faqB = AiKnowledgeItem::create([
            'company_id' => $companyB->id,
            'question' => '¿Fórmula secreta B?',
            'answer' => 'Fórmula secreta de empresa B',
            'category' => 'Confidencial',
            'is_active' => true,
        ]);

        $this->actingAs($userA);

        $this->putJson("/api/ai/knowledge/{$faqB->id}", [
            'question' => 'Robado',
            'answer' => 'Robado',
            'category' => 'General',
            'is_active' => false,
        ])->assertStatus(404);

        $this->deleteJson("/api/ai/knowledge/{$faqB->id}")->assertStatus(404);
    }

    public function test_mass_assignment_company_id_override_is_prevented(): void
    {
        [$companyA, $userA] = $this->createTenant('Empresa A', 'usera@test.com');
        [$companyB, $userB] = $this->createTenant('Empresa B', 'userb@test.com');

        $this->actingAs($userA);

        // Intento de inyectar el company_id de la Empresa B en la solicitud
        $response = $this->postJson('/api/clients', [
            'name' => 'Cliente Intruso',
            'phone' => '5559998888',
            'email' => 'intruso@hack.com',
            'company_id' => $companyB->id, // <- Intento de secuestro de tenant
        ]);

        $response->assertStatus(201);

        // Verificar que el cliente fue asignado estrictamente a Empresa A (el tenant del usuario autenticado)
        $client = Client::where('email', 'intruso@hack.com')->first();
        $this->assertEquals($companyA->id, $client->company_id);
        $this->assertNotEquals($companyB->id, $client->company_id);
    }

    public function test_sql_injection_resilience_in_search_queries(): void
    {
        [$companyA, $userA] = $this->createTenant('Empresa A', 'usera@test.com');
        [$companyB, $userB] = $this->createTenant('Empresa B', 'userb@test.com');

        Client::create(['company_id' => $companyA->id, 'name' => 'Legítimo A', 'phone' => '1111']);
        Client::create(['company_id' => $companyB->id, 'name' => 'Secreto B', 'phone' => '2222']);

        $this->actingAs($userA);

        // Inyección SQL clásica para intentar evadir el WHERE company_id = ?
        $sqlPayload = "' OR 1=1; DROP TABLE clients; --";
        $response = $this->getJson("/api/clients?search=" . urlencode($sqlPayload));

        $response->assertStatus(200);
        $data = $response->json('data') ?? $response->json();

        // Verificar que NO retornó el cliente de la empresa B
        $names = collect($data)->pluck('name')->toArray();
        $this->assertNotContains('Secreto B', $names);
    }

    public function test_xss_payload_in_names_is_stored_safely(): void
    {
        [$companyA, $userA] = $this->createTenant('Empresa A', 'usera@test.com');
        $this->actingAs($userA);

        $xssPayload = "<script>alert('xss')</script> & <b>test</b>";

        $response = $this->postJson('/api/clients', [
            'name' => $xssPayload,
            'phone' => '5553334444',
            'email' => 'xss@test.com',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('clients', [
            'email' => 'xss@test.com',
            'name' => $xssPayload, // Eloquent / PDO parametriza y guarda como texto plano exacto
        ]);
    }
}
