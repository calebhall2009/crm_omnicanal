<?php

namespace Tests\Feature;

use App\Models\ChannelConnection;
use App\Models\Client;
use App\Models\ClientChannelIdentity;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OmnichannelInboxTest extends TestCase
{
    use RefreshDatabase;

    private function createTenantUser(string $planSlug = 'pro'): array
    {
        $plan = Plan::create([
            'name' => ucfirst($planSlug),
            'slug' => $planSlug,
            'price' => 29,
            'max_users' => 10,
            'max_channels' => $planSlug === 'starter' ? 1 : 10,
            'max_messages' => 1000,
        ]);

        $company = Company::create([
            'name' => "Test Company {$planSlug}",
            'industry' => 'Tech',
            'team_size' => '1-5',
            'channels' => ['whatsapp'],
            'main_goal' => 'Support',
            'onboarded' => true,
        ]);

        Subscription::create([
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Agent User',
            'email' => "agent_{$planSlug}@test.com",
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);

        return [$user, $company, $plan];
    }

    public function test_channel_connection_feature_gating_in_starter_plan(): void
    {
        [$user, $company] = $this->createTenantUser('starter');

        $this->actingAs($user, 'sanctum');

        // 1st channel connection should succeed
        $response1 = $this->postJson('/api/channels', [
            'channel_type' => 'whatsapp',
            'account_id' => 'wa_phone_1',
            'credentials' => ['access_token' => 'token_1'],
        ]);
        $response1->assertStatus(201);

        // 2nd channel connection should fail with 403 Feature Gating
        $response2 = $this->postJson('/api/channels', [
            'channel_type' => 'instagram',
            'account_id' => 'ig_page_1',
            'credentials' => ['access_token' => 'token_2'],
        ]);
        $response2->assertStatus(403)
            ->assertJsonPath('error_code', 'FEATURE_LIMIT_EXCEEDED');
    }

    public function test_telegram_channel_connection_and_webhook_secret(): void
    {
        [$user, $company] = $this->createTenantUser('pro');

        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/channels', [
            'channel_type' => 'telegram',
            'account_id' => 'test_bot',
            'credentials' => ['bot_token' => 'test_bot_token_123'],
        ]);

        $response->assertStatus(201);
        $connection = ChannelConnection::where('company_id', $company->id)->first();
        $this->assertNotNull($connection->credentials['secret_token']);
        $this->assertStringStartsWith('omniflow_tg_', $connection->credentials['secret_token']);
    }

    public function test_webhook_message_normalization_and_client_identity(): void
    {
        [$user, $company] = $this->createTenantUser('pro');

        $connection = ChannelConnection::create([
            'company_id' => $company->id,
            'channel_type' => 'whatsapp',
            'account_id' => '123456789',
            'credentials' => ['access_token' => 'token_test', 'app_secret' => 'test_secret'],
            'status' => 'active',
        ]);

        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [
                [
                    'id' => '888888888',
                    'changes' => [
                        [
                            'value' => [
                                'metadata' => ['phone_number_id' => '123456789'],
                                'contacts' => [
                                    ['profile' => ['name' => 'María López']]
                                ],
                                'messages' => [
                                    [
                                        'from' => '34611223344',
                                        'id' => 'wamid.test.123',
                                        'timestamp' => '1680000000',
                                        'text' => ['body' => 'Hola desde WhatsApp Webhook'],
                                        'type' => 'text'
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        $response = $this->postJson("/api/webhooks/whatsapp/{$company->id}", $payload);
        $response->assertStatus(200);

        // Check Client and Identity creation
        $this->assertDatabaseHas('client_channel_identities', [
            'company_id' => $company->id,
            'channel_type' => 'whatsapp',
            'channel_identifier' => '34611223344',
        ]);

        $client = Client::where('company_id', $company->id)->where('name', 'María López')->first();
        $this->assertNotNull($client);

        // Check Conversation and Message
        $this->assertDatabaseHas('conversations', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'channel' => 'whatsapp',
            'unread_count' => 1,
        ]);

        $this->assertDatabaseHas('messages', [
            'company_id' => $company->id,
            'sender_type' => 'client',
            'content' => 'Hola desde WhatsApp Webhook',
        ]);
    }

    public function test_twenty_four_hour_window_enforcement(): void
    {
        [$user, $company] = $this->createTenantUser('pro');

        $client = Client::create([
            'company_id' => $company->id,
            'name' => 'Carlos SLA Test',
            'phone' => '34699887766',
        ]);

        $connection = ChannelConnection::create([
            'company_id' => $company->id,
            'channel_type' => 'whatsapp',
            'account_id' => 'test_phone_id',
            'status' => 'active',
        ]);

        $conversation = Conversation::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'channel' => 'whatsapp',
            'channel_connection_id' => $connection->id,
            'status' => 'open',
            'unread_count' => 0,
            'last_client_message_at' => now()->subHours(25), // Over 24 hours ago
        ]);

        $this->actingAs($user, 'sanctum');

        // Attempting to send free text without template should fail with 422
        $res1 = $this->postJson("/api/inbox/conversations/{$conversation->id}/messages", [
            'content' => 'Mensaje libre fuera de ventana',
            'is_template' => false,
        ]);
        $res1->assertStatus(422)
            ->assertJsonPath('error_code', 'SLA_24H_EXPIRED');

        // Sending with is_template = true should succeed
        $res2 = $this->postJson("/api/inbox/conversations/{$conversation->id}/messages", [
            'content' => 'Plantilla aprobada de recontacto',
            'is_template' => true,
        ]);
        $res2->assertStatus(201);
    }
}
