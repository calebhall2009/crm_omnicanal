<?php

namespace Tests\Feature;

use App\Models\AiUsageLog;
use App\Models\Client;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Pipeline;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemStressAndLimitsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        app(\App\Tenant\TenantManager::class)->setCompanyId(null);
        auth()->logout();
        auth()->forgetGuards();
    }

    protected function createTenantWithPlan($name, $planSlug): array
    {
        $company = Company::create(['name' => $name, 'onboarded' => true]);
        $user = User::create([
            'company_id' => $company->id,
            'name' => "Dueño {$name}",
            'email' => strtolower(str_replace(' ', '', $name)) . "@test.com",
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);

        $plan = Plan::where('slug', $planSlug)->first() ?: Plan::create([
            'name' => ucfirst($planSlug),
            'slug' => $planSlug,
            'price' => $planSlug === 'emprende' ? 29 : 89,
            'max_channels' => $planSlug === 'emprende' ? 1 : 5,
            'max_users' => $planSlug === 'emprende' ? 2 : 10,
            'max_messages' => $planSlug === 'emprende' ? 1000 : 10000,
        ]);

        Subscription::create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        return [$company, $user, $plan];
    }

    public function test_plan_emprende_feature_gating_limits_pipelines(): void
    {
        [$company, $user] = $this->createTenantWithPlan('Emprende Corp', 'emprende');
        $this->actingAs($user);

        // Primer pipeline creado por defecto o manualmente
        $response1 = $this->postJson('/api/pipelines', [
            'name' => 'Ventas Principales',
            'is_default' => true,
        ]);
        $response1->assertStatus(201);

        // Intento de crear un segundo pipeline en el plan Emprende
        $response2 = $this->postJson('/api/pipelines', [
            'name' => 'Ventas Secundarias',
            'is_default' => false,
        ]);

        $response2->assertStatus(403);
        $response2->assertJsonFragment([
            'feature_locked' => true,
        ]);
    }

    public function test_plan_crece_allows_unlimited_pipelines(): void
    {
        [$company, $user] = $this->createTenantWithPlan('Crece Corp', 'crece');
        $this->actingAs($user);

        for ($i = 1; $i <= 4; $i++) {
            $response = $this->postJson('/api/pipelines', [
                'name' => "Pipeline Crece {$i}",
                'is_default' => ($i === 1),
            ]);
            $response->assertStatus(201);
        }

        $this->assertEquals(4, Pipeline::count());
    }

    public function test_ai_quota_exceeded_switches_auto_reply_to_blocked_suggestion(): void
    {
        [$company, $user, $plan] = $this->createTenantWithPlan('Quota Corp', 'starter');

        // Simular que ya consumió su cuota mensual (ej. 1000 peticiones)
        AiUsageLog::create([
            'company_id' => $company->id,
            'provider' => 'gemini',
            'model' => 'gemini-1.5-flash',
            'tokens_used' => 50000,
            'requests_count' => $plan->max_messages, // 1000
            'estimated_cost' => 0.15,
            'action' => 'auto_reply',
        ]);

        // Verificar que el endpoint interno reporta cuota excedida
        $contextResponse = $this->getJson("/api/internal/ai/context/{$company->id}", [
            'X-Internal-Secret' => config('services.ai.internal_secret', 'omniflow_internal_secret_2026')
        ]);
        $contextResponse->assertStatus(200);
        $this->assertTrue($contextResponse->json('quota_exceeded'));

        // Simular callback del worker AI indicando bloqueo por cuota
        $client = Client::create(['company_id' => $company->id, 'name' => 'Cliente Chat', 'phone' => '123456789']);
        $conversation = Conversation::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'channel' => 'whatsapp',
            'status' => 'open',
        ]);

        $callbackResponse = $this->postJson('/api/internal/ai/callback', [
            'company_id' => $company->id,
            'conversation_id' => $conversation->id,
            'message_id' => 1,
            'action_taken' => 'blocked_quota',
            'reply_text' => 'Sugerencia de respuesta guardada pero no enviada automáticamente.',
            'sentiment' => 'neutral',
            'intent' => 'consulta',
            'usage_log' => [
                'provider' => 'gemini',
                'model' => 'gemini-1.5-flash',
                'tokens_used' => 100,
                'requests_count' => 1,
                'estimated_cost' => 0.0001,
            ],
        ], [
            'X-Internal-Secret' => config('services.ai.internal_secret', 'omniflow_internal_secret_2026')
        ]);

        $callbackResponse->assertStatus(200);

        // Verificar que se guardó como sugerencia para el agente humano
        $conversation->refresh();
        $this->assertEquals('Sugerencia de respuesta guardada pero no enviada automáticamente.', $conversation->ai_suggested_reply);

        // Verificar que NO se envió un mensaje automático (sender_type = ai)
        $aiMessagesCount = Message::where('conversation_id', $conversation->id)->where('sender_type', 'ai')->count();
        $this->assertEquals(0, $aiMessagesCount);
    }

    public function test_meta_24h_sla_window_enforcement(): void
    {
        [$company, $user] = $this->createTenantWithPlan('SLA Corp', 'crece');
        $this->actingAs($user);

        $client = Client::create(['company_id' => $company->id, 'name' => 'SLA Client', 'phone' => '5557778888']);
        $conversation = Conversation::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'channel' => 'whatsapp',
            'status' => 'open',
            'last_client_message_at' => now()->subHours(25), // Ventana de 24h vencida
        ]);

        // Intento de enviar mensaje normal sin plantilla
        $response = $this->postJson("/api/inbox/conversations/{$conversation->id}/messages", [
            'content' => 'Hola, ¿sigues ahí?',
            'is_template' => false,
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error_code' => 'SLA_24H_EXPIRED',
        ]);
    }

    public function test_api_stress_burst_across_multiple_tenants(): void
    {
        $tenants = [];
        for ($t = 1; $t <= 5; $t++) {
            $tenants[] = $this->createTenantWithPlan("Stress Tenant {$t}", 'crece');
        }

        // Crear 5 clientes por tenant y verificar aislamiento bajo ráfaga de lecturas
        foreach ($tenants as $index => [$company, $user, $plan]) {
            $this->actingAs($user);
            for ($c = 1; $c <= 3; $c++) {
                Client::create([
                    'company_id' => $company->id,
                    'name' => "Cliente T{$index}_C{$c}",
                    'phone' => "55500{$index}0{$c}",
                ]);
            }

            // Verificar que al consultar el listado, estrictamente obtiene los 3 de su tenant
            $response = $this->getJson('/api/clients');
            $response->assertStatus(200);
            $this->assertCount(3, $response->json());
        }
    }
}
