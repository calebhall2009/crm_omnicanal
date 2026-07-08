<?php

namespace Database\Seeders;

use App\Models\ChannelConnection;
use App\Models\Client;
use App\Models\ClientChannelIdentity;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Database\Seeder;

class CrmSeeder extends Seeder
{
    /**
     * Run the database seeds for CRM module.
     */
    public function run(): void
    {
        $company = Company::where('name', 'Acme Corp')->first();
        if (!$company) {
            return;
        }

        $user = \App\Models\User::where('company_id', $company->id)->first();

        // 0. Conexiones de canal (WhatsApp, Instagram, Telegram)
        $waConn = ChannelConnection::firstOrCreate([
            'company_id' => $company->id,
            'channel_type' => 'whatsapp',
        ], [
            'account_id' => 'sim_wa_99887766',
            'credentials' => ['access_token' => 'sim_wa_token', 'verify_token' => 'omniflow_wa_secret'],
            'status' => 'active',
            'metadata' => ['phone_number' => '+34 600 000 000', 'display_name' => 'Acme WhatsApp Business'],
        ]);

        $igConn = ChannelConnection::firstOrCreate([
            'company_id' => $company->id,
            'channel_type' => 'instagram',
        ], [
            'account_id' => 'sim_ig_11223344',
            'credentials' => ['access_token' => 'sim_ig_token', 'verify_token' => 'omniflow_ig_secret'],
            'status' => 'active',
            'metadata' => ['username' => '@acmecorp_official'],
        ]);

        $tgConn = ChannelConnection::firstOrCreate([
            'company_id' => $company->id,
            'channel_type' => 'telegram',
        ], [
            'account_id' => 'sim_tg_bot',
            'credentials' => ['bot_token' => 'sim_tg_token_12345', 'secret_token' => 'omniflow_tg_secret'],
            'status' => 'active',
            'metadata' => ['bot_username' => '@AcmeCorpSupportBot'],
        ]);

        // 1. Clientes
        $clientNames = [
            ['Carlos Mendoza', 'carlos.mendoza@empresa.com', '+34 611 223 344', ['VIP', 'Recurrente'], 'Cliente de alto valor, interesado en automatización completa.'],
            ['Ana Lucía García', 'ana.garcia@techsolutions.es', '+34 622 334 455', ['Nuevo', 'Inbound'], 'Contactó por campaña de LinkedIn.'],
            ['Roberto Silva', 'rsilva@comercio.com', '+34 633 445 566', ['VIP'], 'Tiene 5 sucursales, requiere integración WhatsApp.'],
            ['Elena Rostova', 'elena@studio.io', '+34 644 556 677', ['Recurrente'], 'Diseñadora UX, busca chatbot para FAQ.'],
            ['Marcos Fernández', 'marcos@retailhub.es', '+34 655 667 788', ['Nuevo', 'Demo'], 'Solicitó demo personalizada para su equipo de 20 agentes.'],
            ['Laura Martínez', 'lmartinez@saludplus.com', '+34 666 778 899', ['VIP', 'Soporte'], 'Clínica médica, prioridad alta en SLA.'],
            ['Fernando Gómez', 'fgomez@logistica.com', '+34 677 889 900', ['Recurrente'], 'Requiere automatizar rastreo de pedidos.'],
            ['Sofía Navarro', 'sofia@inmobiliaria.es', '+34 688 990 011', ['Nuevo'], 'Inmobiliaria con alto volumen de leads por Instagram.'],
            ['Diego Herrera', 'dherrera@construcciones.com', '+34 699 001 122', ['Demo'], 'Evaluando migrar desde Hubspot.'],
            ['Lucía Ortega', 'lortega@moda.es', '+34 610 112 233', ['VIP', 'Inbound'], 'Tienda online, quiere responder dudas por Instagram DMs.'],
            ['Javier Morales', 'jmorales@seguros.com', '+34 620 223 344', ['Recurrente'], 'Agencia de seguros, consulta por WhatsApp.'],
            ['Clara Vidal', 'cvidal@consultoria.com', '+34 630 334 455', ['Nuevo'], 'Consultora de recursos humanos.'],
            ['Pablo Ruiz', 'pruiz@viajes.es', '+34 640 445 566', ['VIP', 'Demo'], 'Agencia de viajes con 30 empleados.'],
            ['Marta Castro', 'mcastro@academia.com', '+34 650 556 677', ['Recurrente', 'Soporte'], 'Academia online con 5,000 alumnos activos.'],
            ['Hugo Domínguez', 'hdominguez@gym.es', '+34 660 667 788', ['Inbound'], 'Cadena de gimnasios, consultas por Telegram bot.'],
        ];

        $clients = [];
        foreach ($clientNames as $index => $c) {
            $client = Client::firstOrCreate(
                [
                    'company_id' => $company->id,
                    'email' => $c[1],
                ],
                [
                    'name' => $c[0],
                    'phone' => $c[2],
                    'tags' => $c[3],
                    'notes' => $c[4],
                ]
            );
            $clients[] = $client;

            // Add channel identities
            $channelType = $index % 3 === 0 ? 'whatsapp' : ($index % 3 === 1 ? 'instagram' : 'telegram');
            ClientChannelIdentity::firstOrCreate([
                'company_id' => $company->id,
                'channel_type' => $channelType,
                'channel_identifier' => $c[2] ?? "user_{$index}",
            ], [
                'client_id' => $client->id,
                'metadata' => ['profile_name' => $c[0]],
            ]);
        }

        // 2. Embudo y Etapas
        $pipeline = Pipeline::firstOrCreate(
            ['company_id' => $company->id, 'name' => 'Ventas General'],
            ['is_default' => true]
        );

        $stagesData = [
            ['Lead', '#3B82F6', 1],
            ['Contacto', '#8B5CF6', 2],
            ['Propuesta', '#F59E0B', 3],
            ['Cierre', '#10B981', 4],
        ];

        $stages = [];
        foreach ($stagesData as $s) {
            $stages[] = Stage::firstOrCreate(
                ['pipeline_id' => $pipeline->id, 'name' => $s[0]],
                ['order' => $s[2]]
            );
        }

        // 3. Deals (20 deals distribuidos)
        $dealTitles = [
            'Licencia Anual Pro', 'Implementación WhatsApp Bot', 'Migración CRM Completa',
            'Soporte VIP 24/7', 'Integración Instagram DMs', 'Automatización IA 50k msgs',
            'Consultoría Omnicanal', 'Plan Empresarial 50 plazas', 'Chatbot FAQ Telegram',
            'Ampliación Canales', 'Renovación Contrato', 'Piloto Inteligencia Artificial',
            'Integración Stripe + CRM', 'Soporte Dedicado L-V', 'Módulo Analítica Avanzada',
            'Capacitación Equipo Ventas', 'Desarrollo API Custom', 'Bandeja Unificada 20 agentes',
            'Auditoría Flujos IA', 'Paquete Starter 1 año'
        ];

        for ($i = 0; $i < 20; $i++) {
            $stage = $stages[$i % count($stages)];
            $client = $clients[$i % count($clients)];
            $value = ($i + 1) * 750 + rand(500, 1500);
            $title = $dealTitles[$i];

            Deal::firstOrCreate([
                'company_id' => $company->id,
                'pipeline_id' => $pipeline->id,
                'title' => $title,
            ], [
                'stage_id' => $stage->id,
                'client_id' => $client->id,
                'value' => $value,
                'status' => $stage->name === 'Cierre' && $i % 2 === 0 ? 'won' : 'open',
            ]);
        }

        // 4. Conversaciones (10 conversaciones con SLA de 24 horas y sugerencias de IA simuladas)
        $channels = ['whatsapp', 'instagram', 'telegram', 'whatsapp', 'instagram', 'whatsapp', 'telegram', 'whatsapp', 'instagram', 'whatsapp'];
        $sentiments = ['positive', 'neutral', 'positive', 'negative', 'positive', 'neutral', 'positive', 'neutral', 'negative', 'positive'];
        $intents = ['compra', 'consulta', 'cotización', 'soporte', 'demo', 'facturación', 'compra', 'duda técnica', 'reclamo', 'renovación'];
        $suggestedReplies = [
            'Hola Carlos, qué gusto saludarte. Para nuestra Licencia Anual Pro contamos con un descuento especial del 15% por pago anticipado. ¿Te gustaría que te envíe la propuesta en PDF por este medio?',
            'Hola Ana Lucía, gracias por escribirnos. Nuestro equipo de soporte está revisando tu consulta sobre la integración y te daremos respuesta en menos de 30 minutos.',
            'Hola Roberto, excelente noticia. Para sincronizar tus 5 sucursales con WhatsApp Business podemos agendar la implementación este jueves. ¿Te queda bien a las 10:00 AM?',
            null,
            'Hola Marcos, por supuesto. Podemos armar una demo personalizada para tus 20 agentes mañana por la tarde. ¿Te reservo un espacio a las 4:00 PM?',
            'Hola Laura, entendemos la urgencia en la clínica médica. He escalado tu ticket con prioridad alta a nuestro equipo de ingeniería.',
            'Hola Fernando, el módulo de rastreo de pedidos se puede conectar vía webhook. Te comparto la documentación técnica oficial.',
            null,
            'Lamentamos el inconveniente con la demora. Te ofrecemos una compensación en tu próxima factura y ya estamos resolviendo el error de conexión.',
            'Hola Lucía, gracias por contactarnos por Instagram. Con gusto te ayudamos a configurar el bot para responder tus DMs automáticamente.'
        ];

        $conversations = [];
        for ($i = 0; $i < 10; $i++) {
            $channel = $channels[$i];
            $connId = $channel === 'whatsapp' ? $waConn->id : ($channel === 'instagram' ? $igConn->id : $tgConn->id);
            // Simular que el mensaje 0 y 1 tienen más de 24 horas (SLA vencido)
            $lastMsgAt = $i < 2 ? now()->subHours(28) : now()->subHours(rand(1, 10));

            $conversations[] = Conversation::updateOrCreate([
                'company_id' => $company->id,
                'client_id' => $clients[$i]->id,
                'channel' => $channel,
            ], [
                'channel_connection_id' => $connId,
                'status' => $i < 6 ? 'open' : 'closed',
                'unread_count' => $i < 6 ? rand(0, 3) : 0,
                'last_client_message_at' => $lastMsgAt,
                'ai_sentiment' => $sentiments[$i],
                'ai_intent' => $intents[$i],
                'ai_suggested_reply' => $suggestedReplies[$i],
            ]);
        }

        // 5. Tickets (25 tickets)
        $ticketStatuses = ['open', 'in_progress', 'waiting', 'resolved', 'closed', 'open', 'in_progress', 'waiting', 'resolved', 'closed', 'open', 'in_progress', 'waiting', 'resolved', 'closed', 'open', 'in_progress', 'waiting', 'resolved', 'closed', 'open', 'in_progress', 'waiting', 'resolved', 'closed'];
        $priorities = ['low', 'medium', 'high', 'urgent'];
        for ($i = 0; $i < 25; $i++) {
            $status = $ticketStatuses[$i];
            $sla = $i % 4 === 0 ? now()->subMinutes(30) : ($i % 4 === 1 ? now()->addMinutes(15) : now()->addHours(2));
            $ticket = Ticket::updateOrCreate([
                'company_id' => $company->id,
                'title' => 'Consulta técnica de integración #' . ($i + 101),
            ], [
                'client_id' => $clients[$i % count($clients)]->id,
                'assigned_to_user_id' => $user->id,
                'conversation_id' => $conversations[$i % count($conversations)]->id,
                'status' => $status,
                'priority' => $priorities[$i % 4],
                'sla_expires_at' => $sla,
                'csat_score' => $status === 'closed' ? rand(3, 5) : null,
                'csat_comment' => $status === 'closed' ? 'Excelente atención, resolvieron muy rápido.' : null,
            ]);

            TicketReply::firstOrCreate([
                'ticket_id' => $ticket->id,
                'content' => 'Revisando logs del servidor para verificar el fallo.',
                'is_internal' => true,
            ], ['user_id' => $user->id]);

            TicketReply::firstOrCreate([
                'ticket_id' => $ticket->id,
                'content' => 'Hola, estamos trabajando en tu requerimiento. Te confirmaremos en breve.',
                'is_internal' => false,
            ], ['user_id' => $user->id]);
        }

        // 6. Mensajes (350 mensajes)
        for ($i = 0; $i < 350; $i++) {
            $senderType = $i < 210 ? 'ai' : ($i < 310 ? 'client' : 'agent');
            Message::create([
                'company_id' => $company->id,
                'conversation_id' => $conversations[$i % count($conversations)]->id,
                'sender_type' => $senderType,
                'content' => 'Mensaje simulado de prueba ' . ($i + 1) . ' (' . $senderType . ')',
                'created_at' => now()->subDays(rand(0, 25)),
            ]);
        }
    }
}
