<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Plan;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_crud_sla_replies_and_csat(): void
    {
        $plan = Plan::create([
            'name' => 'Crece',
            'slug' => 'crece',
            'price' => 89.00,
            'max_users' => 10,
            'max_channels' => 5,
            'max_messages' => 10000,
            'sla_first_response_minutes' => 45,
        ]);

        $company = Company::create([
            'name' => 'SLA Corp',
            'plan_id' => $plan->id,
            'onboarded' => true,
        ]);

        $user = User::create([
            'company_id' => $company->id,
            'name' => 'Agent SLA',
            'email' => 'sla@acme.com',
            'password' => bcrypt('secret'),
            'role' => 'admin',
        ]);

        $client = Client::create([
            'company_id' => $company->id,
            'name' => 'Client Support',
        ]);

        $conversation = Conversation::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'channel' => 'whatsapp',
        ]);

        $this->actingAs($user, 'sanctum');

        // 1. Create ticket and verify SLA calculation
        $res = $this->postJson('/api/tickets', [
            'title' => 'Fallo en webhook',
            'client_id' => $client->id,
            'conversation_id' => $conversation->id,
            'priority' => 'high',
        ]);

        $res->assertStatus(201);
        $ticketId = $res->json('id');
        $this->assertNotNull($res->json('sla_expires_at'));

        // 2. Add Internal Note
        $resInternal = $this->postJson("/api/tickets/{$ticketId}/reply", [
            'content' => 'Revisando logs privados del servidor',
            'is_internal' => true,
        ]);
        $resInternal->assertStatus(200);
        $this->assertDatabaseHas('ticket_replies', [
            'ticket_id' => $ticketId,
            'content' => 'Revisando logs privados del servidor',
            'is_internal' => 1,
        ]);
        // Internal note should NOT sync to messages table
        $this->assertDatabaseMissing('messages', [
            'conversation_id' => $conversation->id,
            'content' => "[Ticket #{$ticketId}] Revisando logs privados del servidor",
        ]);

        // 3. Add Public Reply
        $resPublic = $this->postJson("/api/tickets/{$ticketId}/reply", [
            'content' => 'Hola, ya identificamos el problema en su cuenta.',
            'is_internal' => false,
        ]);
        $resPublic->assertStatus(200);
        // Public reply SHOULD sync to messages table in omnichannel conversation
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_type' => 'agent',
            'content' => "[Ticket #{$ticketId}] Hola, ya identificamos el problema en su cuenta.",
        ]);

        // 4. Close ticket with CSAT
        $resClose = $this->putJson("/api/tickets/{$ticketId}", [
            'status' => 'closed',
            'csat_score' => 5,
            'csat_comment' => 'Excelente servicio y muy rápido',
        ]);
        $resClose->assertStatus(200);
        $this->assertEquals('closed', $resClose->json('status'));
        $this->assertEquals(5, $resClose->json('csat_score'));
    }
}
