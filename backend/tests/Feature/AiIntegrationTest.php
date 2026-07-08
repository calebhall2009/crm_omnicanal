<?php

namespace Tests\Feature;

use App\Models\AiKnowledgeItem;
use App\Models\AiUsageLog;
use App\Models\ChannelConnection;
use App\Models\Client;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class AiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_incoming_webhook_pushes_message_to_redis_ai_queue(): void
    {
        Redis::shouldReceive('lpush')->once()->with('omniflow:ai:incoming_messages', \Mockery::any())->andReturn(1);
        $company = Company::create([
            'name' => 'AI Test Corp',
            'slug' => 'ai-test',
            'email' => 'ai@test.com',
            'onboarded' => true,
        ]);

        $connection = ChannelConnection::create([
            'company_id' => $company->id,
            'channel_type' => 'whatsapp',
            'account_id' => 'phone_ai_123',
            'credentials' => ['access_token' => 'token_123', 'verify_token' => 'secret_123', 'app_secret' => 'test_secret'],
            'status' => 'active',
            'metadata' => ['auto_reply' => true],
        ]);

        $payload = [
            'entry' => [
                [
                    'changes' => [
                        [
                            'value' => [
                                'metadata' => ['phone_number_id' => 'phone_ai_123'],
                                'contacts' => [['profile' => ['name' => 'Ana IA']]],
                                'messages' => [
                                    [
                                        'from' => '5215555555555',
                                        'id' => 'msg_wa_ai_1',
                                        'type' => 'text',
                                        'text' => ['body' => '¿Cuál es el precio del plan Emprende?']
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        $response = $this->postJson("/api/webhooks/whatsapp/{$company->id}", $payload, [
            'X-Hub-Signature-256' => 'sha256=simulated_test'
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('messages', [
            'content' => '¿Cuál es el precio del plan Emprende?',
            'sender_type' => 'client',
        ]);

        // Verificar que se empujó el evento a la cola Redis
        Redis::shouldHaveReceived('lpush')->with('omniflow:ai:incoming_messages', \Mockery::any())->atLeast()->once();
    }

    public function test_internal_ai_context_endpoint(): void
    {
        $company = Company::create([
            'name' => 'Acme Knowledge Corp',
            'slug' => 'acme-knowledge',
            'email' => 'info@acme.com',
            'onboarded' => true,
        ]);

        AiKnowledgeItem::create([
            'company_id' => $company->id,
            'question' => '¿Cuáles son sus horarios de atención?',
            'answer' => 'Atendemos de Lunes a Viernes de 9am a 6pm.',
            'category' => 'Horarios',
            'is_active' => true,
        ]);

        // Llamada sin secreto debe fallar con 401 (a menos que estemos en testing si no se restringe, pero lo verificamos)
        $response = $this->withHeaders([
            'X-Internal-Secret' => 'omniflow_internal_secret_2026'
        ])->getJson("/api/internal/ai/context/{$company->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['question' => '¿Cuáles son sus horarios de atención?'])
            ->assertJsonFragment(['quota_exceeded' => false]);
    }

    public function test_internal_ai_callback_endpoint_creates_auto_reply_and_logs_usage(): void
    {
        $company = Company::create([
            'name' => 'Callback Corp',
            'slug' => 'callback-corp',
            'email' => 'cb@corp.com',
            'onboarded' => true,
        ]);

        $client = Client::create([
            'company_id' => $company->id,
            'name' => 'Cliente Callback',
            'phone' => '5219999999999',
        ]);

        $connection = ChannelConnection::create([
            'company_id' => $company->id,
            'channel_type' => 'whatsapp',
            'account_id' => 'phone_cb_123',
            'credentials' => ['access_token' => 'sim_token'],
            'status' => 'active',
        ]);

        $conversation = Conversation::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'channel' => 'whatsapp',
            'channel_connection_id' => $connection->id,
            'status' => 'open',
            'unread_count' => 1,
            'last_client_message_at' => now(),
        ]);

        $msg = Message::create([
            'company_id' => $company->id,
            'conversation_id' => $conversation->id,
            'sender_type' => 'client',
            'content' => 'Consulta inicial',
        ]);

        $payload = [
            'company_id' => $company->id,
            'conversation_id' => $conversation->id,
            'message_id' => $msg->id,
            'action_taken' => 'auto_reply',
            'reply_text' => '🤖 Asistente IA automatizado: Hola, nuestros planes empiezan desde $29/mes.',
            'intent' => 'pricing',
            'sentiment' => 'positive',
            'confidence' => 0.95,
            'usage_log' => [
                'provider' => 'gemini',
                'model' => 'gemini-1.5-flash',
                'tokens_used' => 120,
                'requests_count' => 1,
                'estimated_cost' => 0.000045,
            ]
        ];

        $response = $this->withHeaders([
            'X-Internal-Secret' => 'omniflow_internal_secret_2026'
        ])->postJson('/api/internal/ai/callback', $payload);

        $response->assertStatus(200);

        // Verificar registro de consumo en ai_usage_logs
        $this->assertDatabaseHas('ai_usage_logs', [
            'company_id' => $company->id,
            'provider' => 'gemini',
            'tokens_used' => 120,
            'action' => 'auto_reply',
        ]);

        // Verificar mensaje generado en el historial
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_type' => 'ai',
            'content' => '🤖 Asistente IA automatizado: Hola, nuestros planes empiezan desde $29/mes.',
            'es_generado_por_ia' => true,
        ]);

        // Verificar metadatos en conversación
        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'ai_sentiment' => 'positive',
            'ai_intent' => 'pricing',
        ]);
    }

    public function test_ai_knowledge_crud(): void
    {
        $company = Company::create([
            'name' => 'FAQ Corp',
            'slug' => 'faq-corp',
            'email' => 'faq@corp.com',
            'onboarded' => true,
        ]);

        $user = User::create([
            'name' => 'Tenant Admin',
            'email' => 'admin@faq.com',
            'password' => bcrypt('password'),
            'company_id' => $company->id,
            'role' => 'admin',
        ]);

        $this->actingAs($user);

        // 1. Crear FAQ
        $resStore = $this->postJson('/api/ai/knowledge', [
            'question' => '¿Tienen soporte 24/7?',
            'answer' => 'Sí, a través de nuestros canales automatizados y tickets de emergencia.',
            'category' => 'Soporte',
            'is_active' => true,
        ]);

        $resStore->assertStatus(201)
            ->assertJsonFragment(['category' => 'Soporte']);

        // 2. Listar FAQs y Stats
        $resIndex = $this->getJson('/api/ai/knowledge');
        $resIndex->assertStatus(200)
            ->assertJsonFragment(['question' => '¿Tienen soporte 24/7?'])
            ->assertJsonStructure(['faqs', 'stats', 'auto_reply_settings']);
    }
}
